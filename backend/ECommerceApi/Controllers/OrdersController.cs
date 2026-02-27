using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerceApi.Data;
using ECommerceApi.Models;
using System.Linq;

using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace ECommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Require authentication for this controller
    public class OrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OrdersController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<ActionResult<Order>> CreateOrder([FromBody] OrderRequest orderRequest)
        {
            // Ensure orderRequest is not null and contains items
            if (orderRequest == null || orderRequest.Items == null || !orderRequest.Items.Any())
            {
                return BadRequest("Cart cannot be empty.");
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized("User ID not found in token.");
            }

            var newOrder = new Order
            {
                UserId = userId,
                OrderDate = DateTime.Now,
                Status = "Pending", // Initial status
                OrderItems = new List<OrderItem>(),
                TotalAmount = 0 // Initialize to 0, will be calculated later
            };

            decimal totalAmount = 0;

            foreach (var itemRequest in orderRequest.Items)
            {
                var product = await _context.Products.FindAsync(itemRequest.ProductId);

                if (product == null)
                {
                    return NotFound($"Product with ID {itemRequest.ProductId} not found.");
                }

                if (product.Stock < itemRequest.Quantity)
                {
                    return BadRequest($"Not enough stock for product {product.ProductName}.");
                }

                decimal unitPrice = product.Price;
                int? sellerId = null;

                // Get lowest-price active ProductSeller if exists
                var productSeller = await _context.ProductSellers
                    .Include(ps => ps.Seller)
                    .Where(ps => ps.ProductId == itemRequest.ProductId && ps.IsActive && ps.StockQuantity >= itemRequest.Quantity)
                    .OrderBy(ps => ps.SellerPrice)
                    .FirstOrDefaultAsync();

                int deliveryDays = 7; // Default when no seller
                if (productSeller != null)
                {
                    unitPrice = productSeller.SellerPrice;
                    sellerId = productSeller.SellerId;
                    deliveryDays = productSeller.DeliveryDays > 0 ? productSeller.DeliveryDays : 7;
                    productSeller.StockQuantity -= itemRequest.Quantity;
                }
                else
                {
                    product.Stock -= itemRequest.Quantity;
                }

                var orderItem = new OrderItem
                {
                    ProductId = itemRequest.ProductId,
                    Quantity = itemRequest.Quantity,
                    UnitPrice = unitPrice,
                    SellerId = sellerId,
                    ExpectedDeliveryDate = DateTime.Today.AddDays(deliveryDays),
                    DeliveryStatus = "Pending"
                };

                newOrder.OrderItems.Add(orderItem);
                totalAmount += unitPrice * itemRequest.Quantity;
            }

            decimal benefitDiscountAmount = 0;
            var balance = await _context.UserPointsBalances.FirstOrDefaultAsync(b => b.UserId == userId);
            var totalEarned = balance?.TotalPointsEarned ?? 0;
            var benefits = await _context.PointsBenefits
                .Where(b => b.IsActive && b.PointsThreshold <= totalEarned)
                .OrderByDescending(b => b.PointsThreshold)
                .ToListAsync();
            foreach (var b in benefits)
            {
                if (b.BenefitType == "ExtraDiscountPercent")
                    benefitDiscountAmount += totalAmount * (b.BenefitValue / 100m);
                else if (b.BenefitType == "FixedDiscount")
                    benefitDiscountAmount += Math.Min(b.BenefitValue, totalAmount - benefitDiscountAmount);
                else if (b.BenefitType == "FreeShipping" && b.BenefitValue > 0)
                    benefitDiscountAmount += Math.Min(b.BenefitValue, totalAmount - benefitDiscountAmount);
            }
            benefitDiscountAmount = Math.Min(benefitDiscountAmount, totalAmount);
            newOrder.BenefitDiscountAmount = benefitDiscountAmount;
            var amountAfterBenefits = totalAmount - benefitDiscountAmount;

            decimal pointsDiscountAmount = 0;
            decimal pointsToRedeem = orderRequest.PointsToRedeem > 0 ? orderRequest.PointsToRedeem : 0;

            if (pointsToRedeem > 0)
            {
                if (balance == null || balance.CurrentBalance < pointsToRedeem)
                    return BadRequest("Insufficient points balance.");
                var config = await _context.PointsRedemptionConfigs.FirstOrDefaultAsync(c => c.Id == 1 && c.IsActive);
                var pointsPerRupee = config?.PointsPerRupee ?? 10;
                if (pointsPerRupee <= 0) pointsPerRupee = 10;
                pointsDiscountAmount = Math.Min(pointsToRedeem / pointsPerRupee, amountAfterBenefits);
                var actualPointsUsed = pointsDiscountAmount * pointsPerRupee;

                balance.CurrentBalance -= actualPointsUsed;
                balance.TotalPointsRedeemed += actualPointsUsed;
                balance.LastUpdatedAt = DateTime.Now;

                newOrder.PointsRedeemed = actualPointsUsed;
                newOrder.PointsDiscountAmount = pointsDiscountAmount;
            }

            newOrder.TotalAmount = amountAfterBenefits - pointsDiscountAmount;
            _context.Orders.Add(newOrder);
            await _context.SaveChangesAsync();

            if (pointsToRedeem > 0 && pointsDiscountAmount > 0)
            {
                var actualPointsUsed = newOrder.PointsRedeemed;
                _context.PointsTransactions.Add(new PointsTransaction
                {
                    UserId = userId,
                    OrderId = newOrder.OrderId,
                    SourceUserId = userId,
                    TransactionType = "REDEEMED",
                    PointsAmount = -actualPointsUsed,
                    BalanceAfter = balance?.CurrentBalance ?? 0m,
                    Description = $"Redeemed for order discount (₹{pointsDiscountAmount:F2})",
                    CreatedAt = DateTime.Now
                });
                await _context.SaveChangesAsync();
            }

            await CreateSellerCommissions(newOrder);

            await DistributeOrderPoints(newOrder);

            return CreatedAtAction(nameof(GetOrder), new { id = newOrder.OrderId }, newOrder);
        }

        /// <summary>
        /// Create commission records for order items sold by sellers.
        /// Commission = seller's % of sale; 90% of that goes to PV (8 levels), 10% to Yelooo admin.
        /// </summary>
        [NonAction]
        private async Task CreateSellerCommissions(Order order)
        {
            if (order.OrderItems == null) return;

            foreach (var item in order.OrderItems.Where(i => i.SellerId.HasValue))
            {
                var seller = await _context.Users.FindAsync(item.SellerId!.Value);
                if (seller == null || !seller.CommissionPercent.HasValue || seller.CommissionPercent <= 0)
                    continue;

                var transactionAmount = item.UnitPrice * item.Quantity;
                var commissionPool = Math.Round(transactionAmount * (seller.CommissionPercent.Value / 100m), 2);
                var adminShare = Math.Round(commissionPool * 0.10m, 2); // 10% of commission pool to Yelooo admin

                var commission = new SellerCommission
                {
                    OrderId = order.OrderId,
                    OrderItemId = item.OrderItemId,
                    SellerId = item.SellerId.Value,
                    TransactionAmount = transactionAmount,
                    CommissionPercent = seller.CommissionPercent.Value,
                    CommissionAmount = adminShare,
                    CreatedAt = DateTime.UtcNow
                };
                _context.SellerCommissions.Add(commission);
            }
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Distribute PV points to customer and their upline. PV = seller commission % of each item; 90% of that is distributed across 8 levels.
        /// </summary>
        [NonAction]
        private async Task DistributeOrderPoints(Order order)
        {
            if (order.OrderItems == null) return;
            var customerId = order.UserId;

            try
            {
                var levelConfigs = await _context.PVLevelConfigs
                    .Where(c => c.IsActive)
                    .OrderBy(c => c.LevelId)
                    .ToListAsync();
                if (!levelConfigs.Any()) return;

                foreach (var item in order.OrderItems.Where(i => i.SellerId.HasValue))
                {
                    var seller = await _context.Users.FindAsync(item.SellerId!.Value);
                    if (seller == null || !seller.CommissionPercent.HasValue || seller.CommissionPercent <= 0)
                        continue;

                    var itemAmount = item.UnitPrice * item.Quantity;
                    var commissionPool = itemAmount * (seller.CommissionPercent.Value / 100m);
                    var totalPV = Math.Round(commissionPool * 0.90m, 2); // 90% of commission pool to 8 levels (for record)
                    if (commissionPool <= 0) continue;

                    var uplineChain = new List<(int UserId, int Level)>();
                    uplineChain.Add((customerId, 1));
                    int currentUserId = customerId;
                    for (int level = 2; level <= 8; level++)
                    {
                        var referrerId = await _context.Users
                            .Where(u => u.UserId == currentUserId)
                            .Select(u => u.ReferredByUserId)
                            .FirstOrDefaultAsync();
                        if (referrerId == null) break;
                        uplineChain.Add((referrerId.Value, level));
                        currentUserId = referrerId.Value;
                    }

                    foreach (var (userId, level) in uplineChain)
                    {
                        var levelConfig = levelConfigs.FirstOrDefault(c => c.LevelId == level);
                        if (levelConfig == null) continue;

                        // PV percentage applies to entire commission pool, not the 90% slice
                        decimal pointsToCredit = Math.Round(commissionPool * (levelConfig.PVPercentage / 100m), 2);
                        if (pointsToCredit <= 0) continue;

                        var balance = await _context.UserPointsBalances.FirstOrDefaultAsync(b => b.UserId == userId);
                        if (balance == null)
                        {
                            balance = new UserPointsBalance
                            {
                                UserId = userId,
                                TotalPointsEarned = 0,
                                TotalPointsRedeemed = 0,
                                CurrentBalance = 0
                            };
                            _context.UserPointsBalances.Add(balance);
                            await _context.SaveChangesAsync();
                        }

                        balance.TotalPointsEarned += pointsToCredit;
                        balance.CurrentBalance += pointsToCredit;
                        balance.LastUpdatedAt = DateTime.Now;

                        _context.PointsTransactions.Add(new PointsTransaction
                        {
                            UserId = userId,
                            OrderId = order.OrderId,
                            SourceUserId = customerId,
                            TransactionType = level == 1 ? "EARNED_SELF" : "EARNED_REFERRAL",
                            LevelId = level,
                            OrderAmount = itemAmount,
                            TotalPV = totalPV,
                            PointsAmount = pointsToCredit,
                            BalanceAfter = balance.CurrentBalance,
                            Description = level == 1
                                ? "Points earned from own purchase"
                                : $"Points earned from Level {level - 1} referral purchase"
                        });
                    }
                }
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error distributing order points: {ex.Message}");
            }
        }

        // GetOrder endpoint for CreatedAtAction to work correctly
        [HttpGet("{id}")]
        public async Task<ActionResult<Order>> GetOrder(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized("User ID not found in token.");
            }

            var order = await _context.Orders
                                    .Include(o => o.OrderItems)!
                                        .ThenInclude(oi => oi.Product!)
                                    .FirstOrDefaultAsync(o => o.OrderId == id);

            if (order == null)
            {
                return NotFound();
            }

            // Check if user owns this order (unless admin)
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole != "Admin" && order.UserId != userId)
            {
                return Forbid();
            }

            return order;
        }

        // Get current user's order history
        [HttpGet("my-orders")]
        public async Task<ActionResult> GetMyOrders()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized("User ID not found in token.");
            }

            var orders = await _context.Orders
                .Where(o => o.UserId == userId)
                .Include(o => o.OrderItems!)
                    .ThenInclude(oi => oi.Product)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            var result = orders.Select(o =>
            {
                var itemCount = o.OrderItems?.Count ?? 0;
                var items = (o.OrderItems ?? Enumerable.Empty<OrderItem>()).Select(oi => new
                {
                    oi.OrderItemId,
                    oi.ProductId,
                    ProductName = oi.Product?.ProductName,
                    ProductImage = oi.Product?.ImageUrl,
                    oi.Quantity,
                    oi.UnitPrice,
                    Total = oi.Quantity * oi.UnitPrice,
                    oi.ExpectedDeliveryDate,
                    oi.ActualDeliveryDate,
                    oi.DeliveryStatus,
                    oi.TrackingNumber
                }).ToList();

                var displayStatus = o.Status == "Cancelled" ? "Cancelled"
                    : GetEffectiveStatus(o.OrderItems?.Select(oi => oi.DeliveryStatus).ToList());

                return new
                {
                    o.OrderId,
                    o.OrderDate,
                    o.TotalAmount,
                    Status = displayStatus,
                    OrderStatus = o.Status,
                    ItemCount = itemCount,
                    Items = items
                };
            }).ToList();

            return Ok(result);
        }

        private static string GetEffectiveStatus(List<string>? deliveryStatuses)
        {
            if (deliveryStatuses == null || !deliveryStatuses.Any())
                return "Pending";

            var statuses = deliveryStatuses.Where(s => !string.IsNullOrEmpty(s)).Select(s => s.Trim()).ToList();
            if (statuses.Any(s => s.Equals("Delivered", StringComparison.OrdinalIgnoreCase)))
                return "Delivered";
            if (statuses.Any(s => s.Equals("OutForDelivery", StringComparison.OrdinalIgnoreCase)))
                return "OutForDelivery";
            if (statuses.Any(s => s.Equals("Shipped", StringComparison.OrdinalIgnoreCase)))
                return "Shipped";
            if (statuses.Any(s => s.Equals("Processing", StringComparison.OrdinalIgnoreCase)))
                return "Processing";
            if (statuses.Any(s => s.Equals("Cancelled", StringComparison.OrdinalIgnoreCase)) && statuses.All(s => s.Equals("Cancelled", StringComparison.OrdinalIgnoreCase)))
                return "Cancelled";

            return "Pending";
        }

        // Get order detail with tracking info
        [HttpGet("my-orders/{id}")]
        public async Task<ActionResult> GetMyOrderDetail(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized("User ID not found in token.");
            }

            var order = await _context.Orders
                .Where(o => o.OrderId == id && o.UserId == userId)
                .Include(o => o.OrderItems!)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync();

            if (order == null)
            {
                return NotFound("Order not found or you don't have access to it.");
            }

            var displayStatus = order.Status == "Cancelled" ? "Cancelled"
                : GetEffectiveStatus(order.OrderItems?.Select(oi => oi.DeliveryStatus).ToList());

            var result = new
            {
                order.OrderId,
                order.OrderDate,
                order.TotalAmount,
                Status = displayStatus,
                OrderStatus = order.Status,
                Items = order.OrderItems?.Select(oi => new
                {
                    oi.OrderItemId,
                    oi.ProductId,
                    ProductName = oi.Product?.ProductName,
                    ProductImage = oi.Product?.ImageUrl,
                    ProductDescription = oi.Product?.Description,
                    oi.Quantity,
                    oi.UnitPrice,
                    Total = oi.Quantity * oi.UnitPrice,
                    oi.ExpectedDeliveryDate,
                    oi.ActualDeliveryDate,
                    oi.DeliveryStatus,
                    oi.TrackingNumber,
                    oi.DeliveryNotes
                }).ToList()
            };

            return Ok(result);
        }

        /// <summary>
        /// Cancel an order (only when status is Pending)
        /// </summary>
        [HttpPost("my-orders/{id}/cancel")]
        public async Task<ActionResult> CancelOrder(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized("User ID not found in token.");
            }

            var order = await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.OrderId == id && o.UserId == userId);

            if (order == null)
            {
                return NotFound("Order not found or you don't have access to it.");
            }

            if (order.Status != "Pending")
            {
                return BadRequest("Only pending orders can be cancelled.");
            }

            // Restore stock for each order item
            foreach (var item in order.OrderItems ?? Enumerable.Empty<OrderItem>())
            {
                if (item.SellerId.HasValue)
                {
                    var productSeller = await _context.ProductSellers
                        .FirstOrDefaultAsync(ps => ps.ProductId == item.ProductId && ps.SellerId == item.SellerId);
                    if (productSeller != null)
                    {
                        productSeller.StockQuantity += item.Quantity;
                    }
                }
                else if (item.Product != null)
                {
                    item.Product.Stock += item.Quantity;
                }
            }

            // Remove seller commissions for this order
            var commissions = await _context.SellerCommissions
                .Where(sc => sc.OrderId == id)
                .ToListAsync();
            _context.SellerCommissions.RemoveRange(commissions);

            // Update order and order items status
            order.Status = "Cancelled";
            foreach (var item in order.OrderItems ?? Enumerable.Empty<OrderItem>())
            {
                item.DeliveryStatus = "Cancelled";
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Order cancelled successfully.", status = "Cancelled" });
        }
    }

    public class OrderRequest
    {
        public List<OrderItemRequest>? Items { get; set; }
        public decimal PointsToRedeem { get; set; } = 0;
    }

    public class OrderItemRequest
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }
}

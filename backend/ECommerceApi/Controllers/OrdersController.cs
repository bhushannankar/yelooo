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

                var orderItem = new OrderItem
                {
                    ProductId = itemRequest.ProductId,
                    Quantity = itemRequest.Quantity,
                    UnitPrice = product.Price
                };

                newOrder.OrderItems.Add(orderItem);
                totalAmount += product.Price * itemRequest.Quantity;

                // Decrease product stock
                product.Stock -= itemRequest.Quantity;
            }

            newOrder.TotalAmount = totalAmount;
            _context.Orders.Add(newOrder);
            await _context.SaveChangesAsync();

            // Distribute PV points after successful order
            await DistributeOrderPoints(newOrder.OrderId, userId, totalAmount);

            return CreatedAtAction(nameof(GetOrder), new { id = newOrder.OrderId }, newOrder);
        }

        /// <summary>
        /// Distribute PV points to customer and their upline
        /// </summary>
        [NonAction]
        private async Task DistributeOrderPoints(int orderId, int customerId, decimal orderAmount)
        {
            try
            {
                // Calculate total PV (10% of order amount)
                decimal totalPV = orderAmount * 0.10m;

                // Get level configurations
                var levelConfigs = await _context.PVLevelConfigs
                    .Where(c => c.IsActive)
                    .OrderBy(c => c.LevelId)
                    .ToListAsync();

                if (!levelConfigs.Any())
                    return;

                // Build upline chain
                var uplineChain = new List<(int UserId, int Level)>();
                uplineChain.Add((customerId, 1));  // Level 1 is self

                int currentUserId = customerId;
                for (int level = 2; level <= 8; level++)
                {
                    var referrerId = await _context.Users
                        .Where(u => u.UserId == currentUserId)
                        .Select(u => u.ReferredByUserId)
                        .FirstOrDefaultAsync();

                    if (referrerId == null)
                        break;

                    uplineChain.Add((referrerId.Value, level));
                    currentUserId = referrerId.Value;
                }

                // Distribute points to each user in the chain
                foreach (var (userId, level) in uplineChain)
                {
                    var levelConfig = levelConfigs.FirstOrDefault(c => c.LevelId == level);
                    if (levelConfig == null)
                        continue;

                    decimal pointsToCredit = totalPV * (levelConfig.PVPercentage / 100m);
                    if (pointsToCredit <= 0)
                        continue;

                    // Ensure user has a balance record
                    var balance = await _context.UserPointsBalances
                        .FirstOrDefaultAsync(b => b.UserId == userId);

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

                    // Update balance
                    balance.TotalPointsEarned += pointsToCredit;
                    balance.CurrentBalance += pointsToCredit;
                    balance.LastUpdatedAt = DateTime.Now;

                    // Record transaction
                    var transaction = new PointsTransaction
                    {
                        UserId = userId,
                        OrderId = orderId,
                        SourceUserId = customerId,
                        TransactionType = level == 1 ? "EARNED_SELF" : "EARNED_REFERRAL",
                        LevelId = level,
                        OrderAmount = orderAmount,
                        TotalPV = totalPV,
                        PointsAmount = pointsToCredit,
                        BalanceAfter = balance.CurrentBalance,
                        Description = level == 1 
                            ? "Points earned from own purchase" 
                            : $"Points earned from Level {level - 1} referral purchase"
                    };
                    _context.PointsTransactions.Add(transaction);
                }

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Log the error but don't fail the order
                Console.WriteLine($"Error distributing points: {ex.Message}");
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
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new
                {
                    o.OrderId,
                    o.OrderDate,
                    o.TotalAmount,
                    o.Status,
                    ItemCount = o.OrderItems!.Count,
                    Items = o.OrderItems!.Select(oi => new
                    {
                        oi.OrderItemId,
                        oi.ProductId,
                        ProductName = oi.Product!.ProductName,
                        ProductImage = oi.Product.ImageUrl,
                        oi.Quantity,
                        oi.UnitPrice,
                        Total = oi.Quantity * oi.UnitPrice,
                        oi.ExpectedDeliveryDate,
                        oi.ActualDeliveryDate,
                        oi.DeliveryStatus,
                        oi.TrackingNumber
                    })
                })
                .ToListAsync();

            return Ok(orders);
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
                .Select(o => new
                {
                    o.OrderId,
                    o.OrderDate,
                    o.TotalAmount,
                    o.Status,
                    Items = o.OrderItems!.Select(oi => new
                    {
                        oi.OrderItemId,
                        oi.ProductId,
                        ProductName = oi.Product!.ProductName,
                        ProductImage = oi.Product.ImageUrl,
                        ProductDescription = oi.Product.Description,
                        oi.Quantity,
                        oi.UnitPrice,
                        Total = oi.Quantity * oi.UnitPrice,
                        oi.ExpectedDeliveryDate,
                        oi.ActualDeliveryDate,
                        oi.DeliveryStatus,
                        oi.TrackingNumber,
                        oi.DeliveryNotes
                    })
                })
                .FirstOrDefaultAsync();

            if (order == null)
            {
                return NotFound("Order not found or you don't have access to it.");
            }

            return Ok(order);
        }
    }

    public class OrderRequest
    {
        public List<OrderItemRequest>? Items { get; set; }
    }

    public class OrderItemRequest
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using ECommerceApi.Data;
using ECommerceApi.Models;
using System.Security.Claims;

namespace ECommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Seller")]
    public class SellerOrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SellerOrdersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Get all order items for seller's products
        [HttpGet]
        public async Task<ActionResult> GetSellerOrders([FromQuery] string? status, [FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            var sellerId = GetUserId();
            if (sellerId == null) return Unauthorized();

            // Get products that belong to this seller
            var sellerProductIds = await _context.ProductSellers
                .Where(ps => ps.SellerId == sellerId && ps.IsActive)
                .Select(ps => ps.ProductId)
                .ToListAsync();

            var baseQuery = _context.OrderItems
                .Include(oi => oi.Order)
                    .ThenInclude(o => o!.User)
                .Include(oi => oi.Product)
                .Where(oi => sellerProductIds.Contains(oi.ProductId));

            // Unfiltered query for summary (all seller's order items)
            var allOrderItemsQuery = baseQuery;
            if (fromDate.HasValue)
                allOrderItemsQuery = allOrderItemsQuery.Where(oi => oi.Order!.OrderDate >= fromDate.Value);
            if (toDate.HasValue)
                allOrderItemsQuery = allOrderItemsQuery.Where(oi => oi.Order!.OrderDate <= toDate.Value.AddDays(1));

            var allOrderItems = await allOrderItemsQuery.ToListAsync();

            // Summary from ALL order items (unfiltered by status) - so cards always show correct totals
            var summary = new
            {
                TotalOrders = allOrderItems.Count,
                PendingCount = allOrderItems.Count(o => o.DeliveryStatus == "Pending"),
                ProcessingCount = allOrderItems.Count(o => o.DeliveryStatus == "Processing"),
                ShippedCount = allOrderItems.Count(o => o.DeliveryStatus == "Shipped"),
                OutForDeliveryCount = allOrderItems.Count(o => o.DeliveryStatus == "OutForDelivery"),
                DeliveredCount = allOrderItems.Count(o => o.DeliveryStatus == "Delivered"),
                CancelledCount = allOrderItems.Count(o => o.DeliveryStatus == "Cancelled"),
                TotalRevenue = allOrderItems.Sum(o => o.Quantity * o.UnitPrice)
            };

            // Apply status filter for orders list
            var query = baseQuery;
            if (!string.IsNullOrEmpty(status))
                query = query.Where(oi => oi.DeliveryStatus == status);
            if (fromDate.HasValue)
                query = query.Where(oi => oi.Order!.OrderDate >= fromDate.Value);
            if (toDate.HasValue)
                query = query.Where(oi => oi.Order!.OrderDate <= toDate.Value.AddDays(1));

            var orderItems = await query
                .OrderByDescending(oi => oi.Order!.OrderDate)
                .Select(oi => new
                {
                    oi.OrderItemId,
                    oi.OrderId,
                    oi.ProductId,
                    ProductName = oi.Product!.ProductName,
                    ProductImage = oi.Product.ImageUrl,
                    oi.Quantity,
                    oi.UnitPrice,
                    TotalPrice = oi.Quantity * oi.UnitPrice,
                    oi.DeliveryStatus,
                    oi.ExpectedDeliveryDate,
                    oi.ActualDeliveryDate,
                    oi.TrackingNumber,
                    oi.DeliveryNotes,
                    oi.LastUpdatedAt,
                    OrderDate = oi.Order!.OrderDate,
                    OrderStatus = oi.Order.Status,
                    Customer = new
                    {
                        oi.Order.User!.UserId,
                        oi.Order.User.Username,
                        oi.Order.User.Email,
                        oi.Order.User.PhoneNumber,
                        oi.Order.User.Address,
                        oi.Order.User.City,
                        oi.Order.User.State,
                        oi.Order.User.PinCode
                    }
                })
                .ToListAsync();

            return Ok(new { summary, orders = orderItems });
        }

        // Get single order item details
        [HttpGet("{orderItemId}")]
        public async Task<ActionResult> GetOrderItemDetail(int orderItemId)
        {
            var sellerId = GetUserId();
            if (sellerId == null) return Unauthorized();

            var sellerProductIds = await _context.ProductSellers
                .Where(ps => ps.SellerId == sellerId && ps.IsActive)
                .Select(ps => ps.ProductId)
                .ToListAsync();

            var orderItem = await _context.OrderItems
                .Include(oi => oi.Order)
                    .ThenInclude(o => o!.User)
                .Include(oi => oi.Product)
                .Where(oi => oi.OrderItemId == orderItemId && sellerProductIds.Contains(oi.ProductId))
                .Select(oi => new
                {
                    oi.OrderItemId,
                    oi.OrderId,
                    oi.ProductId,
                    ProductName = oi.Product!.ProductName,
                    ProductImage = oi.Product.ImageUrl,
                    ProductDescription = oi.Product.Description,
                    oi.Quantity,
                    oi.UnitPrice,
                    TotalPrice = oi.Quantity * oi.UnitPrice,
                    oi.DeliveryStatus,
                    oi.ExpectedDeliveryDate,
                    oi.ActualDeliveryDate,
                    oi.TrackingNumber,
                    oi.DeliveryNotes,
                    oi.LastUpdatedAt,
                    OrderDate = oi.Order!.OrderDate,
                    OrderStatus = oi.Order.Status,
                    Customer = new
                    {
                        oi.Order.User!.UserId,
                        oi.Order.User.Username,
                        FullName = $"{oi.Order.User.FirstName} {oi.Order.User.MiddleName} {oi.Order.User.LastName}".Trim(),
                        oi.Order.User.Email,
                        oi.Order.User.PhoneNumber,
                        oi.Order.User.AlternatePhoneNumber,
                        oi.Order.User.Address,
                        oi.Order.User.AddressLine2,
                        oi.Order.User.Landmark,
                        oi.Order.User.City,
                        oi.Order.User.State,
                        oi.Order.User.PinCode,
                        oi.Order.User.Country
                    }
                })
                .FirstOrDefaultAsync();

            if (orderItem == null)
            {
                return NotFound("Order item not found or you don't have access to it.");
            }

            // Get delivery history
            var history = await _context.DeliveryStatusHistory
                .Where(h => h.OrderItemId == orderItemId)
                .OrderByDescending(h => h.ChangedAt)
                .Select(h => new
                {
                    h.HistoryId,
                    h.OldStatus,
                    h.NewStatus,
                    h.OldDeliveryDate,
                    h.NewDeliveryDate,
                    h.ChangedAt,
                    h.Notes,
                    ChangedBy = h.ChangedByUser!.Username
                })
                .ToListAsync();

            return Ok(new { orderItem, deliveryHistory = history });
        }

        // Update delivery date and status
        [HttpPut("{orderItemId}/delivery")]
        public async Task<ActionResult> UpdateDelivery(int orderItemId, [FromBody] UpdateDeliveryDto dto)
        {
            var sellerId = GetUserId();
            if (sellerId == null) return Unauthorized();

            var sellerProductIds = await _context.ProductSellers
                .Where(ps => ps.SellerId == sellerId && ps.IsActive)
                .Select(ps => ps.ProductId)
                .ToListAsync();

            var orderItem = await _context.OrderItems
                .Where(oi => oi.OrderItemId == orderItemId && sellerProductIds.Contains(oi.ProductId))
                .FirstOrDefaultAsync();

            if (orderItem == null)
            {
                return NotFound("Order item not found or you don't have access to it.");
            }

            // Create history entry
            var history = new DeliveryStatusHistory
            {
                OrderItemId = orderItemId,
                OldStatus = orderItem.DeliveryStatus,
                NewStatus = dto.DeliveryStatus ?? orderItem.DeliveryStatus,
                OldDeliveryDate = orderItem.ExpectedDeliveryDate,
                NewDeliveryDate = dto.ExpectedDeliveryDate ?? orderItem.ExpectedDeliveryDate,
                ChangedByUserId = sellerId.Value,
                ChangedAt = DateTime.Now,
                Notes = dto.Notes
            };
            _context.DeliveryStatusHistory.Add(history);

            // Update order item
            if (dto.ExpectedDeliveryDate.HasValue)
            {
                orderItem.ExpectedDeliveryDate = dto.ExpectedDeliveryDate.Value;
            }

            if (!string.IsNullOrEmpty(dto.DeliveryStatus))
            {
                orderItem.DeliveryStatus = dto.DeliveryStatus;

                // If marked as delivered, set actual delivery date
                if (dto.DeliveryStatus == "Delivered" && !orderItem.ActualDeliveryDate.HasValue)
                {
                    orderItem.ActualDeliveryDate = DateTime.Today;
                }
            }

            if (!string.IsNullOrEmpty(dto.TrackingNumber))
            {
                orderItem.TrackingNumber = dto.TrackingNumber;
            }

            if (!string.IsNullOrEmpty(dto.DeliveryNotes))
            {
                orderItem.DeliveryNotes = dto.DeliveryNotes;
            }

            orderItem.SellerId = sellerId;
            orderItem.LastUpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Delivery information updated successfully",
                orderItem = new
                {
                    orderItem.OrderItemId,
                    orderItem.DeliveryStatus,
                    orderItem.ExpectedDeliveryDate,
                    orderItem.ActualDeliveryDate,
                    orderItem.TrackingNumber,
                    orderItem.DeliveryNotes,
                    orderItem.LastUpdatedAt
                }
            });
        }

        // Bulk update delivery status
        [HttpPut("bulk-update")]
        public async Task<ActionResult> BulkUpdateDelivery([FromBody] BulkUpdateDeliveryDto dto)
        {
            var sellerId = GetUserId();
            if (sellerId == null) return Unauthorized();

            if (dto.OrderItemIds == null || !dto.OrderItemIds.Any())
            {
                return BadRequest("No order items specified.");
            }

            var sellerProductIds = await _context.ProductSellers
                .Where(ps => ps.SellerId == sellerId && ps.IsActive)
                .Select(ps => ps.ProductId)
                .ToListAsync();

            var orderItems = await _context.OrderItems
                .Where(oi => dto.OrderItemIds.Contains(oi.OrderItemId) && sellerProductIds.Contains(oi.ProductId))
                .ToListAsync();

            if (!orderItems.Any())
            {
                return NotFound("No valid order items found.");
            }

            foreach (var orderItem in orderItems)
            {
                // Create history entry
                var history = new DeliveryStatusHistory
                {
                    OrderItemId = orderItem.OrderItemId,
                    OldStatus = orderItem.DeliveryStatus,
                    NewStatus = dto.DeliveryStatus,
                    OldDeliveryDate = orderItem.ExpectedDeliveryDate,
                    NewDeliveryDate = dto.ExpectedDeliveryDate ?? orderItem.ExpectedDeliveryDate,
                    ChangedByUserId = sellerId.Value,
                    ChangedAt = DateTime.Now,
                    Notes = dto.Notes
                };
                _context.DeliveryStatusHistory.Add(history);

                // Update
                orderItem.DeliveryStatus = dto.DeliveryStatus;
                if (dto.ExpectedDeliveryDate.HasValue)
                {
                    orderItem.ExpectedDeliveryDate = dto.ExpectedDeliveryDate.Value;
                }
                if (dto.DeliveryStatus == "Delivered" && !orderItem.ActualDeliveryDate.HasValue)
                {
                    orderItem.ActualDeliveryDate = DateTime.Today;
                }
                orderItem.SellerId = sellerId;
                orderItem.LastUpdatedAt = DateTime.Now;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Successfully updated {orderItems.Count} order items",
                updatedCount = orderItems.Count
            });
        }

        // Get delivery status options (database-driven, fallback if table not yet created)
        [HttpGet("delivery-statuses")]
        public async Task<ActionResult> GetDeliveryStatuses()
        {
            var fallback = new[]
            {
                new { value = "Pending", label = "Pending", description = (string?)"Order received, awaiting processing" },
                new { value = "Processing", label = "Processing", description = (string?)"Order is being prepared" },
                new { value = "Shipped", label = "Shipped", description = (string?)"Order has been shipped" },
                new { value = "OutForDelivery", label = "Out for Delivery", description = (string?)"Order is out for delivery" },
                new { value = "Delivered", label = "Delivered", description = (string?)"Order has been delivered" },
                new { value = "Cancelled", label = "Cancelled", description = (string?)"Order has been cancelled" }
            };

            try
            {
                var statuses = await _context.DeliveryStatuses
                    .Where(s => s.IsActive)
                    .OrderBy(s => s.DisplayOrder)
                    .Select(s => new { value = s.Value, label = s.Label, description = s.Description })
                    .ToListAsync();

                if (statuses.Count > 0)
                    return Ok(statuses);
            }
            catch
            {
                // Table may not exist yet - use fallback
            }

            return Ok(fallback);
        }

        private int? GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return null;
            }
            return userId;
        }
    }

    public class UpdateDeliveryDto
    {
        public DateTime? ExpectedDeliveryDate { get; set; }
        public string? DeliveryStatus { get; set; }
        public string? TrackingNumber { get; set; }
        public string? DeliveryNotes { get; set; }
        public string? Notes { get; set; }
    }

    public class BulkUpdateDeliveryDto
    {
        public List<int>? OrderItemIds { get; set; }
        public required string DeliveryStatus { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public string? Notes { get; set; }
    }
}

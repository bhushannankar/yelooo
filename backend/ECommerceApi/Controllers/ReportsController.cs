using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerceApi.Data;

namespace ECommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class ReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReportsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all orders with details for reporting
        /// </summary>
        [HttpGet("orders")]
        public async Task<ActionResult<object>> GetOrdersReport(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] string? status)
        {
            var query = _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems!)
                    .ThenInclude(oi => oi.Product)
                .AsQueryable();

            // Apply filters
            if (startDate.HasValue)
            {
                query = query.Where(o => o.OrderDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(o => o.OrderDate <= endDate.Value.AddDays(1));
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(o => o.Status == status);
            }

            var orders = await query
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new
                {
                    orderId = o.OrderId,
                    orderDate = o.OrderDate,
                    status = o.Status,
                    totalAmount = o.TotalAmount,
                    customerName = o.User != null ? o.User.Username : "Unknown",
                    customerEmail = o.User != null ? o.User.Email : "",
                    items = o.OrderItems!.Select(oi => new
                    {
                        productId = oi.ProductId,
                        productName = oi.Product != null ? oi.Product.ProductName : "Unknown",
                        quantity = oi.Quantity,
                        unitPrice = oi.UnitPrice,
                        subtotal = oi.Quantity * oi.UnitPrice
                    }).ToList()
                })
                .ToListAsync();

            // Calculate summary statistics
            var totalOrders = orders.Count;
            var totalRevenue = orders.Sum(o => o.totalAmount);
            var totalItems = orders.Sum(o => o.items.Sum(i => i.quantity));

            return Ok(new
            {
                summary = new
                {
                    totalOrders,
                    totalRevenue,
                    totalItems,
                    averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
                },
                orders
            });
        }

        /// <summary>
        /// Get product sales summary
        /// </summary>
        [HttpGet("product-sales")]
        public async Task<ActionResult<IEnumerable<object>>> GetProductSalesReport(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            var query = _context.OrderItems
                .Include(oi => oi.Order)
                .Include(oi => oi.Product)
                .AsQueryable();

            if (startDate.HasValue)
            {
                query = query.Where(oi => oi.Order != null && oi.Order.OrderDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(oi => oi.Order != null && oi.Order.OrderDate <= endDate.Value.AddDays(1));
            }

            var productSales = await query
                .GroupBy(oi => new { oi.ProductId, ProductName = oi.Product != null ? oi.Product.ProductName : "Unknown" })
                .Select(g => new
                {
                    productId = g.Key.ProductId,
                    productName = g.Key.ProductName,
                    totalQuantitySold = g.Sum(oi => oi.Quantity),
                    totalRevenue = g.Sum(oi => oi.Quantity * oi.UnitPrice),
                    orderCount = g.Select(oi => oi.OrderId).Distinct().Count()
                })
                .OrderByDescending(x => x.totalQuantitySold)
                .ToListAsync();

            return Ok(productSales);
        }

        /// <summary>
        /// Get order status counts
        /// </summary>
        [HttpGet("order-status")]
        public async Task<ActionResult<IEnumerable<object>>> GetOrderStatusReport()
        {
            var statusCounts = await _context.Orders
                .GroupBy(o => o.Status)
                .Select(g => new
                {
                    status = g.Key,
                    count = g.Count(),
                    totalAmount = g.Sum(o => o.TotalAmount)
                })
                .ToListAsync();

            return Ok(statusCounts);
        }
    }
}

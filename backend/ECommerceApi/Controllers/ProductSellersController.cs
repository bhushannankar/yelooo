using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerceApi.Data;
using ECommerceApi.Models;

namespace ECommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductSellersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProductSellersController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all sellers for a specific product
        /// </summary>
        [HttpGet("product/{productId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetSellersByProduct(int productId)
        {
            var sellers = await _context.ProductSellers
                .Include(ps => ps.Seller)
                .Where(ps => ps.ProductId == productId && ps.IsActive)
                .OrderBy(ps => ps.SellerPrice)
                .Select(ps => new
                {
                    productSellerId = ps.ProductSellerId,
                    productId = ps.ProductId,
                    sellerId = ps.SellerId,
                    sellerName = ps.Seller != null ? ps.Seller.Username : "Unknown",
                    sellerPrice = ps.SellerPrice,
                    deliveryDays = ps.DeliveryDays,
                    deliveryDate = DateTime.Now.AddDays(ps.DeliveryDays).ToString("ddd, dd MMM yyyy"),
                    deliveryCharge = ps.DeliveryCharge,
                    isFreeDelivery = ps.DeliveryCharge == 0,
                    sellerAddress = ps.SellerAddress,
                    stockQuantity = ps.StockQuantity,
                    isInStock = ps.StockQuantity > 0
                })
                .ToListAsync();

            return Ok(sellers);
        }

        /// <summary>
        /// Get all products for a specific seller
        /// </summary>
        [HttpGet("seller/{sellerId}")]
        [Authorize(Roles = "Admin,Seller")]
        public async Task<ActionResult<IEnumerable<object>>> GetProductsBySeller(int sellerId)
        {
            var products = await _context.ProductSellers
                .Include(ps => ps.Product)
                .Where(ps => ps.SellerId == sellerId)
                .Select(ps => new
                {
                    productSellerId = ps.ProductSellerId,
                    productId = ps.ProductId,
                    productName = ps.Product != null ? ps.Product.ProductName : "Unknown",
                    productImage = ps.Product != null ? ps.Product.ImageUrl : "",
                    sellerPrice = ps.SellerPrice,
                    basePrice = ps.Product != null ? ps.Product.Price : 0,
                    deliveryDays = ps.DeliveryDays,
                    deliveryCharge = ps.DeliveryCharge,
                    sellerAddress = ps.SellerAddress,
                    stockQuantity = ps.StockQuantity,
                    isActive = ps.IsActive
                })
                .ToListAsync();

            return Ok(products);
        }

        /// <summary>
        /// Add a seller to a product (Admin or Seller)
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin,Seller")]
        public async Task<IActionResult> AddProductSeller([FromBody] AddProductSellerRequest request)
        {
            // Check if product exists
            var product = await _context.Products.FindAsync(request.ProductId);
            if (product == null)
            {
                return NotFound("Product not found.");
            }

            // Check if seller exists and has Seller role
            var seller = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == request.SellerId);
            
            if (seller == null || seller.Role?.RoleName != "Seller")
            {
                return BadRequest("Invalid seller or user is not a seller.");
            }

            // Check if relationship already exists
            var existing = await _context.ProductSellers
                .FirstOrDefaultAsync(ps => ps.ProductId == request.ProductId && ps.SellerId == request.SellerId);
            
            if (existing != null)
            {
                return BadRequest("This seller is already associated with this product.");
            }

            var productSeller = new ProductSeller
            {
                ProductId = request.ProductId,
                SellerId = request.SellerId,
                SellerPrice = request.SellerPrice,
                DeliveryDays = request.DeliveryDays,
                DeliveryCharge = request.DeliveryCharge,
                SellerAddress = request.SellerAddress,
                StockQuantity = request.StockQuantity,
                IsActive = true,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.ProductSellers.Add(productSeller);
            await _context.SaveChangesAsync();

            return StatusCode(201, new { message = "Seller added to product successfully.", productSellerId = productSeller.ProductSellerId });
        }

        /// <summary>
        /// Update product seller details
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Seller")]
        public async Task<IActionResult> UpdateProductSeller(int id, [FromBody] UpdateProductSellerRequest request)
        {
            var productSeller = await _context.ProductSellers.FindAsync(id);
            if (productSeller == null)
            {
                return NotFound("Product-Seller relationship not found.");
            }

            productSeller.SellerPrice = request.SellerPrice;
            productSeller.DeliveryDays = request.DeliveryDays;
            productSeller.DeliveryCharge = request.DeliveryCharge;
            productSeller.SellerAddress = request.SellerAddress;
            productSeller.StockQuantity = request.StockQuantity;
            productSeller.IsActive = request.IsActive;
            productSeller.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Product-Seller details updated successfully." });
        }

        /// <summary>
        /// Remove seller from product
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Seller")]
        public async Task<IActionResult> RemoveProductSeller(int id)
        {
            var productSeller = await _context.ProductSellers.FindAsync(id);
            if (productSeller == null)
            {
                return NotFound("Product-Seller relationship not found.");
            }

            _context.ProductSellers.Remove(productSeller);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Seller removed from product successfully." });
        }

        /// <summary>
        /// Get products for the currently logged-in seller
        /// </summary>
        [HttpGet("my-products")]
        [Authorize(Roles = "Seller")]
        public async Task<ActionResult<IEnumerable<object>>> GetMyProducts()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int sellerId))
            {
                return Unauthorized("Invalid user token.");
            }

            var products = await _context.ProductSellers
                .Include(ps => ps.Product)
                .Where(ps => ps.SellerId == sellerId)
                .OrderByDescending(ps => ps.UpdatedAt)
                .Select(ps => new
                {
                    productSellerId = ps.ProductSellerId,
                    productId = ps.ProductId,
                    productName = ps.Product != null ? ps.Product.ProductName : "Unknown",
                    productImage = ps.Product != null ? ps.Product.ImageUrl : "",
                    productDescription = ps.Product != null ? ps.Product.Description : "",
                    sellerPrice = ps.SellerPrice,
                    basePrice = ps.Product != null ? ps.Product.Price : 0,
                    deliveryDays = ps.DeliveryDays,
                    deliveryCharge = ps.DeliveryCharge,
                    sellerAddress = ps.SellerAddress,
                    stockQuantity = ps.StockQuantity,
                    isActive = ps.IsActive,
                    createdAt = ps.CreatedAt,
                    updatedAt = ps.UpdatedAt
                })
                .ToListAsync();

            return Ok(products);
        }

        /// <summary>
        /// Get all active sellers, optionally filtered by category (for dropdown in product creation).
        /// Only sellers assigned to the given category (quaternary, or tertiary, or subcategory) are returned.
        /// </summary>
        [HttpGet("sellers")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<object>>> GetAllSellers(
            [FromQuery] int? quaternaryCategoryId = null,
            [FromQuery] int? tertiaryCategoryId = null,
            [FromQuery] int? subCategoryId = null)
        {
            var sellerQuery = _context.Users
                .Include(u => u.Role)
                .Where(u => u.Role != null && u.Role.RoleName == "Seller");

            if (quaternaryCategoryId.HasValue || tertiaryCategoryId.HasValue || subCategoryId.HasValue)
            {
                List<int> allowedQuaternaryIds;
                if (quaternaryCategoryId.HasValue)
                {
                    allowedQuaternaryIds = new List<int> { quaternaryCategoryId.Value };
                }
                else if (tertiaryCategoryId.HasValue)
                {
                    allowedQuaternaryIds = await _context.QuaternaryCategories
                        .Where(q => q.TertiaryCategoryId == tertiaryCategoryId.Value)
                        .Select(q => q.QuaternaryCategoryId)
                        .ToListAsync();
                }
                else
                {
                    var tertiaryIdsUnderSub = await _context.TertiaryCategories
                        .Where(t => t.SubCategoryId == subCategoryId!.Value)
                        .Select(t => t.TertiaryCategoryId)
                        .ToListAsync();
                    allowedQuaternaryIds = await _context.QuaternaryCategories
                        .Where(q => tertiaryIdsUnderSub.Contains(q.TertiaryCategoryId))
                        .Select(q => q.QuaternaryCategoryId)
                        .ToListAsync();
                }

                var sellerIdsWithCategory = await _context.SellerQuaternaryCategories
                    .Where(sq => allowedQuaternaryIds.Contains(sq.QuaternaryCategoryId))
                    .Select(sq => sq.SellerId)
                    .Distinct()
                    .ToListAsync();

                sellerQuery = sellerQuery.Where(u => sellerIdsWithCategory.Contains(u.UserId));
            }

            var sellers = await sellerQuery
                .Select(u => new
                {
                    sellerId = u.UserId,
                    sellerName = u.Username,
                    email = u.Email
                })
                .ToListAsync();

            return Ok(sellers);
        }
    }

    public class AddProductSellerRequest
    {
        public int ProductId { get; set; }
        public int SellerId { get; set; }
        public decimal SellerPrice { get; set; }
        public int DeliveryDays { get; set; } = 5;
        public decimal DeliveryCharge { get; set; } = 0;
        public string? SellerAddress { get; set; }
        public int StockQuantity { get; set; } = 0;
    }

    public class UpdateProductSellerRequest
    {
        public decimal SellerPrice { get; set; }
        public int DeliveryDays { get; set; }
        public decimal DeliveryCharge { get; set; }
        public string? SellerAddress { get; set; }
        public int StockQuantity { get; set; }
        public bool IsActive { get; set; } = true;
    }
}

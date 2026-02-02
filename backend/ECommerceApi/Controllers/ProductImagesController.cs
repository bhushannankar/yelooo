using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerceApi.Data;
using ECommerceApi.Models;

namespace ECommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductImagesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ProductImagesController> _logger;

        public ProductImagesController(ApplicationDbContext context, ILogger<ProductImagesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get all images for a product.
        /// </summary>
        [HttpGet("product/{productId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetProductImages(int productId)
        {
            var images = await _context.ProductImages
                .Where(i => i.ProductId == productId)
                .OrderBy(i => i.DisplayOrder)
                .ThenBy(i => i.ImageId)
                .Select(i => new
                {
                    imageId = i.ImageId,
                    productId = i.ProductId,
                    variantId = i.VariantId,
                    imageUrl = i.ImageUrl,
                    isMain = i.IsMain,
                    displayOrder = i.DisplayOrder
                })
                .ToListAsync();

            return Ok(images);
        }

        /// <summary>
        /// Add images to a product (Admin only).
        /// </summary>
        [HttpPost("product/{productId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<object>>> AddProductImages(int productId, [FromBody] AddProductImagesRequest request)
        {
            // Verify product exists
            var productExists = await _context.Products.AnyAsync(p => p.ProductId == productId);
            if (!productExists)
            {
                return NotFound("Product not found.");
            }

            if (request.Images == null || request.Images.Count == 0)
            {
                return BadRequest("No images provided.");
            }

            // Get the current max display order
            var maxOrder = await _context.ProductImages
                .Where(i => i.ProductId == productId)
                .MaxAsync(i => (int?)i.DisplayOrder) ?? -1;

            // Check if product already has a main image
            var hasMainImage = await _context.ProductImages
                .AnyAsync(i => i.ProductId == productId && i.IsMain);

            var newImages = new List<ProductImage>();
            var order = maxOrder + 1;

            foreach (var img in request.Images)
            {
                var productImage = new ProductImage
                {
                    ProductId = productId,
                    VariantId = img.VariantId,
                    ImageUrl = img.ImageUrl,
                    IsMain = !hasMainImage && order == maxOrder + 1, // First image is main if no main exists
                    DisplayOrder = order++
                };
                newImages.Add(productImage);
                _context.ProductImages.Add(productImage);
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Added {Count} images to product {ProductId}", newImages.Count, productId);

            return Ok(newImages.Select(i => new
            {
                imageId = i.ImageId,
                productId = i.ProductId,
                variantId = i.VariantId,
                imageUrl = i.ImageUrl,
                isMain = i.IsMain,
                displayOrder = i.DisplayOrder
            }));
        }

        /// <summary>
        /// Set an image as the main image for a product (Admin only).
        /// </summary>
        [HttpPut("{imageId}/setMain")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SetMainImage(int imageId)
        {
            var image = await _context.ProductImages.FindAsync(imageId);
            if (image == null)
            {
                return NotFound("Image not found.");
            }

            // Unset all other main images for this product
            var otherImages = await _context.ProductImages
                .Where(i => i.ProductId == image.ProductId && i.ImageId != imageId)
                .ToListAsync();

            foreach (var other in otherImages)
            {
                other.IsMain = false;
            }

            image.IsMain = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Main image updated.", imageId = image.ImageId });
        }

        /// <summary>
        /// Update the display order of images (Admin only).
        /// </summary>
        [HttpPut("product/{productId}/reorder")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ReorderImages(int productId, [FromBody] ReorderImagesRequest request)
        {
            if (request.ImageIds == null || request.ImageIds.Count == 0)
            {
                return BadRequest("No image IDs provided.");
            }

            var images = await _context.ProductImages
                .Where(i => i.ProductId == productId)
                .ToListAsync();

            for (int i = 0; i < request.ImageIds.Count; i++)
            {
                var image = images.FirstOrDefault(img => img.ImageId == request.ImageIds[i]);
                if (image != null)
                {
                    image.DisplayOrder = i;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Image order updated." });
        }

        /// <summary>
        /// Delete a product image (Admin only).
        /// </summary>
        [HttpDelete("{imageId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteProductImage(int imageId)
        {
            var image = await _context.ProductImages.FindAsync(imageId);
            if (image == null)
            {
                return NotFound("Image not found.");
            }

            var wasMain = image.IsMain;
            var productId = image.ProductId;

            _context.ProductImages.Remove(image);
            await _context.SaveChangesAsync();

            // If the deleted image was main, set the first remaining image as main
            if (wasMain)
            {
                var firstImage = await _context.ProductImages
                    .Where(i => i.ProductId == productId)
                    .OrderBy(i => i.DisplayOrder)
                    .FirstOrDefaultAsync();

                if (firstImage != null)
                {
                    firstImage.IsMain = true;
                    await _context.SaveChangesAsync();
                }
            }

            _logger.LogInformation("Deleted image {ImageId} from product {ProductId}", imageId, productId);

            return Ok(new { message = "Image deleted." });
        }
    }

    public class AddProductImagesRequest
    {
        public required List<ProductImageDto> Images { get; set; }
    }

    public class ProductImageDto
    {
        public required string ImageUrl { get; set; }
        public int? VariantId { get; set; }
    }

    public class ReorderImagesRequest
    {
        public required List<int> ImageIds { get; set; }
    }
}

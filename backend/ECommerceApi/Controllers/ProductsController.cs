using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerceApi.Data;
using ECommerceApi.Models;

namespace ECommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProductsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Products
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetProducts(
            [FromQuery] int? categoryId = null, 
            [FromQuery] int? subCategoryId = null,
            [FromQuery] int? tertiaryCategoryId = null,
            [FromQuery] int? quaternaryCategoryId = null,
            [FromQuery] string? search = null)
        {
            IQueryable<Product> query = _context.Products
                .Where(p => !p.IsDeleted)
                .Include(p => p.SubCategory).ThenInclude(s => s.Category)
                .Include(p => p.TertiaryCategory)
                .Include(p => p.QuaternaryCategory);

            // Apply search filter if provided
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchTerm = search.ToLower().Trim();
                query = query.Where(p => 
                    (p.ProductName != null && p.ProductName.ToLower().Contains(searchTerm)) ||
                    (p.Description != null && p.Description.ToLower().Contains(searchTerm)) ||
                    (p.BrandName != null && p.BrandName.ToLower().Contains(searchTerm)) ||
                    (p.ShortDescription != null && p.ShortDescription.ToLower().Contains(searchTerm)) ||
                    (p.SubCategory != null && p.SubCategory.SubCategoryName != null && p.SubCategory.SubCategoryName.ToLower().Contains(searchTerm)) ||
                    (p.SubCategory != null && p.SubCategory.Category != null && p.SubCategory.Category.CategoryName != null && p.SubCategory.Category.CategoryName.ToLower().Contains(searchTerm))
                );
            }

            // Filter by most specific category first
            if (quaternaryCategoryId.HasValue)
            {
                query = query.Where(p => p.QuaternaryCategoryId == quaternaryCategoryId.Value);
            }
            else if (tertiaryCategoryId.HasValue)
            {
                query = query.Where(p => p.TertiaryCategoryId == tertiaryCategoryId.Value);
            }
            else if (subCategoryId.HasValue)
            {
                query = query.Where(p => p.SubCategoryId == subCategoryId.Value);
            }
            else if (categoryId.HasValue)
            {
                query = query.Where(p => p.SubCategory != null && p.SubCategory.CategoryId == categoryId.Value);
            }

            // Get products with seller info (lowest price seller)
            var productList = await query
                .OrderBy(p => p.SubCategory != null ? p.SubCategory.CategoryId : 999)
                .ThenBy(p => p.ProductId)
                .ToListAsync();

            // Get seller info for all products
            var productIds = productList.Select(p => p.ProductId).ToList();
            var sellerInfo = await _context.ProductSellers
                .Include(ps => ps.Seller)
                .Where(ps => productIds.Contains(ps.ProductId) && ps.IsActive && ps.StockQuantity > 0)
                .GroupBy(ps => ps.ProductId)
                .Select(g => new
                {
                    ProductId = g.Key,
                    LowestPriceSeller = g.OrderBy(ps => ps.SellerPrice).FirstOrDefault()
                })
                .ToListAsync();

            var sellerDict = sellerInfo.ToDictionary(s => s.ProductId, s => s.LowestPriceSeller);

            var products = productList.Select(p => {
                var seller = sellerDict.ContainsKey(p.ProductId) ? sellerDict[p.ProductId] : null;
                return new
                {
                    productId = p.ProductId,
                    productName = p.ProductName,
                    description = p.Description,
                    price = p.Price,
                    originalPrice = p.OriginalPrice,
                    imageUrl = p.ImageUrl,
                    stock = p.Stock,
                    brandName = p.BrandName,
                    shortDescription = p.ShortDescription,
                    subCategoryId = p.SubCategoryId,
                    subCategoryName = p.SubCategory != null ? p.SubCategory.SubCategoryName : null,
                    categoryId = p.SubCategory != null ? p.SubCategory.CategoryId : (int?)null,
                    categoryName = p.SubCategory != null && p.SubCategory.Category != null ? p.SubCategory.Category.CategoryName : null,
                    tertiaryCategoryId = p.TertiaryCategoryId,
                    tertiaryCategoryName = p.TertiaryCategory != null ? p.TertiaryCategory.TertiaryCategoryName : null,
                    quaternaryCategoryId = p.QuaternaryCategoryId,
                    quaternaryCategoryName = p.QuaternaryCategory != null ? p.QuaternaryCategory.QuaternaryCategoryName : null,
                    sellerName = seller?.Seller?.Username,
                    sellerPrice = seller?.SellerPrice,
                    sellerId = seller?.SellerId
                };
            }).ToList();

            return Ok(products);
        }

        // GET: api/Products/detail/5
        [HttpGet("detail/{id}")]
        public async Task<ActionResult<object>> GetProductDetail(int id)
        {
            var product = await _context.Products
                .Where(p => p.ProductId == id && !p.IsDeleted)
                .Include(p => p.SubCategory).ThenInclude(s => s.Category)
                .Include(p => p.ProductVariants).ThenInclude(v => v.Color)
                .Include(p => p.ProductVariants).ThenInclude(v => v.Size)
                .Include(p => p.ProductImages)
                .Include(p => p.ProductSpecifications)
                .AsNoTracking()
                .FirstOrDefaultAsync();

            if (product == null)
                return NotFound();

            var images = (product.ProductImages ?? new List<ProductImage>())
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
                .ToList();

            var variants = (product.ProductVariants ?? new List<ProductVariant>())
                .Select(v => new
                {
                    variantId = v.VariantId,
                    productId = v.ProductId,
                    colorId = v.ColorId,
                    colorName = v.Color?.ColorName,
                    sizeId = v.SizeId,
                    sizeName = v.Size?.SizeName,
                    sizeCategory = v.Size?.SizeCategory,
                    sku = v.SKU,
                    price = v.Price,
                    originalPrice = v.OriginalPrice,
                    stock = v.Stock,
                    isAvailable = v.IsAvailable
                })
                .ToList();

            var specs = (product.ProductSpecifications ?? new List<ProductSpecification>())
                .OrderBy(s => s.DisplayOrder)
                .ThenBy(s => s.SpecId)
                .Select(s => new { attributeName = s.AttributeName, attributeValue = s.AttributeValue })
                .ToList();

            var hasVariants = variants.Any();
            var defaultPrice = product.Price;
            var defaultOriginalPrice = (decimal?)null;
            if (hasVariants)
            {
                var first = variants.OrderBy(v => v.variantId).First();
                defaultPrice = first.price;
                defaultOriginalPrice = first.originalPrice;
            }

            // Get sellers for this product
            var sellers = await _context.ProductSellers
                .Include(ps => ps.Seller)
                .Where(ps => ps.ProductId == id && ps.IsActive)
                .OrderBy(ps => ps.SellerPrice)
                .Select(ps => new
                {
                    productSellerId = ps.ProductSellerId,
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

            return Ok(new
            {
                productId = product.ProductId,
                productName = product.ProductName,
                description = product.Description,
                shortDescription = product.ShortDescription,
                brandName = product.BrandName,
                price = defaultPrice,
                originalPrice = defaultOriginalPrice ?? product.OriginalPrice ?? product.Price,
                imageUrl = product.ImageUrl,
                stock = product.Stock,
                subCategoryId = product.SubCategoryId,
                subCategoryName = product.SubCategory?.SubCategoryName,
                categoryName = product.SubCategory?.Category?.CategoryName,
                hasVariants = hasVariants,
                variants = variants,
                images = images,
                specifications = specs,
                sellers = sellers,
                hasSellers = sellers.Any()
            });
        }

        // GET: api/Products/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Product>> GetProduct(int id)
        {
            var product = await _context.Products
                .Where(p => p.ProductId == id && !p.IsDeleted)
                .Include(p => p.SubCategory)
                .ThenInclude(s => s.Category)
                .FirstOrDefaultAsync();

            if (product == null)
            {
                return NotFound();
            }

            return product;
        }

        // POST: api/Products (Admin only)
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Product>> PostProduct(CreateProductRequest request)
        {
            // Use first image as the main ImageUrl if images are provided
            var mainImageUrl = request.ImageUrl ?? "";
            if (string.IsNullOrEmpty(mainImageUrl) && request.Images != null && request.Images.Count > 0)
            {
                mainImageUrl = request.Images[0].ImageUrl;
            }

            var product = new Product
            {
                ProductName = request.ProductName,
                Description = request.Description ?? "",
                Price = request.Price,
                OriginalPrice = request.OriginalPrice,
                ImageUrl = mainImageUrl,
                Stock = request.Stock,
                SubCategoryId = request.SubCategoryId,
                BrandName = request.BrandName,
                ShortDescription = request.ShortDescription
            };
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            // Add product images if provided
            if (request.Images != null && request.Images.Count > 0)
            {
                for (int i = 0; i < request.Images.Count; i++)
                {
                    var img = request.Images[i];
                    var productImage = new ProductImage
                    {
                        ProductId = product.ProductId,
                        VariantId = null,
                        ImageUrl = img.ImageUrl,
                        IsMain = i == 0, // First image is main
                        DisplayOrder = i
                    };
                    _context.ProductImages.Add(productImage);
                }
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction("GetProduct", new { id = product.ProductId }, product);
        }

        // PUT: api/Products/5 (Admin only)
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PutProduct(int id, UpdateProductRequest request)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound();
            }

            // Update product fields
            product.ProductName = request.ProductName;
            product.Description = request.Description ?? "";
            product.Price = request.Price;
            product.OriginalPrice = request.OriginalPrice;
            product.Stock = request.Stock;
            product.SubCategoryId = request.SubCategoryId;
            product.BrandName = request.BrandName;
            product.ShortDescription = request.ShortDescription;

            // Update ImageUrl if provided or use first image
            if (!string.IsNullOrEmpty(request.ImageUrl))
            {
                product.ImageUrl = request.ImageUrl;
            }
            else if (request.Images != null && request.Images.Count > 0)
            {
                product.ImageUrl = request.Images[0].ImageUrl;
            }

            try
            {
                await _context.SaveChangesAsync();

                // Handle images if provided - replace existing images
                if (request.Images != null)
                {
                    // Remove existing images
                    var existingImages = await _context.ProductImages
                        .Where(i => i.ProductId == id)
                        .ToListAsync();
                    _context.ProductImages.RemoveRange(existingImages);

                    // Add new images
                    for (int i = 0; i < request.Images.Count; i++)
                    {
                        var img = request.Images[i];
                        var productImage = new ProductImage
                        {
                            ProductId = product.ProductId,
                            VariantId = null,
                            ImageUrl = img.ImageUrl,
                            IsMain = i == 0,
                            DisplayOrder = i
                        };
                        _context.ProductImages.Add(productImage);
                    }
                    await _context.SaveChangesAsync();
                }
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProductExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return Ok(product);
        }

        // DELETE: api/Products/5 (Admin only) - soft delete
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound();
            }

            if (product.IsDeleted)
            {
                return NoContent(); // already soft-deleted
            }

            product.IsDeleted = true;
            product.DeletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ProductExists(int id)
        {
            return _context.Products.Any(e => e.ProductId == id);
        }
    }

    public class CreateProductRequest
    {
        public required string ProductName { get; set; }
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public decimal? OriginalPrice { get; set; }
        public string? ImageUrl { get; set; }
        public int Stock { get; set; }
        public int SubCategoryId { get; set; }
        public string? BrandName { get; set; }
        public string? ShortDescription { get; set; }
        public List<CreateProductImageRequest>? Images { get; set; }
    }

    public class CreateProductImageRequest
    {
        public required string ImageUrl { get; set; }
    }

    public class UpdateProductRequest
    {
        public required string ProductName { get; set; }
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public decimal? OriginalPrice { get; set; }
        public string? ImageUrl { get; set; }
        public int Stock { get; set; }
        public int SubCategoryId { get; set; }
        public string? BrandName { get; set; }
        public string? ShortDescription { get; set; }
        public List<CreateProductImageRequest>? Images { get; set; }
    }
}

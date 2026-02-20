using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerceApi.Data;
using ECommerceApi.Models;
using System.Security.Claims;

namespace ECommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CartController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CartController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int? GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId))
            {
                return userId;
            }
            return null;
        }

        /// <summary>
        /// Get all cart items for the current user
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetCartItems()
        {
            var userId = GetUserId();
            if (userId == null)
            {
                return Unauthorized("User ID not found in token.");
            }

            var cartItems = await _context.CartItems
                .Where(c => c.UserId == userId)
                .Include(c => c.Product)
                .Select(c => new
                {
                    cartItemId = c.CartItemId,
                    productId = c.ProductId,
                    productName = c.Product != null ? c.Product.ProductName : "",
                    price = c.Price ?? (c.Product != null ? c.Product.Price : 0),
                    originalPrice = c.OriginalPrice ?? (c.Product != null ? c.Product.OriginalPrice : (decimal?)null),
                    imageUrl = c.Product != null ? c.Product.ImageUrl : "",
                    quantity = c.Quantity,
                    stock = c.Product != null ? c.Product.Stock : 0,
                    sellerName = c.ProductSellerId != null
                        ? _context.ProductSellers
                            .Where(ps => ps.ProductSellerId == c.ProductSellerId)
                            .Select(ps => ps.Seller != null ? ps.Seller.Username : null)
                            .FirstOrDefault()
                        : (c.Product != null
                            ? _context.ProductSellers
                                .Where(ps => ps.ProductId == c.ProductId)
                                .Select(ps => ps.Seller != null ? ps.Seller.Username : null)
                                .FirstOrDefault()
                            : null),
                    productSellerId = c.ProductSellerId,
                    addedAt = c.AddedAt
                })
                .ToListAsync();

            return Ok(cartItems);
        }

        /// <summary>
        /// Add item to cart or update quantity if exists. Pass Price/OriginalPrice and ProductSellerId to store selected seller.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<object>> AddToCart([FromBody] AddToCartRequest request)
        {
            var userId = GetUserId();
            if (userId == null)
            {
                return Unauthorized("User ID not found in token.");
            }

            if (request.ProductId <= 0)
            {
                return BadRequest("Invalid product ID.");
            }

            // Check if product exists
            var product = await _context.Products.FindAsync(request.ProductId);
            if (product == null)
            {
                return NotFound("Product not found.");
            }

            // Check if item already in cart
            var existingItem = await _context.CartItems
                .FirstOrDefaultAsync(c => c.UserId == userId && c.ProductId == request.ProductId);

            if (existingItem != null)
            {
                existingItem.Quantity += request.Quantity > 0 ? request.Quantity : 1;
                if (request.Price.HasValue) existingItem.Price = request.Price;
                if (request.OriginalPrice.HasValue) existingItem.OriginalPrice = request.OriginalPrice;
                if (request.ProductSellerId.HasValue) existingItem.ProductSellerId = request.ProductSellerId;
                existingItem.UpdatedAt = DateTime.Now;
            }
            else
            {
                var price = request.Price ?? product.Price;
                var originalPrice = request.OriginalPrice ?? product.OriginalPrice;
                var cartItem = new CartItem
                {
                    UserId = userId.Value,
                    ProductId = request.ProductId,
                    Quantity = request.Quantity > 0 ? request.Quantity : 1,
                    Price = price,
                    OriginalPrice = originalPrice,
                    ProductSellerId = request.ProductSellerId,
                    AddedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };
                _context.CartItems.Add(cartItem);
            }

            await _context.SaveChangesAsync();

            var updatedItem = await _context.CartItems
                .Include(c => c.Product)
                .FirstOrDefaultAsync(c => c.UserId == userId && c.ProductId == request.ProductId);
            var outPrice = updatedItem?.Price ?? product.Price;
            var outOriginalPrice = updatedItem?.OriginalPrice ?? product.OriginalPrice;
            string? outSellerName = null;
            if (updatedItem?.ProductSellerId != null)
            {
                var ps = await _context.ProductSellers
                    .Include(ps => ps.Seller)
                    .FirstOrDefaultAsync(ps => ps.ProductSellerId == updatedItem.ProductSellerId);
                outSellerName = ps?.Seller?.Username;
            }

            return Ok(new
            {
                message = "Item added to cart.",
                productId = request.ProductId,
                productName = product.ProductName,
                price = outPrice,
                originalPrice = outOriginalPrice,
                imageUrl = product.ImageUrl,
                sellerName = outSellerName
            });
        }

        /// <summary>
        /// Update cart item quantity
        /// </summary>
        [HttpPut("{productId}")]
        public async Task<IActionResult> UpdateCartItem(int productId, [FromBody] UpdateCartRequest request)
        {
            var userId = GetUserId();
            if (userId == null)
            {
                return Unauthorized("User ID not found in token.");
            }

            var cartItem = await _context.CartItems
                .FirstOrDefaultAsync(c => c.UserId == userId && c.ProductId == productId);

            if (cartItem == null)
            {
                return NotFound("Cart item not found.");
            }

            if (request.Quantity <= 0)
            {
                // Remove item if quantity is 0 or less
                _context.CartItems.Remove(cartItem);
            }
            else
            {
                cartItem.Quantity = request.Quantity;
                cartItem.UpdatedAt = DateTime.Now;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Cart updated.", productId, quantity = request.Quantity });
        }

        /// <summary>
        /// Remove item from cart
        /// </summary>
        [HttpDelete("{productId}")]
        public async Task<IActionResult> RemoveFromCart(int productId)
        {
            var userId = GetUserId();
            if (userId == null)
            {
                return Unauthorized("User ID not found in token.");
            }

            var cartItem = await _context.CartItems
                .FirstOrDefaultAsync(c => c.UserId == userId && c.ProductId == productId);

            if (cartItem == null)
            {
                return NotFound("Cart item not found.");
            }

            _context.CartItems.Remove(cartItem);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Item removed from cart.", productId });
        }

        /// <summary>
        /// Clear all items from cart
        /// </summary>
        [HttpDelete]
        public async Task<IActionResult> ClearCart()
        {
            var userId = GetUserId();
            if (userId == null)
            {
                return Unauthorized("User ID not found in token.");
            }

            var cartItems = await _context.CartItems
                .Where(c => c.UserId == userId)
                .ToListAsync();

            _context.CartItems.RemoveRange(cartItems);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cart cleared.", itemsRemoved = cartItems.Count });
        }

        /// <summary>
        /// Sync local cart with server (merge or replace)
        /// </summary>
        [HttpPost("sync")]
        public async Task<ActionResult<IEnumerable<object>>> SyncCart([FromBody] SyncCartRequest request)
        {
            var userId = GetUserId();
            if (userId == null)
            {
                return Unauthorized("User ID not found in token.");
            }

            if (request.Items != null && request.Items.Count > 0)
            {
                foreach (var item in request.Items)
                {
                    if (item.ProductId <= 0) continue;

                    // Check if product exists
                    var product = await _context.Products.FindAsync(item.ProductId);
                    if (product == null) continue;

                    var existingItem = await _context.CartItems
                        .FirstOrDefaultAsync(c => c.UserId == userId && c.ProductId == item.ProductId);

                    if (existingItem != null)
                    {
                        if (request.MergeStrategy == "add")
                        {
                            existingItem.Quantity += item.Quantity;
                        }
                        else
                        {
                            existingItem.Quantity = item.Quantity;
                        }
                        if (item.Price.HasValue) existingItem.Price = item.Price;
                        if (item.OriginalPrice.HasValue) existingItem.OriginalPrice = item.OriginalPrice;
                        if (item.ProductSellerId.HasValue) existingItem.ProductSellerId = item.ProductSellerId;
                        existingItem.UpdatedAt = DateTime.Now;
                    }
                    else
                    {
                        var price = item.Price ?? product.Price;
                        var originalPrice = item.OriginalPrice ?? product.OriginalPrice;
                        var cartItem = new CartItem
                        {
                            UserId = userId.Value,
                            ProductId = item.ProductId,
                            Quantity = item.Quantity > 0 ? item.Quantity : 1,
                            Price = price,
                            OriginalPrice = originalPrice,
                            ProductSellerId = item.ProductSellerId,
                            AddedAt = DateTime.Now,
                            UpdatedAt = DateTime.Now
                        };
                        _context.CartItems.Add(cartItem);
                    }
                }

                await _context.SaveChangesAsync();
            }

            // Return updated cart
            var cartItems = await _context.CartItems
                .Where(c => c.UserId == userId)
                .Include(c => c.Product)
                .Select(c => new
                {
                    cartItemId = c.CartItemId,
                    productId = c.ProductId,
                    productName = c.Product != null ? c.Product.ProductName : "",
                    price = c.Price ?? (c.Product != null ? c.Product.Price : 0),
                    originalPrice = c.OriginalPrice ?? (c.Product != null ? c.Product.OriginalPrice : (decimal?)null),
                    imageUrl = c.Product != null ? c.Product.ImageUrl : "",
                    quantity = c.Quantity,
                    stock = c.Product != null ? c.Product.Stock : 0,
                    sellerName = c.ProductSellerId != null
                        ? _context.ProductSellers
                            .Where(ps => ps.ProductSellerId == c.ProductSellerId)
                            .Select(ps => ps.Seller != null ? ps.Seller.Username : null)
                            .FirstOrDefault()
                        : (c.Product != null
                            ? _context.ProductSellers
                                .Where(ps => ps.ProductId == c.ProductId)
                                .Select(ps => ps.Seller != null ? ps.Seller.Username : null)
                                .FirstOrDefault()
                            : null),
                    productSellerId = c.ProductSellerId,
                    addedAt = c.AddedAt
                })
                .ToListAsync();

            return Ok(cartItems);
        }
    }

    public class AddToCartRequest
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; } = 1;
        public decimal? Price { get; set; }
        public decimal? OriginalPrice { get; set; }
        public int? ProductSellerId { get; set; }
    }

    public class UpdateCartRequest
    {
        public int Quantity { get; set; }
    }

    public class SyncCartRequest
    {
        public List<SyncCartItem>? Items { get; set; }
        public string MergeStrategy { get; set; } = "replace"; // "add" or "replace"
    }

    public class SyncCartItem
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal? Price { get; set; }
        public decimal? OriginalPrice { get; set; }
        public int? ProductSellerId { get; set; }
    }
}

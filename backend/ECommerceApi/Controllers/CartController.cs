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
                    price = c.Product != null ? c.Product.Price : 0,
                    imageUrl = c.Product != null ? c.Product.ImageUrl : "",
                    quantity = c.Quantity,
                    stock = c.Product != null ? c.Product.Stock : 0,
                    sellerName = c.Product != null 
                        ? _context.ProductSellers
                            .Where(ps => ps.ProductId == c.ProductId)
                            .Select(ps => ps.Seller != null ? ps.Seller.Username : null)
                            .FirstOrDefault()
                        : null,
                    addedAt = c.AddedAt
                })
                .ToListAsync();

            return Ok(cartItems);
        }

        /// <summary>
        /// Add item to cart or update quantity if exists
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
                // Update quantity
                existingItem.Quantity += request.Quantity > 0 ? request.Quantity : 1;
                existingItem.UpdatedAt = DateTime.Now;
            }
            else
            {
                // Add new item
                var cartItem = new CartItem
                {
                    UserId = userId.Value,
                    ProductId = request.ProductId,
                    Quantity = request.Quantity > 0 ? request.Quantity : 1,
                    AddedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };
                _context.CartItems.Add(cartItem);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Item added to cart.",
                productId = request.ProductId,
                productName = product.ProductName,
                price = product.Price,
                imageUrl = product.ImageUrl
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
                        // Merge: add quantities or replace based on strategy
                        if (request.MergeStrategy == "add")
                        {
                            existingItem.Quantity += item.Quantity;
                        }
                        else
                        {
                            existingItem.Quantity = item.Quantity;
                        }
                        existingItem.UpdatedAt = DateTime.Now;
                    }
                    else
                    {
                        var cartItem = new CartItem
                        {
                            UserId = userId.Value,
                            ProductId = item.ProductId,
                            Quantity = item.Quantity > 0 ? item.Quantity : 1,
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
                    price = c.Product != null ? c.Product.Price : 0,
                    imageUrl = c.Product != null ? c.Product.ImageUrl : "",
                    quantity = c.Quantity,
                    stock = c.Product != null ? c.Product.Stock : 0,
                    sellerName = c.Product != null 
                        ? _context.ProductSellers
                            .Where(ps => ps.ProductId == c.ProductId)
                            .Select(ps => ps.Seller != null ? ps.Seller.Username : null)
                            .FirstOrDefault()
                        : null,
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
    }
}

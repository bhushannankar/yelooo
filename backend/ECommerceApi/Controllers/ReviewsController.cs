using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;
using ECommerceApi.Data;
using ECommerceApi.Models;

namespace ECommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReviewsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Reviews/product/5
        [HttpGet("product/{productId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetProductReviews(int productId)
        {
            var reviews = await _context.Reviews
                .Include(r => r.User)
                .Where(r => r.ProductId == productId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    reviewId = r.ReviewId,
                    productId = r.ProductId,
                    userId = r.UserId,
                    username = r.User != null ? r.User.Username : "Anonymous",
                    rating = r.Rating,
                    comment = r.Comment,
                    createdAt = r.CreatedAt,
                    updatedAt = r.UpdatedAt
                })
                .ToListAsync();

            return Ok(reviews);
        }

        // GET: api/Reviews/product/5/summary
        [HttpGet("product/{productId}/summary")]
        public async Task<ActionResult<object>> GetProductReviewSummary(int productId)
        {
            var reviews = await _context.Reviews
                .Where(r => r.ProductId == productId)
                .ToListAsync();

            if (!reviews.Any())
            {
                return Ok(new
                {
                    averageRating = 0.0,
                    totalReviews = 0,
                    ratingDistribution = new
                    {
                        oneStar = 0,
                        twoStar = 0,
                        threeStar = 0,
                        fourStar = 0,
                        fiveStar = 0
                    }
                });
            }

            var averageRating = reviews.Average(r => r.Rating);
            var totalReviews = reviews.Count;
            var ratingDistribution = new
            {
                oneStar = reviews.Count(r => r.Rating == 1),
                twoStar = reviews.Count(r => r.Rating == 2),
                threeStar = reviews.Count(r => r.Rating == 3),
                fourStar = reviews.Count(r => r.Rating == 4),
                fiveStar = reviews.Count(r => r.Rating == 5)
            };

            return Ok(new
            {
                averageRating = Math.Round(averageRating, 2),
                totalReviews = totalReviews,
                ratingDistribution = ratingDistribution
            });
        }

        // POST: api/Reviews
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<Review>> PostReview(CreateReviewRequest request)
        {
            // Get current user ID from JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("User not authenticated.");
            }

            // Check if product exists
            var product = await _context.Products.FindAsync(request.ProductId);
            if (product == null)
            {
                return NotFound("Product not found.");
            }

            // Check if user has already reviewed this product
            var existingReview = await _context.Reviews
                .FirstOrDefaultAsync(r => r.ProductId == request.ProductId && r.UserId == userId);

            if (existingReview != null)
            {
                // Update existing review
                existingReview.Rating = request.Rating;
                existingReview.Comment = request.Comment;
                existingReview.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    reviewId = existingReview.ReviewId,
                    productId = existingReview.ProductId,
                    userId = existingReview.UserId,
                    rating = existingReview.Rating,
                    comment = existingReview.Comment,
                    createdAt = existingReview.CreatedAt,
                    updatedAt = existingReview.UpdatedAt,
                    message = "Review updated successfully."
                });
            }

            // Create new review
            var review = new Review
            {
                ProductId = request.ProductId,
                UserId = userId,
                Rating = request.Rating,
                Comment = request.Comment,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProductReviews), new { productId = review.ProductId }, new
            {
                reviewId = review.ReviewId,
                productId = review.ProductId,
                userId = review.UserId,
                rating = review.Rating,
                comment = review.Comment,
                createdAt = review.CreatedAt,
                updatedAt = review.UpdatedAt,
                message = "Review submitted successfully."
            });
        }

        // DELETE: api/Reviews/5
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteReview(int id)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review == null)
            {
                return NotFound();
            }

            // Get current user ID from JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("User not authenticated.");
            }

            // Check if user owns this review or is admin
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (review.UserId != userId && (user?.Role?.RoleName != "Admin"))
            {
                return Forbid("You can only delete your own reviews.");
            }

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    public class CreateReviewRequest
    {
        [Required]
        public int ProductId { get; set; }

        [Required]
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int Rating { get; set; }

        [StringLength(2000)]
        public string? Comment { get; set; }
    }
}

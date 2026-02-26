using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerceApi.Data;
using ECommerceApi.Models;

namespace ECommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategorySlidesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CategorySlidesController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get slide images for a category (for home page - changes with category selection).
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetSlides([FromQuery] int? categoryId)
        {
            IQueryable<CategorySlideImage> query = _context.CategorySlideImages
                .Include(s => s.Category)
                .OrderBy(s => s.DisplayOrder)
                .ThenBy(s => s.CategorySlideImageId);

            if (categoryId.HasValue)
                query = query.Where(s => s.CategoryId == categoryId.Value);

            var list = await query
                .Select(s => new
                {
                    categorySlideImageId = s.CategorySlideImageId,
                    categoryId = s.CategoryId,
                    categoryName = s.Category != null ? s.Category.CategoryName : "",
                    imageUrl = s.ImageUrl,
                    displayOrder = s.DisplayOrder,
                    title = s.Title,
                    subtitle = s.Subtitle,
                    buttonText = s.ButtonText,
                    link = s.Link
                })
                .ToListAsync();

            return Ok(list);
        }

        /// <summary>
        /// Get a single slide by id (admin).
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetSlide(int id)
        {
            var slide = await _context.CategorySlideImages
                .Include(s => s.Category)
                .Where(s => s.CategorySlideImageId == id)
                .Select(s => new
                {
                    categorySlideImageId = s.CategorySlideImageId,
                    categoryId = s.CategoryId,
                    categoryName = s.Category != null ? s.Category.CategoryName : "",
                    imageUrl = s.ImageUrl,
                    displayOrder = s.DisplayOrder,
                    title = s.Title,
                    subtitle = s.Subtitle,
                    buttonText = s.ButtonText,
                    link = s.Link
                })
                .FirstOrDefaultAsync();

            if (slide == null)
                return NotFound();

            return Ok(slide);
        }

        /// <summary>
        /// Add a slide image to a category (Admin).
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<object>> AddSlide([FromBody] AddCategorySlideRequest request)
        {
            var category = await _context.Categories.FindAsync(request.CategoryId);
            if (category == null)
                return NotFound("Category not found.");

            var maxOrder = await _context.CategorySlideImages
                .Where(s => s.CategoryId == request.CategoryId)
                .Select(s => (int?)s.DisplayOrder)
                .DefaultIfEmpty(-1)
                .MaxAsync() + 1;

            var slide = new CategorySlideImage
            {
                CategoryId = request.CategoryId,
                ImageUrl = request.ImageUrl ?? "",
                DisplayOrder = request.DisplayOrder ?? maxOrder ?? 0,
                Title = request.Title,
                Subtitle = request.Subtitle,
                ButtonText = request.ButtonText,
                Link = request.Link
            };

            _context.CategorySlideImages.Add(slide);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSlide), new { id = slide.CategorySlideImageId }, new
            {
                categorySlideImageId = slide.CategorySlideImageId,
                categoryId = slide.CategoryId,
                imageUrl = slide.ImageUrl,
                displayOrder = slide.DisplayOrder,
                title = slide.Title,
                subtitle = slide.Subtitle,
                buttonText = slide.ButtonText,
                link = slide.Link
            });
        }

        /// <summary>
        /// Update a slide image (Admin).
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateSlide(int id, [FromBody] UpdateCategorySlideRequest request)
        {
            var slide = await _context.CategorySlideImages.FindAsync(id);
            if (slide == null)
                return NotFound();

            if (request.ImageUrl != null)
                slide.ImageUrl = request.ImageUrl;
            if (request.DisplayOrder.HasValue)
                slide.DisplayOrder = request.DisplayOrder.Value;
            slide.Title = request.Title ?? slide.Title;
            slide.Subtitle = request.Subtitle ?? slide.Subtitle;
            slide.ButtonText = request.ButtonText ?? slide.ButtonText;
            slide.Link = request.Link ?? slide.Link;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        /// <summary>
        /// Delete a slide image (Admin).
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteSlide(int id)
        {
            var slide = await _context.CategorySlideImages.FindAsync(id);
            if (slide == null)
                return NotFound();

            _context.CategorySlideImages.Remove(slide);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    public class AddCategorySlideRequest
    {
        public int CategoryId { get; set; }
        public string? ImageUrl { get; set; }
        public int? DisplayOrder { get; set; }
        public string? Title { get; set; }
        public string? Subtitle { get; set; }
        public string? ButtonText { get; set; }
        public string? Link { get; set; }
    }

    public class UpdateCategorySlideRequest
    {
        public string? ImageUrl { get; set; }
        public int? DisplayOrder { get; set; }
        public string? Title { get; set; }
        public string? Subtitle { get; set; }
        public string? ButtonText { get; set; }
        public string? Link { get; set; }
    }
}

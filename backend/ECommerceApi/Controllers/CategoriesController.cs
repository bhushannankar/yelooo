using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerceApi.Data;
using ECommerceApi.Models;

namespace ECommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public CategoriesController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        private int GetMaxCategoriesLimit()
        {
            return _configuration.GetValue("CategoryLimits:MaxCategories", 5);
        }

        // GET: api/Categories
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
        {
            return await _context.Categories.OrderBy(c => c.DisplayOrder).ThenBy(c => c.CategoryId).ToListAsync();
        }

        // GET: api/Categories/with-subcategories
        [HttpGet("with-subcategories")]
        public async Task<ActionResult<IEnumerable<object>>> GetCategoriesWithSubCategories()
        {
            var categories = await _context.Categories
                .Include(c => c.SubCategories)!
                    .ThenInclude(s => s.TertiaryCategories)!
                        .ThenInclude(t => t.QuaternaryCategories)
                .OrderBy(c => c.DisplayOrder)
                .ThenBy(c => c.CategoryId)
                .Select(c => new
                {
                    categoryId = c.CategoryId,
                    categoryName = c.CategoryName,
                    displayOrder = c.DisplayOrder,
                    imageUrl = c.ImageUrl,
                    subCategories = c.SubCategories!.OrderBy(s => s.SubCategoryId).Select(s => new
                    {
                        subCategoryId = s.SubCategoryId,
                        subCategoryName = s.SubCategoryName,
                        tertiaryCategories = s.TertiaryCategories!.OrderBy(t => t.TertiaryCategoryId).Select(t => new
                        {
                            tertiaryCategoryId = t.TertiaryCategoryId,
                            tertiaryCategoryName = t.TertiaryCategoryName,
                            imageUrl = t.ImageUrl,
                            description = t.Description,
                            quaternaryCategories = t.QuaternaryCategories!.OrderBy(q => q.QuaternaryCategoryId).Select(q => new
                            {
                                quaternaryCategoryId = q.QuaternaryCategoryId,
                                quaternaryCategoryName = q.QuaternaryCategoryName,
                                imageUrl = q.ImageUrl,
                                description = q.Description
                            }).ToList()
                        }).ToList()
                    }).ToList()
                })
                .ToListAsync();
            return Ok(categories);
        }

        // GET: api/Categories/limits
        [HttpGet("limits")]
        public async Task<ActionResult<object>> GetCategoryLimits()
        {
            var max = GetMaxCategoriesLimit();
            var current = await _context.Categories.CountAsync();
            return Ok(new { maxCategories = max, currentCount = current });
        }

        // GET: api/Categories/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Category>> GetCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);

            if (category == null)
            {
                return NotFound();
            }

            return category;
        }

        // POST: api/Categories
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Category>> PostCategory(Category category)
        {
            var max = GetMaxCategoriesLimit();
            var current = await _context.Categories.CountAsync();
            if (current >= max)
            {
                return BadRequest(new { message = $"Maximum number of categories ({max}) reached. Cannot add more." });
            }

            var maxOrder = await _context.Categories.AnyAsync()
                ? await _context.Categories.MaxAsync(c => c.DisplayOrder) + 1
                : 0;
            category.DisplayOrder = maxOrder;
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetCategory", new { id = category.CategoryId }, category);
        }

        // PUT: api/Categories/reorder - body: { orderedCategoryIds: [3, 1, 2] }
        [HttpPut("reorder")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ReorderCategories([FromBody] ReorderRequest request)
        {
            if (request?.OrderedCategoryIds == null || request.OrderedCategoryIds.Count == 0)
                return BadRequest(new { message = "orderedCategoryIds is required." });

            var ids = request.OrderedCategoryIds.Distinct().ToList();
            var existing = await _context.Categories.Where(c => ids.Contains(c.CategoryId)).ToListAsync();
            if (existing.Count != ids.Count)
                return BadRequest(new { message = "One or more category ids are invalid." });

            for (var i = 0; i < ids.Count; i++)
            {
                var cat = existing.First(c => c.CategoryId == ids[i]);
                cat.DisplayOrder = i;
            }
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // PUT: api/Categories/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PutCategory(int id, Category category)
        {
            if (id != category.CategoryId)
                return BadRequest();

            var existing = await _context.Categories.FindAsync(id);
            if (existing == null)
                return NotFound();

            existing.CategoryName = category.CategoryName;
            existing.ImageUrl = category.ImageUrl;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/Categories/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound();
            }

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool CategoryExists(int id)
        {
            return _context.Categories.Any(e => e.CategoryId == id);
        }
    }

    public class ReorderRequest
    {
        public List<int> OrderedCategoryIds { get; set; } = new();
    }
}

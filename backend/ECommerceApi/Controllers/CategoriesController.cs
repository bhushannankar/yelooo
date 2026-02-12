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

        public CategoriesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Categories
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
        {
            return await _context.Categories.OrderBy(c => c.CategoryId).ToListAsync();
        }

        // GET: api/Categories/with-subcategories
        [HttpGet("with-subcategories")]
        public async Task<ActionResult<IEnumerable<object>>> GetCategoriesWithSubCategories()
        {
            var categories = await _context.Categories
                .Include(c => c.SubCategories)!
                    .ThenInclude(s => s.TertiaryCategories)!
                        .ThenInclude(t => t.QuaternaryCategories)
                .OrderBy(c => c.CategoryId)
                .Select(c => new
                {
                    categoryId = c.CategoryId,
                    categoryName = c.CategoryName,
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
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetCategory", new { id = category.CategoryId }, category);
        }

        // PUT: api/Categories/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PutCategory(int id, Category category)
        {
            if (id != category.CategoryId)
            {
                return BadRequest();
            }

            _context.Entry(category).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CategoryExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

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
}

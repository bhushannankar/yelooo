using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerceApi.Data;
using ECommerceApi.Models;

namespace ECommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SubCategoriesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SubCategoriesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetSubCategories([FromQuery] int? categoryId = null)
        {
            var query = _context.SubCategories.Include(s => s.Category).AsQueryable();
            if (categoryId.HasValue)
                query = query.Where(s => s.CategoryId == categoryId.Value);

            var list = await query
                .OrderBy(s => s.Category != null ? s.Category.CategoryName : "")
                .ThenBy(s => s.SubCategoryName)
                .Select(s => new
                {
                    subCategoryId = s.SubCategoryId,
                    subCategoryName = s.SubCategoryName,
                    categoryId = s.CategoryId,
                    categoryName = s.Category != null ? s.Category.CategoryName : ""
                })
                .ToListAsync();
            return Ok(list);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<SubCategory>> GetSubCategory(int id)
        {
            var item = await _context.SubCategories.FindAsync(id);
            if (item == null) return NotFound();
            return item;
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<SubCategory>> PostSubCategory([FromBody] SubCategory item)
        {
            _context.SubCategories.Add(item);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetSubCategory", new { id = item.SubCategoryId }, item);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PutSubCategory(int id, [FromBody] SubCategory item)
        {
            if (id != item.SubCategoryId) return BadRequest();
            _context.Entry(item).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.SubCategories.AnyAsync(e => e.SubCategoryId == id))
                    return NotFound();
                throw;
            }
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteSubCategory(int id)
        {
            var item = await _context.SubCategories.FindAsync(id);
            if (item == null) return NotFound();
            _context.SubCategories.Remove(item);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

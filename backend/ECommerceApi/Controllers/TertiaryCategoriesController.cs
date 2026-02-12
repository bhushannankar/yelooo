using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerceApi.Data;
using ECommerceApi.Models;

namespace ECommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TertiaryCategoriesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TertiaryCategoriesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetTertiaryCategories([FromQuery] int? subCategoryId = null)
        {
            var query = _context.TertiaryCategories.Include(t => t.SubCategory).AsQueryable();
            if (subCategoryId.HasValue)
                query = query.Where(t => t.SubCategoryId == subCategoryId.Value);

            var list = await query
                .OrderBy(t => t.SubCategoryId)
                .ThenBy(t => t.TertiaryCategoryName)
                .Select(t => new
                {
                    tertiaryCategoryId = t.TertiaryCategoryId,
                    tertiaryCategoryName = t.TertiaryCategoryName,
                    subCategoryId = t.SubCategoryId,
                    subCategoryName = t.SubCategory != null ? t.SubCategory.SubCategoryName : "",
                    imageUrl = t.ImageUrl,
                    description = t.Description
                })
                .ToListAsync();
            return Ok(list);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TertiaryCategory>> GetTertiaryCategory(int id)
        {
            var item = await _context.TertiaryCategories.FindAsync(id);
            if (item == null) return NotFound();
            return item;
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<TertiaryCategory>> PostTertiaryCategory([FromBody] TertiaryCategory item)
        {
            _context.TertiaryCategories.Add(item);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetTertiaryCategory", new { id = item.TertiaryCategoryId }, item);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PutTertiaryCategory(int id, [FromBody] TertiaryCategory item)
        {
            if (id != item.TertiaryCategoryId) return BadRequest();
            _context.Entry(item).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.TertiaryCategories.AnyAsync(e => e.TertiaryCategoryId == id))
                    return NotFound();
                throw;
            }
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteTertiaryCategory(int id)
        {
            var item = await _context.TertiaryCategories.FindAsync(id);
            if (item == null) return NotFound();
            _context.TertiaryCategories.Remove(item);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

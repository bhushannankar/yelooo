using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerceApi.Data;
using ECommerceApi.Models;

namespace ECommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class QuaternaryCategoriesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public QuaternaryCategoriesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetQuaternaryCategories([FromQuery] int? tertiaryCategoryId = null)
        {
            var query = _context.QuaternaryCategories.Include(q => q.TertiaryCategory).AsQueryable();
            if (tertiaryCategoryId.HasValue)
                query = query.Where(q => q.TertiaryCategoryId == tertiaryCategoryId.Value);

            var list = await query
                .OrderBy(q => q.TertiaryCategoryId)
                .ThenBy(q => q.QuaternaryCategoryName)
                .Select(q => new
                {
                    quaternaryCategoryId = q.QuaternaryCategoryId,
                    quaternaryCategoryName = q.QuaternaryCategoryName,
                    tertiaryCategoryId = q.TertiaryCategoryId,
                    tertiaryCategoryName = q.TertiaryCategory != null ? q.TertiaryCategory.TertiaryCategoryName : "",
                    imageUrl = q.ImageUrl,
                    description = q.Description
                })
                .ToListAsync();
            return Ok(list);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<QuaternaryCategory>> GetQuaternaryCategory(int id)
        {
            var item = await _context.QuaternaryCategories.FindAsync(id);
            if (item == null) return NotFound();
            return item;
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<QuaternaryCategory>> PostQuaternaryCategory([FromBody] QuaternaryCategory item)
        {
            _context.QuaternaryCategories.Add(item);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetQuaternaryCategory", new { id = item.QuaternaryCategoryId }, item);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PutQuaternaryCategory(int id, [FromBody] QuaternaryCategory item)
        {
            if (id != item.QuaternaryCategoryId) return BadRequest();
            _context.Entry(item).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.QuaternaryCategories.AnyAsync(e => e.QuaternaryCategoryId == id))
                    return NotFound();
                throw;
            }
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteQuaternaryCategory(int id)
        {
            var item = await _context.QuaternaryCategories.FindAsync(id);
            if (item == null) return NotFound();
            _context.QuaternaryCategories.Remove(item);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerceApi.Data;

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

        // GET: api/SubCategories
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetSubCategories()
        {
            var list = await _context.SubCategories
                .Include(s => s.Category)
                .OrderBy(s => s.Category!.CategoryName)
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
    }
}

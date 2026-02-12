using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerceApi.Data;

namespace ECommerceApi.Controllers
{
    /// <summary>
    /// Public API for customers to discover sellers by area and category.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous]
    public class SellersListController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SellersListController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get sellers list for customers. Filter by pin code, city, and/or category (primary, sub, tertiary, quaternary).
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetSellers(
            [FromQuery] string? pinCode = null,
            [FromQuery] string? city = null,
            [FromQuery] int? categoryId = null,
            [FromQuery] int? subCategoryId = null,
            [FromQuery] int? tertiaryCategoryId = null,
            [FromQuery] int? quaternaryCategoryId = null)
        {
            var query = _context.Users
                .Include(u => u.Role)
                .Where(u => u.Role != null && u.Role.RoleName == "Seller");

            if (!string.IsNullOrWhiteSpace(pinCode))
            {
                var code = pinCode.Trim();
                query = query.Where(u => u.PinCode != null && u.PinCode == code);
            }

            if (!string.IsNullOrWhiteSpace(city))
            {
                var cityFilter = city.Trim();
                query = query.Where(u => u.City != null && u.City.ToLower() == cityFilter.ToLower());
            }

            if (quaternaryCategoryId.HasValue || tertiaryCategoryId.HasValue || subCategoryId.HasValue || categoryId.HasValue)
            {
                List<int> allowedQuaternaryIds;
                if (quaternaryCategoryId.HasValue)
                {
                    allowedQuaternaryIds = new List<int> { quaternaryCategoryId.Value };
                }
                else if (tertiaryCategoryId.HasValue)
                {
                    allowedQuaternaryIds = await _context.QuaternaryCategories
                        .Where(q => q.TertiaryCategoryId == tertiaryCategoryId.Value)
                        .Select(q => q.QuaternaryCategoryId)
                        .ToListAsync();
                }
                else if (subCategoryId.HasValue)
                {
                    var tertiaryIds = await _context.TertiaryCategories
                        .Where(t => t.SubCategoryId == subCategoryId.Value)
                        .Select(t => t.TertiaryCategoryId)
                        .ToListAsync();
                    allowedQuaternaryIds = await _context.QuaternaryCategories
                        .Where(q => tertiaryIds.Contains(q.TertiaryCategoryId))
                        .Select(q => q.QuaternaryCategoryId)
                        .ToListAsync();
                }
                else
                {
                    var subIds = await _context.SubCategories
                        .Where(s => s.CategoryId == categoryId!.Value)
                        .Select(s => s.SubCategoryId)
                        .ToListAsync();
                    var tertiaryIds = await _context.TertiaryCategories
                        .Where(t => subIds.Contains(t.SubCategoryId))
                        .Select(t => t.TertiaryCategoryId)
                        .ToListAsync();
                    allowedQuaternaryIds = await _context.QuaternaryCategories
                        .Where(q => tertiaryIds.Contains(q.TertiaryCategoryId))
                        .Select(q => q.QuaternaryCategoryId)
                        .ToListAsync();
                }

                var sellerIdsInCategory = await _context.SellerQuaternaryCategories
                    .Where(sq => allowedQuaternaryIds.Contains(sq.QuaternaryCategoryId))
                    .Select(sq => sq.SellerId)
                    .Distinct()
                    .ToListAsync();

                query = query.Where(u => sellerIdsInCategory.Contains(u.UserId));
            }

            var sellerIds = await query.Select(u => u.UserId).ToListAsync();

            var sellerCategoryInfo = await _context.SellerQuaternaryCategories
                .Where(sq => sellerIds.Contains(sq.SellerId))
                .Include(sq => sq.QuaternaryCategory)
                    .ThenInclude(q => q!.TertiaryCategory)
                    .ThenInclude(t => t!.SubCategory)
                    .ThenInclude(s => s!.Category)
                .Select(sq => new
                {
                    sq.SellerId,
                    path = sq.QuaternaryCategory != null
                        && sq.QuaternaryCategory.TertiaryCategory != null
                        && sq.QuaternaryCategory.TertiaryCategory.SubCategory != null
                        && sq.QuaternaryCategory.TertiaryCategory.SubCategory.Category != null
                        ? sq.QuaternaryCategory.TertiaryCategory.SubCategory.Category.CategoryName + " › "
                          + sq.QuaternaryCategory.TertiaryCategory.SubCategory.SubCategoryName + " › "
                          + sq.QuaternaryCategory.TertiaryCategory.TertiaryCategoryName + " › "
                          + sq.QuaternaryCategory.QuaternaryCategoryName
                        : (string?)null
                })
                .ToListAsync();

            var categoriesBySeller = sellerCategoryInfo
                .GroupBy(x => x.SellerId)
                .ToDictionary(g => g.Key, g => g.Where(x => x.path != null).Select(x => x.path!).Distinct().ToList());

            var sellers = await query
                .OrderBy(u => u.City)
                .ThenBy(u => u.PinCode)
                .ThenBy(u => u.Username)
                .Select(u => new
                {
                    userId = u.UserId,
                    referralCode = u.ReferralCode,
                    username = u.Username,
                    fullName = u.FullName,
                    email = u.Email,
                    phoneNumber = u.PhoneNumber,
                    city = u.City,
                    state = u.State,
                    pinCode = u.PinCode,
                    address = u.Address
                })
                .ToListAsync();

            var result = sellers.Select(s => new
            {
                s.userId,
                s.referralCode,
                s.username,
                s.fullName,
                s.email,
                s.phoneNumber,
                s.city,
                s.state,
                s.pinCode,
                s.address,
                categoryNames = categoriesBySeller.TryGetValue(s.userId, out var list) ? list : new List<string>()
            }).ToList();

            return Ok(result);
        }
    }
}

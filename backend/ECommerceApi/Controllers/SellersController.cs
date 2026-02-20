using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerceApi.Data;
using ECommerceApi.Models;
using ECommerceApi.Services;
using BCrypt.Net;

namespace ECommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class SellersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IReferralCodeService _referralCodeService;
        private readonly IEmailService _emailService;

        public SellersController(ApplicationDbContext context, IReferralCodeService referralCodeService, IEmailService emailService)
        {
            _context = context;
            _referralCodeService = referralCodeService;
            _emailService = emailService;
        }

        /// <summary>
        /// Get all sellers with their mapped category paths (Sub, Tertiary, Quaternary).
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetSellers()
        {
            var sellerUsers = await _context.Users
                .Include(u => u.Role)
                .Where(u => u.Role != null && u.Role.RoleName == "Seller")
                .ToListAsync();

            var sellerIds = sellerUsers.Select(u => u.UserId).ToList();
            var categoryPaths = await GetSellerCategoryPathsAsync(sellerIds);

            var sellers = sellerUsers.Select(u => new
            {
                userId = u.UserId,
                username = u.Username,
                email = u.Email,
                commissionPercent = u.CommissionPercent,
                createdAt = u.CreatedAt == default || u.CreatedAt.Year < 1980 ? (DateTime?)null : u.CreatedAt,
                roleName = u.Role?.RoleName ?? "",
                categories = categoryPaths.TryGetValue(u.UserId, out var paths) ? paths : new List<string>()
            }).ToList();

            return Ok(sellers);
        }

        private async Task<Dictionary<int, List<string>>> GetSellerCategoryPathsAsync(List<int> sellerIds)
        {
            var result = new Dictionary<int, List<string>>();
            foreach (var id in sellerIds)
                result[id] = new List<string>();

            if (sellerIds.Count == 0) return result;

            // SubCategory: Category > SubCategoryName
            var subMaps = await _context.SellerSubCategories
                .Where(ss => sellerIds.Contains(ss.SellerId))
                .Include(ss => ss.SubCategory).ThenInclude(s => s!.Category)
                .ToListAsync();
            foreach (var ss in subMaps)
            {
                if (ss.SubCategory?.Category != null && ss.SubCategory != null)
                {
                    var path = $"{ss.SubCategory.Category.CategoryName} > {ss.SubCategory.SubCategoryName}";
                    if (!result[ss.SellerId].Contains(path))
                        result[ss.SellerId].Add(path);
                }
            }

            // TertiaryCategory: Category > Sub > TertiaryName
            var tertMaps = await _context.SellerTertiaryCategories
                .Where(st => sellerIds.Contains(st.SellerId))
                .Include(st => st.TertiaryCategory).ThenInclude(t => t!.SubCategory).ThenInclude(s => s!.Category)
                .ToListAsync();
            foreach (var st in tertMaps)
            {
                var t = st.TertiaryCategory;
                if (t?.SubCategory?.Category != null)
                {
                    var path = $"{t.SubCategory.Category.CategoryName} > {t.SubCategory.SubCategoryName} > {t.TertiaryCategoryName}";
                    if (!result[st.SellerId].Contains(path))
                        result[st.SellerId].Add(path);
                }
            }

            // QuaternaryCategory: Category > Sub > Tertiary > QuaternaryName
            var quatMaps = await _context.SellerQuaternaryCategories
                .Where(sq => sellerIds.Contains(sq.SellerId))
                .Include(sq => sq.QuaternaryCategory).ThenInclude(q => q!.TertiaryCategory).ThenInclude(t => t!.SubCategory).ThenInclude(s => s!.Category)
                .ToListAsync();
            foreach (var sq in quatMaps)
            {
                var q = sq.QuaternaryCategory;
                if (q?.TertiaryCategory?.SubCategory?.Category != null)
                {
                    var path = $"{q.TertiaryCategory.SubCategory.Category.CategoryName} > {q.TertiaryCategory.SubCategory.SubCategoryName} > {q.TertiaryCategory.TertiaryCategoryName} > {q.QuaternaryCategoryName}";
                    if (!result[sq.SellerId].Contains(path))
                        result[sq.SellerId].Add(path);
                }
            }

            return result;
        }

        /// <summary>
        /// Get seller by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetSeller(int id)
        {
            // Project without CreatedAt to avoid SQL conversion errors if that column is string or has invalid data
            var seller = await _context.Users
                .Include(u => u.Role)
                .Where(u => u.UserId == id && u.Role != null && u.Role.RoleName == "Seller")
                .Select(u => new
                {
                    userId = u.UserId,
                    username = u.Username,
                    email = u.Email,
                    commissionPercent = u.CommissionPercent,
                    roleName = u.Role != null ? u.Role.RoleName : ""
                })
                .FirstOrDefaultAsync();

            if (seller == null)
            {
                return NotFound("Seller not found.");
            }

            var subCategoryIds = await _context.SellerSubCategories
                .Where(s => s.SellerId == id)
                .Select(s => s.SubCategoryId)
                .ToListAsync();
            var tertiaryCategoryIds = await _context.SellerTertiaryCategories
                .Where(s => s.SellerId == id)
                .Select(s => s.TertiaryCategoryId)
                .ToListAsync();
            var quaternaryCategoryIds = await _context.SellerQuaternaryCategories
                .Where(s => s.SellerId == id)
                .Select(s => s.QuaternaryCategoryId)
                .ToListAsync();

            return Ok(new
            {
                seller.userId,
                seller.username,
                seller.email,
                seller.commissionPercent,
                createdAt = (DateTime?)null, // Omitted from query to avoid date conversion errors; list view uses GetSellers for date
                seller.roleName,
                subCategoryIds,
                tertiaryCategoryIds,
                quaternaryCategoryIds
            });
        }

        /// <summary>
        /// Create a new seller
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateSeller([FromBody] CreateSellerRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
            {
                return BadRequest("Username already exists.");
            }

            var sellerRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Seller");
            if (sellerRole == null)
            {
                return BadRequest("Seller role not found in the system.");
            }

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
            var sellerUserId = await _referralCodeService.GetNextSellerCodeAsync();

            var seller = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = passwordHash,
                CreatedAt = DateTime.Now,
                RoleId = sellerRole.RoleId,
                CommissionPercent = request.CommissionPercent,
                ReferralCode = sellerUserId
            };

            _context.Users.Add(seller);
            await _context.SaveChangesAsync();

            // SubCategory level (tertiary/quaternary optional)
            if (request.SubCategoryIds != null)
                foreach (var sid in request.SubCategoryIds.Distinct())
                    if (await _context.SubCategories.AnyAsync(s => s.SubCategoryId == sid))
                        _context.SellerSubCategories.Add(new SellerSubCategory { SellerId = seller.UserId, SubCategoryId = sid });
            // Tertiary level
            if (request.TertiaryCategoryIds != null)
                foreach (var tid in request.TertiaryCategoryIds.Distinct())
                    if (await _context.TertiaryCategories.AnyAsync(t => t.TertiaryCategoryId == tid))
                        _context.SellerTertiaryCategories.Add(new SellerTertiaryCategory { SellerId = seller.UserId, TertiaryCategoryId = tid });
            // Quaternary level
            if (request.QuaternaryCategoryIds != null)
                foreach (var qid in request.QuaternaryCategoryIds.Distinct())
                    if (await _context.QuaternaryCategories.AnyAsync(q => q.QuaternaryCategoryId == qid))
                        _context.SellerQuaternaryCategories.Add(new SellerQuaternaryCategory { SellerId = seller.UserId, QuaternaryCategoryId = qid });
            if (request.SubCategoryIds?.Count > 0 || request.TertiaryCategoryIds?.Count > 0 || request.QuaternaryCategoryIds?.Count > 0)
                await _context.SaveChangesAsync();

            await _emailService.SendWelcomeEmailAsync(seller.Email, seller.Username, seller.ReferralCode ?? "", "Seller");

            return StatusCode(201, new { message = "Seller created successfully.", userId = seller.UserId, sellerId = seller.UserId, referralCode = seller.ReferralCode });
        }

        /// <summary>
        /// Update seller
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSeller(int id, [FromBody] UpdateSellerRequest request)
        {
            var seller = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == id && u.Role != null && u.Role.RoleName == "Seller");

            if (seller == null)
            {
                return NotFound("Seller not found.");
            }

            // Check if username is being changed and if it's already taken
            if (request.Username != seller.Username)
            {
                if (await _context.Users.AnyAsync(u => u.Username == request.Username && u.UserId != id))
                {
                    return BadRequest("Username already exists.");
                }
                seller.Username = request.Username;
            }

            // Check if email is being changed and if it's already taken
            if (request.Email != seller.Email)
            {
                seller.Email = request.Email;
            }

            // Update password if provided
            if (!string.IsNullOrEmpty(request.Password))
            {
                seller.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
            }

            // Update commission percent if provided
            if (request.CommissionPercent.HasValue)
            {
                seller.CommissionPercent = request.CommissionPercent.Value;
            }

            // Replace category mappings
            var existingSub = await _context.SellerSubCategories.Where(s => s.SellerId == id).ToListAsync();
            var existingTert = await _context.SellerTertiaryCategories.Where(s => s.SellerId == id).ToListAsync();
            var existingQuat = await _context.SellerQuaternaryCategories.Where(s => s.SellerId == id).ToListAsync();
            _context.SellerSubCategories.RemoveRange(existingSub);
            _context.SellerTertiaryCategories.RemoveRange(existingTert);
            _context.SellerQuaternaryCategories.RemoveRange(existingQuat);

            if (request.SubCategoryIds != null)
                foreach (var sid in request.SubCategoryIds.Distinct())
                    if (await _context.SubCategories.AnyAsync(s => s.SubCategoryId == sid))
                        _context.SellerSubCategories.Add(new SellerSubCategory { SellerId = id, SubCategoryId = sid });
            if (request.TertiaryCategoryIds != null)
                foreach (var tid in request.TertiaryCategoryIds.Distinct())
                    if (await _context.TertiaryCategories.AnyAsync(t => t.TertiaryCategoryId == tid))
                        _context.SellerTertiaryCategories.Add(new SellerTertiaryCategory { SellerId = id, TertiaryCategoryId = tid });
            if (request.QuaternaryCategoryIds != null)
                foreach (var qid in request.QuaternaryCategoryIds.Distinct())
                    if (await _context.QuaternaryCategories.AnyAsync(q => q.QuaternaryCategoryId == qid))
                        _context.SellerQuaternaryCategories.Add(new SellerQuaternaryCategory { SellerId = id, QuaternaryCategoryId = qid });

            await _context.SaveChangesAsync();

            return Ok(new { message = "Seller updated successfully." });
        }

        /// <summary>
        /// Delete seller
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSeller(int id)
        {
            var seller = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == id && u.Role != null && u.Role.RoleName == "Seller");

            if (seller == null)
            {
                return NotFound("Seller not found.");
            }

            _context.Users.Remove(seller);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Seller deleted successfully." });
        }
    }

    public class CreateSellerRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public decimal? CommissionPercent { get; set; }
        /// <summary>SubCategory IDs (optional). Seller can sell in entire sub.</summary>
        public List<int>? SubCategoryIds { get; set; }
        /// <summary>Tertiary category IDs (optional).</summary>
        public List<int>? TertiaryCategoryIds { get; set; }
        /// <summary>Quaternary category IDs (optional).</summary>
        public List<int>? QuaternaryCategoryIds { get; set; }
    }

    public class UpdateSellerRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Password { get; set; }
        public decimal? CommissionPercent { get; set; }
        public List<int>? SubCategoryIds { get; set; }
        public List<int>? TertiaryCategoryIds { get; set; }
        public List<int>? QuaternaryCategoryIds { get; set; }
    }
}

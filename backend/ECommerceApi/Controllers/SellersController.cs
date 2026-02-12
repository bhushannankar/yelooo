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
        /// Get all sellers
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetSellers()
        {
            var sellers = await _context.Users
                .Include(u => u.Role)
                .Where(u => u.Role != null && u.Role.RoleName == "Seller")
                .Select(u => new
                {
                    userId = u.UserId,
                    username = u.Username,
                    email = u.Email,
                    commissionPercent = u.CommissionPercent,
                    createdAt = u.CreatedAt,
                    roleName = u.Role != null ? u.Role.RoleName : ""
                })
                .ToListAsync();

            return Ok(sellers);
        }

        /// <summary>
        /// Get seller by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetSeller(int id)
        {
            var seller = await _context.Users
                .Include(u => u.Role)
                .Where(u => u.UserId == id && u.Role != null && u.Role.RoleName == "Seller")
                .Select(u => new
                {
                    userId = u.UserId,
                    username = u.Username,
                    email = u.Email,
                    commissionPercent = u.CommissionPercent,
                    createdAt = u.CreatedAt,
                    roleName = u.Role != null ? u.Role.RoleName : ""
                })
                .FirstOrDefaultAsync();

            if (seller == null)
            {
                return NotFound("Seller not found.");
            }

            return Ok(seller);
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

            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest("Email already exists.");
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

            await _emailService.SendWelcomeEmailAsync(seller.Email, seller.Username, seller.ReferralCode ?? "", "Seller");

            return StatusCode(201, new { message = "Seller created successfully.", sellerId = seller.UserId, referralCode = seller.ReferralCode });
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
                if (await _context.Users.AnyAsync(u => u.Email == request.Email && u.UserId != id))
                {
                    return BadRequest("Email already exists.");
                }
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
    }

    public class UpdateSellerRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Password { get; set; }
        public decimal? CommissionPercent { get; set; }
    }
}

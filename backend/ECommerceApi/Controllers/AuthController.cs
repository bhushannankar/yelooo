using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerceApi.Data;
using ECommerceApi.Models;
using System.Threading.Tasks;
using BCrypt.Net;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Cryptography;
using ECommerceApi.Services;
using Microsoft.AspNetCore.Hosting;

namespace ECommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;
        private readonly IWebHostEnvironment _environment;
        private readonly IReferralCodeService _referralCodeService;

        public AuthController(ApplicationDbContext context, IConfiguration configuration, IEmailService emailService, IWebHostEnvironment environment, IReferralCodeService referralCodeService)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
            _environment = environment;
            _referralCodeService = referralCodeService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            // Use Yelooo default referral code when none provided
            var referralCodeToUse = !string.IsNullOrWhiteSpace(request.ReferralCode)
                ? request.ReferralCode.Trim()
                : (_configuration["Yelooo:DefaultReferralCode"] ?? "YA000001");

            // Validate the referral code
            var referrer = await _context.Users
                .FirstOrDefaultAsync(u => u.ReferralCode == referralCodeToUse);

            if (referrer == null)
            {
                return BadRequest("Invalid referral code. Please use a valid referral link.");
            }

            // Check if referrer has reached max level
            var referrerLevel = referrer.ReferralLevel ?? 1;
            if (referrerLevel >= 8)
            {
                return BadRequest("This referral link has reached maximum depth (8 levels). Registration not allowed.");
            }

            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
            {
                return BadRequest("Username already exists.");
            }

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = passwordHash,
                CreatedAt = DateTime.Now,
                RoleId = (await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Customer"))?.RoleId ?? 3,
                ReferredByUserId = referrer.UserId,
                ReferralLevel = referrerLevel + 1,
                JoinedViaReferral = true,
                ReferralCode = await _referralCodeService.GetNextReferralCodeAsync()
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Add to referral tree
            await AddToReferralTree(user.UserId, referrer.UserId);

            // Update any pending invitations for this email
            var pendingInvitation = await _context.ReferralInvitations
                .FirstOrDefaultAsync(i => i.InviteeEmail == request.Email && i.Status == "Pending");
            
            if (pendingInvitation != null)
            {
                pendingInvitation.Status = "Accepted";
                pendingInvitation.AcceptedAt = DateTime.Now;
                pendingInvitation.AcceptedByUserId = user.UserId;
                await _context.SaveChangesAsync();
            }

            await _emailService.SendWelcomeEmailAsync(user.Email, user.Username, user.ReferralCode ?? "", "Customer");

            return StatusCode(201, new { 
                message = "User registered successfully.",
                referredBy = referrer.Username,
                yourLevel = user.ReferralLevel,
                referralCode = user.ReferralCode
            });
        }

        private async Task AddToReferralTree(int newUserId, int referredByUserId)
        {
            var referrer = await _context.Users.FindAsync(referredByUserId);
            if (referrer == null) return;

            var newUser = await _context.Users.FindAsync(newUserId);
            if (newUser == null) return;

            var newUserLevel = newUser.ReferralLevel ?? 2;

            // Determine leg root
            int legRootUserId;
            if (newUserLevel == 2)
            {
                legRootUserId = newUserId;
            }
            else
            {
                // Find the leg root from existing tree
                var existingLegRoot = await _context.ReferralTrees
                    .Where(rt => rt.DescendantUserId == referredByUserId)
                    .OrderBy(rt => rt.Level)
                    .Select(rt => rt.LegRootUserId)
                    .FirstOrDefaultAsync();

                legRootUserId = existingLegRoot != 0 ? existingLegRoot : referredByUserId;
            }

            // Add direct relationship
            var directRelation = new ReferralTree
            {
                AncestorUserId = referredByUserId,
                DescendantUserId = newUserId,
                Level = 1,
                LegRootUserId = legRootUserId,
                CreatedAt = DateTime.Now
            };
            _context.ReferralTrees.Add(directRelation);

            // Add all ancestor relationships
            var ancestorRelations = await _context.ReferralTrees
                .Where(rt => rt.DescendantUserId == referredByUserId && rt.Level < 7)
                .ToListAsync();

            foreach (var ancestor in ancestorRelations)
            {
                var newRelation = new ReferralTree
                {
                    AncestorUserId = ancestor.AncestorUserId,
                    DescendantUserId = newUserId,
                    Level = ancestor.Level + 1,
                    LegRootUserId = legRootUserId,
                    CreatedAt = DateTime.Now
                };
                _context.ReferralTrees.Add(newRelation);
            }

            await _context.SaveChangesAsync();
        }

        [HttpPost("login")]
        public async Task<ActionResult<string>> Login([FromBody] LoginRequest request)
        {
            // User Id is the referral code: look up by ReferralCode first, then by Username
            var user = await _context.Users.Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.ReferralCode == request.Username)
                ?? await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Username == request.Username);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return Unauthorized("Invalid credentials.");
            }

            var token = GenerateJwtToken(user);
            return Ok(token);
        }

        private string GenerateJwtToken(User user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email)
            };

            if (user.Role != null)
            {
                claims.Add(new Claim(ClaimTypes.Role, user.Role.RoleName));
            }

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddDays(7),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            // Always return success to prevent email enumeration attacks
            if (user == null)
            {
                return Ok(new { 
                    message = "If an account with that email exists, a password reset link has been sent.",
                    resetLink = (string?)null 
                });
            }

            // Generate reset token
            var resetToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
            var resetTokenHash = BCrypt.Net.BCrypt.HashPassword(resetToken);

            // Set token and expiry (1 hour from now)
            user.PasswordResetToken = resetTokenHash;
            user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);

            await _context.SaveChangesAsync();

            // Generate reset link
            var frontendUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:3000";
            var resetLink = $"{frontendUrl}/reset-password?token={Uri.EscapeDataString(resetToken)}&email={Uri.EscapeDataString(user.Email)}";

            // Send email (or log in development)
            await _emailService.SendPasswordResetEmailAsync(user.Email, resetToken, resetLink);

            // In development, return the reset link so user can see it
            // Also return if email is not configured (for easier testing)
            var isDevelopment = _environment.IsDevelopment();
            var emailConfigured = !string.IsNullOrEmpty(_configuration["Email:SmtpServer"]) && 
                                  !string.IsNullOrEmpty(_configuration["Email:Username"]);
            var shouldShowLink = isDevelopment || !emailConfigured;
            
            return Ok(new { 
                message = "If an account with that email exists, a password reset link has been sent.",
                resetLink = shouldShowLink ? resetLink : null,
                note = shouldShowLink ? "Development mode: Reset link is shown below. In production, this will be sent via email." : null
            });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (string.IsNullOrEmpty(request.Token) || string.IsNullOrEmpty(request.Email))
            {
                return BadRequest(new { message = "Token and email are required." });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null)
            {
                return BadRequest(new { message = "Invalid reset token or email." });
            }

            // Check if token exists and is not expired
            if (string.IsNullOrEmpty(user.PasswordResetToken) || user.PasswordResetTokenExpiry == null)
            {
                return BadRequest(new { message = "Invalid or expired reset token." });
            }

            if (user.PasswordResetTokenExpiry < DateTime.UtcNow)
            {
                // Clear expired token
                user.PasswordResetToken = null;
                user.PasswordResetTokenExpiry = null;
                await _context.SaveChangesAsync();
                return BadRequest(new { message = "Reset token has expired. Please request a new one." });
            }

            // Verify token
            if (!BCrypt.Net.BCrypt.Verify(request.Token, user.PasswordResetToken))
            {
                return BadRequest(new { message = "Invalid reset token." });
            }

            // Validate password
            if (string.IsNullOrEmpty(request.NewPassword) || request.NewPassword.Length < 6)
            {
                return BadRequest(new { message = "Password must be at least 6 characters long." });
            }

            // Update password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.PasswordResetToken = null;
            user.PasswordResetTokenExpiry = null;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Password has been reset successfully." });
        }

        [HttpPost("verify-reset-token")]
        public async Task<IActionResult> VerifyResetToken([FromBody] VerifyResetTokenRequest request)
        {
            if (string.IsNullOrEmpty(request.Token) || string.IsNullOrEmpty(request.Email))
            {
                return BadRequest(new { message = "Token and email are required.", isValid = false });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null || string.IsNullOrEmpty(user.PasswordResetToken) || user.PasswordResetTokenExpiry == null)
            {
                return Ok(new { message = "Invalid reset token.", isValid = false });
            }

            if (user.PasswordResetTokenExpiry < DateTime.UtcNow)
            {
                return Ok(new { message = "Reset token has expired.", isValid = false });
            }

            if (!BCrypt.Net.BCrypt.Verify(request.Token, user.PasswordResetToken))
            {
                return Ok(new { message = "Invalid reset token.", isValid = false });
            }

            return Ok(new { message = "Token is valid.", isValid = true });
        }
    }

    public class RegisterRequest
    {
        public required string Username { get; set; }
        public required string Email { get; set; }
        public required string Password { get; set; }
        public string? ReferralCode { get; set; }
    }

    public class LoginRequest
    {
        public required string Username { get; set; }
        public required string Password { get; set; }
    }

    public class ForgotPasswordRequest
    {
        public required string Email { get; set; }
    }

    public class ResetPasswordRequest
    {
        public required string Email { get; set; }
        public required string Token { get; set; }
        public required string NewPassword { get; set; }
    }

    public class VerifyResetTokenRequest
    {
        public required string Email { get; set; }
        public required string Token { get; set; }
    }
}

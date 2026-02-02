using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerceApi.Data;
using ECommerceApi.Models;
using System.Security.Claims;

namespace ECommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UserProfileController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public UserProfileController(ApplicationDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userIdClaim ?? "0");
        }

        // GET: api/UserProfile
        [HttpGet]
        public async Task<ActionResult<object>> GetProfile()
        {
            var userId = GetUserId();
            var user = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.BankDetails)
                .Include(u => u.KycDocuments)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
                return NotFound("User not found");

            var latestKyc = user.KycDocuments?.OrderByDescending(k => k.SubmittedAt).FirstOrDefault();

            return Ok(new
            {
                userId = user.UserId,
                username = user.Username,
                email = user.Email,
                // Name fields
                firstName = user.FirstName,
                middleName = user.MiddleName,
                lastName = user.LastName,
                fullName = user.FullName,
                // Contact fields
                phoneNumber = user.PhoneNumber,
                alternatePhoneNumber = user.AlternatePhoneNumber,
                // Personal fields
                dateOfBirth = user.DateOfBirth,
                gender = user.Gender,
                // Address fields
                address = user.Address,
                addressLine2 = user.AddressLine2,
                landmark = user.Landmark,
                city = user.City,
                state = user.State,
                pinCode = user.PinCode,
                country = user.Country,
                // Other fields
                profileImageUrl = user.ProfileImageUrl,
                kycStatus = user.KycStatus ?? "NotSubmitted",
                kycApprovedAt = user.KycApprovedAt,
                roleName = user.Role?.RoleName,
                createdAt = user.CreatedAt,
                bankDetails = user.BankDetails?.Select(b => new
                {
                    bankDetailId = b.BankDetailId,
                    accountHolderName = b.AccountHolderName,
                    accountNumber = MaskAccountNumber(b.AccountNumber),
                    bankName = b.BankName,
                    branchName = b.BranchName,
                    ifscCode = b.IFSCCode,
                    accountType = b.AccountType,
                    isVerified = b.IsVerified
                }).ToList(),
                kycDocument = latestKyc != null ? new
                {
                    kycDocumentId = latestKyc.KycDocumentId,
                    documentType = latestKyc.DocumentType,
                    documentNumber = MaskDocumentNumber(latestKyc.DocumentNumber),
                    status = latestKyc.Status,
                    rejectionReason = latestKyc.RejectionReason,
                    submittedAt = latestKyc.SubmittedAt,
                    reviewedAt = latestKyc.ReviewedAt
                } : null
            });
        }

        // PUT: api/UserProfile
        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found");

            // Name fields
            user.FirstName = dto.FirstName ?? user.FirstName;
            user.MiddleName = dto.MiddleName ?? user.MiddleName;
            user.LastName = dto.LastName ?? user.LastName;
            user.FullName = dto.FullName ?? user.FullName;
            
            // Contact fields
            user.PhoneNumber = dto.PhoneNumber ?? user.PhoneNumber;
            user.AlternatePhoneNumber = dto.AlternatePhoneNumber ?? user.AlternatePhoneNumber;
            
            // Personal fields
            user.DateOfBirth = dto.DateOfBirth ?? user.DateOfBirth;
            user.Gender = dto.Gender ?? user.Gender;
            
            // Address fields
            user.Address = dto.Address ?? user.Address;
            user.AddressLine2 = dto.AddressLine2 ?? user.AddressLine2;
            user.Landmark = dto.Landmark ?? user.Landmark;
            user.City = dto.City ?? user.City;
            user.State = dto.State ?? user.State;
            user.PinCode = dto.PinCode ?? user.PinCode;
            user.Country = dto.Country ?? user.Country;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Profile updated successfully" });
        }

        // POST: api/UserProfile/upload-image
        [HttpPost("upload-image")]
        public async Task<IActionResult> UploadProfileImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found");

            // Validate file type
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
                return BadRequest("Invalid file type. Allowed: jpg, jpeg, png, gif");

            // Create directory if it doesn't exist
            var uploadsFolder = Path.Combine(_environment.WebRootPath, "images", "profiles");
            Directory.CreateDirectory(uploadsFolder);

            // Generate unique filename
            var fileName = $"profile_{userId}_{DateTime.UtcNow.Ticks}{extension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Update user profile image URL
            user.ProfileImageUrl = $"/images/profiles/{fileName}";
            await _context.SaveChangesAsync();

            return Ok(new { imageUrl = user.ProfileImageUrl });
        }

        // GET: api/UserProfile/bank-details
        [HttpGet("bank-details")]
        public async Task<ActionResult<IEnumerable<object>>> GetBankDetails()
        {
            var userId = GetUserId();
            var bankDetails = await _context.UserBankDetails
                .Where(b => b.UserId == userId)
                .Select(b => new
                {
                    bankDetailId = b.BankDetailId,
                    accountHolderName = b.AccountHolderName,
                    accountNumber = b.AccountNumber,
                    bankName = b.BankName,
                    branchName = b.BranchName,
                    ifscCode = b.IFSCCode,
                    accountType = b.AccountType,
                    isVerified = b.IsVerified,
                    createdAt = b.CreatedAt
                })
                .ToListAsync();

            return Ok(bankDetails);
        }

        // POST: api/UserProfile/bank-details
        [HttpPost("bank-details")]
        public async Task<IActionResult> AddBankDetails([FromBody] BankDetailDto dto)
        {
            var userId = GetUserId();

            // Check if user already has bank details (allow only one for now)
            var existingBank = await _context.UserBankDetails.FirstOrDefaultAsync(b => b.UserId == userId);
            if (existingBank != null)
                return BadRequest("Bank details already exist. Please update instead.");

            var bankDetail = new UserBankDetail
            {
                UserId = userId,
                AccountHolderName = dto.AccountHolderName,
                AccountNumber = dto.AccountNumber,
                BankName = dto.BankName,
                BranchName = dto.BranchName,
                IFSCCode = dto.IFSCCode,
                AccountType = dto.AccountType ?? "Savings"
            };

            _context.UserBankDetails.Add(bankDetail);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Bank details added successfully", bankDetailId = bankDetail.BankDetailId });
        }

        // PUT: api/UserProfile/bank-details/{id}
        [HttpPut("bank-details/{id}")]
        public async Task<IActionResult> UpdateBankDetails(int id, [FromBody] BankDetailDto dto)
        {
            var userId = GetUserId();
            var bankDetail = await _context.UserBankDetails
                .FirstOrDefaultAsync(b => b.BankDetailId == id && b.UserId == userId);

            if (bankDetail == null)
                return NotFound("Bank details not found");

            bankDetail.AccountHolderName = dto.AccountHolderName;
            bankDetail.AccountNumber = dto.AccountNumber;
            bankDetail.BankName = dto.BankName;
            bankDetail.BranchName = dto.BranchName;
            bankDetail.IFSCCode = dto.IFSCCode;
            bankDetail.AccountType = dto.AccountType ?? bankDetail.AccountType;
            bankDetail.UpdatedAt = DateTime.UtcNow;
            bankDetail.IsVerified = false; // Reset verification on update

            await _context.SaveChangesAsync();

            return Ok(new { message = "Bank details updated successfully" });
        }

        // DELETE: api/UserProfile/bank-details/{id}
        [HttpDelete("bank-details/{id}")]
        public async Task<IActionResult> DeleteBankDetails(int id)
        {
            var userId = GetUserId();
            var bankDetail = await _context.UserBankDetails
                .FirstOrDefaultAsync(b => b.BankDetailId == id && b.UserId == userId);

            if (bankDetail == null)
                return NotFound("Bank details not found");

            _context.UserBankDetails.Remove(bankDetail);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Bank details deleted successfully" });
        }

        private static string MaskAccountNumber(string accountNumber)
        {
            if (string.IsNullOrEmpty(accountNumber) || accountNumber.Length < 4)
                return accountNumber;
            return new string('*', accountNumber.Length - 4) + accountNumber[^4..];
        }

        private static string MaskDocumentNumber(string documentNumber)
        {
            if (string.IsNullOrEmpty(documentNumber) || documentNumber.Length < 4)
                return documentNumber;
            return new string('*', documentNumber.Length - 4) + documentNumber[^4..];
        }
    }

    public class UpdateProfileDto
    {
        // Name fields
        public string? FirstName { get; set; }
        public string? MiddleName { get; set; }
        public string? LastName { get; set; }
        public string? FullName { get; set; }
        
        // Contact fields
        public string? PhoneNumber { get; set; }
        public string? AlternatePhoneNumber { get; set; }
        
        // Personal fields
        public DateTime? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        
        // Address fields
        public string? Address { get; set; }
        public string? AddressLine2 { get; set; }
        public string? Landmark { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PinCode { get; set; }
        public string? Country { get; set; }
    }

    public class BankDetailDto
    {
        public required string AccountHolderName { get; set; }
        public required string AccountNumber { get; set; }
        public required string BankName { get; set; }
        public required string BranchName { get; set; }
        public required string IFSCCode { get; set; }
        public string? AccountType { get; set; }
    }
}

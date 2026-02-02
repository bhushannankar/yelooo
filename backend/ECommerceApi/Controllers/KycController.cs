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
    public class KycController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public KycController(ApplicationDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userIdClaim ?? "0");
        }

        private async Task<bool> IsAdmin()
        {
            var userId = GetUserId();
            var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == userId);
            return user?.Role?.RoleName == "Admin";
        }

        // GET: api/Kyc/my-documents
        [HttpGet("my-documents")]
        public async Task<ActionResult<IEnumerable<object>>> GetMyKycDocuments()
        {
            var userId = GetUserId();
            var documents = await _context.KycDocuments
                .Where(k => k.UserId == userId)
                .OrderByDescending(k => k.SubmittedAt)
                .Select(k => new
                {
                    kycDocumentId = k.KycDocumentId,
                    documentType = k.DocumentType,
                    documentNumber = MaskDocumentNumber(k.DocumentNumber),
                    documentFrontUrl = k.DocumentFrontUrl,
                    documentBackUrl = k.DocumentBackUrl,
                    status = k.Status,
                    rejectionReason = k.RejectionReason,
                    submittedAt = k.SubmittedAt,
                    reviewedAt = k.ReviewedAt
                })
                .ToListAsync();

            return Ok(documents);
        }

        // POST: api/Kyc/submit
        [HttpPost("submit")]
        public async Task<IActionResult> SubmitKycDocument([FromForm] KycSubmitDto dto)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found");

            // Check if there's already a pending KYC
            var existingPending = await _context.KycDocuments
                .AnyAsync(k => k.UserId == userId && k.Status == "Pending");
            
            if (existingPending)
                return BadRequest("You already have a pending KYC verification. Please wait for approval.");

            // Validate files
            if (dto.DocumentFront == null || dto.DocumentFront.Length == 0)
                return BadRequest("Document front image is required");

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".pdf" };
            
            // Validate front image
            var frontExtension = Path.GetExtension(dto.DocumentFront.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(frontExtension))
                return BadRequest("Invalid file type for front document. Allowed: jpg, jpeg, png, pdf");

            // Create KYC uploads folder
            var uploadsFolder = Path.Combine(_environment.WebRootPath, "images", "kyc", userId.ToString());
            Directory.CreateDirectory(uploadsFolder);

            // Save front document
            var frontFileName = $"front_{dto.DocumentType}_{DateTime.UtcNow.Ticks}{frontExtension}";
            var frontFilePath = Path.Combine(uploadsFolder, frontFileName);
            using (var stream = new FileStream(frontFilePath, FileMode.Create))
            {
                await dto.DocumentFront.CopyToAsync(stream);
            }
            var frontUrl = $"/images/kyc/{userId}/{frontFileName}";

            // Save back document if provided
            string? backUrl = null;
            if (dto.DocumentBack != null && dto.DocumentBack.Length > 0)
            {
                var backExtension = Path.GetExtension(dto.DocumentBack.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(backExtension))
                    return BadRequest("Invalid file type for back document. Allowed: jpg, jpeg, png, pdf");

                var backFileName = $"back_{dto.DocumentType}_{DateTime.UtcNow.Ticks}{backExtension}";
                var backFilePath = Path.Combine(uploadsFolder, backFileName);
                using (var stream = new FileStream(backFilePath, FileMode.Create))
                {
                    await dto.DocumentBack.CopyToAsync(stream);
                }
                backUrl = $"/images/kyc/{userId}/{backFileName}";
            }

            // Create KYC document record
            var kycDocument = new KycDocument
            {
                UserId = userId,
                DocumentType = dto.DocumentType,
                DocumentNumber = dto.DocumentNumber,
                DocumentFrontUrl = frontUrl,
                DocumentBackUrl = backUrl,
                Status = "Pending"
            };

            _context.KycDocuments.Add(kycDocument);

            // Update user KYC status
            user.KycStatus = "Pending";

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "KYC document submitted successfully",
                kycDocumentId = kycDocument.KycDocumentId,
                status = "Pending"
            });
        }

        // GET: api/Kyc/pending (Admin only)
        [HttpGet("pending")]
        public async Task<ActionResult<IEnumerable<object>>> GetPendingKyc()
        {
            if (!await IsAdmin())
                return Forbid();

            var pendingKyc = await _context.KycDocuments
                .Include(k => k.User)
                .Where(k => k.Status == "Pending")
                .OrderBy(k => k.SubmittedAt)
                .Select(k => new
                {
                    kycDocumentId = k.KycDocumentId,
                    userId = k.UserId,
                    username = k.User!.Username,
                    email = k.User.Email,
                    fullName = k.User.FullName,
                    documentType = k.DocumentType,
                    documentNumber = k.DocumentNumber,
                    documentFrontUrl = k.DocumentFrontUrl,
                    documentBackUrl = k.DocumentBackUrl,
                    status = k.Status,
                    submittedAt = k.SubmittedAt
                })
                .ToListAsync();

            return Ok(pendingKyc);
        }

        // GET: api/Kyc/all (Admin only)
        [HttpGet("all")]
        public async Task<ActionResult<IEnumerable<object>>> GetAllKyc([FromQuery] string? status = null)
        {
            if (!await IsAdmin())
                return Forbid();

            var query = _context.KycDocuments
                .Include(k => k.User)
                .Include(k => k.ReviewedByUser)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(k => k.Status == status);
            }

            var kycDocuments = await query
                .OrderByDescending(k => k.SubmittedAt)
                .Select(k => new
                {
                    kycDocumentId = k.KycDocumentId,
                    userId = k.UserId,
                    username = k.User!.Username,
                    email = k.User.Email,
                    fullName = k.User.FullName,
                    documentType = k.DocumentType,
                    documentNumber = k.DocumentNumber,
                    documentFrontUrl = k.DocumentFrontUrl,
                    documentBackUrl = k.DocumentBackUrl,
                    status = k.Status,
                    rejectionReason = k.RejectionReason,
                    submittedAt = k.SubmittedAt,
                    reviewedAt = k.ReviewedAt,
                    reviewedBy = k.ReviewedByUser != null ? k.ReviewedByUser.Username : null
                })
                .ToListAsync();

            return Ok(kycDocuments);
        }

        // GET: api/Kyc/{id} (Admin only - full details)
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetKycDetail(int id)
        {
            if (!await IsAdmin())
                return Forbid();

            var kyc = await _context.KycDocuments
                .Include(k => k.User)
                    .ThenInclude(u => u!.BankDetails)
                .Include(k => k.ReviewedByUser)
                .FirstOrDefaultAsync(k => k.KycDocumentId == id);

            if (kyc == null)
                return NotFound("KYC document not found");

            return Ok(new
            {
                kycDocumentId = kyc.KycDocumentId,
                userId = kyc.UserId,
                user = new
                {
                    username = kyc.User!.Username,
                    email = kyc.User.Email,
                    fullName = kyc.User.FullName,
                    phoneNumber = kyc.User.PhoneNumber,
                    address = kyc.User.Address,
                    city = kyc.User.City,
                    state = kyc.User.State,
                    pinCode = kyc.User.PinCode,
                    kycStatus = kyc.User.KycStatus ?? "NotSubmitted",
                    bankDetails = kyc.User.BankDetails?.Select(b => new
                    {
                        accountHolderName = b.AccountHolderName,
                        accountNumber = b.AccountNumber,
                        bankName = b.BankName,
                        branchName = b.BranchName,
                        ifscCode = b.IFSCCode,
                        accountType = b.AccountType
                    }).ToList()
                },
                documentType = kyc.DocumentType,
                documentNumber = kyc.DocumentNumber,
                documentFrontUrl = kyc.DocumentFrontUrl,
                documentBackUrl = kyc.DocumentBackUrl,
                status = kyc.Status,
                rejectionReason = kyc.RejectionReason,
                submittedAt = kyc.SubmittedAt,
                reviewedAt = kyc.ReviewedAt,
                reviewedBy = kyc.ReviewedByUser?.Username
            });
        }

        // POST: api/Kyc/{id}/approve (Admin only)
        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApproveKyc(int id)
        {
            if (!await IsAdmin())
                return Forbid();

            var adminUserId = GetUserId();
            var kyc = await _context.KycDocuments
                .Include(k => k.User)
                .FirstOrDefaultAsync(k => k.KycDocumentId == id);

            if (kyc == null)
                return NotFound("KYC document not found");

            if (kyc.Status != "Pending")
                return BadRequest($"KYC is already {kyc.Status.ToLower()}");

            var oldStatus = kyc.Status;
            kyc.Status = "Approved";
            kyc.ReviewedAt = DateTime.UtcNow;
            kyc.ReviewedByUserId = adminUserId;
            kyc.UpdatedAt = DateTime.UtcNow;

            // Update user KYC status
            if (kyc.User != null)
            {
                kyc.User.KycStatus = "Approved";
                kyc.User.KycApprovedAt = DateTime.UtcNow;
            }

            // Add history record
            var history = new KycStatusHistory
            {
                KycDocumentId = id,
                OldStatus = oldStatus,
                NewStatus = "Approved",
                ChangedByUserId = adminUserId,
                ChangeReason = "KYC verified and approved"
            };
            _context.KycStatusHistory.Add(history);

            await _context.SaveChangesAsync();

            return Ok(new { message = "KYC approved successfully" });
        }

        // POST: api/Kyc/{id}/reject (Admin only)
        [HttpPost("{id}/reject")]
        public async Task<IActionResult> RejectKyc(int id, [FromBody] KycRejectDto dto)
        {
            if (!await IsAdmin())
                return Forbid();

            if (string.IsNullOrWhiteSpace(dto.RejectionReason))
                return BadRequest("Rejection reason is required");

            var adminUserId = GetUserId();
            var kyc = await _context.KycDocuments
                .Include(k => k.User)
                .FirstOrDefaultAsync(k => k.KycDocumentId == id);

            if (kyc == null)
                return NotFound("KYC document not found");

            if (kyc.Status != "Pending")
                return BadRequest($"KYC is already {kyc.Status.ToLower()}");

            var oldStatus = kyc.Status;
            kyc.Status = "Rejected";
            kyc.RejectionReason = dto.RejectionReason;
            kyc.ReviewedAt = DateTime.UtcNow;
            kyc.ReviewedByUserId = adminUserId;
            kyc.UpdatedAt = DateTime.UtcNow;

            // Update user KYC status
            if (kyc.User != null)
            {
                kyc.User.KycStatus = "Rejected";
            }

            // Add history record
            var history = new KycStatusHistory
            {
                KycDocumentId = id,
                OldStatus = oldStatus,
                NewStatus = "Rejected",
                ChangedByUserId = adminUserId,
                ChangeReason = dto.RejectionReason
            };
            _context.KycStatusHistory.Add(history);

            await _context.SaveChangesAsync();

            return Ok(new { message = "KYC rejected" });
        }

        // GET: api/Kyc/stats (Admin only)
        [HttpGet("stats")]
        public async Task<ActionResult<object>> GetKycStats()
        {
            if (!await IsAdmin())
                return Forbid();

            var stats = await _context.KycDocuments
                .GroupBy(k => k.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            var pending = stats.FirstOrDefault(s => s.Status == "Pending")?.Count ?? 0;
            var approved = stats.FirstOrDefault(s => s.Status == "Approved")?.Count ?? 0;
            var rejected = stats.FirstOrDefault(s => s.Status == "Rejected")?.Count ?? 0;

            return Ok(new
            {
                pending,
                approved,
                rejected,
                total = pending + approved + rejected
            });
        }

        private static string MaskDocumentNumber(string documentNumber)
        {
            if (string.IsNullOrEmpty(documentNumber) || documentNumber.Length < 4)
                return documentNumber;
            return new string('*', documentNumber.Length - 4) + documentNumber[^4..];
        }
    }

    public class KycSubmitDto
    {
        public required string DocumentType { get; set; }
        public required string DocumentNumber { get; set; }
        public required IFormFile DocumentFront { get; set; }
        public IFormFile? DocumentBack { get; set; }
    }

    public class KycRejectDto
    {
        public required string RejectionReason { get; set; }
    }
}

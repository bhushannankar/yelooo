using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using ECommerceApi.Data;
using ECommerceApi.Models;
using System.Security.Claims;

namespace ECommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReferralController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ECommerceApi.Services.IReferralCodeService _referralCodeService;
        private const int MAX_REFERRAL_LEVEL = 8;

        public ReferralController(ApplicationDbContext context, IConfiguration configuration, ECommerceApi.Services.IReferralCodeService referralCodeService)
        {
            _context = context;
            _configuration = configuration;
            _referralCodeService = referralCodeService;
        }

        // Get current user's referral code and link
        [HttpGet("my-referral-code")]
        [Authorize]
        public async Task<ActionResult> GetMyReferralCode()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("User not found");

            // Generate referral code if not exists
            if (string.IsNullOrEmpty(user.ReferralCode))
            {
                user.ReferralCode = await _referralCodeService.GetNextReferralCodeAsync();
                await _context.SaveChangesAsync();
            }

            var baseUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";
            var referralLink = $"{baseUrl}/register?ref={user.ReferralCode}";

            return Ok(new
            {
                referralCode = user.ReferralCode,
                referralLink = referralLink,
                referralLevel = user.ReferralLevel ?? 1
            });
        }

        // Validate referral code and get referrer info
        [HttpGet("validate/{referralCode}")]
        public async Task<ActionResult> ValidateReferralCode(string referralCode)
        {
            var referrer = await _context.Users
                .Where(u => u.ReferralCode == referralCode)
                .Select(u => new
                {
                    u.UserId,
                    u.Username,
                    u.ReferralLevel
                })
                .FirstOrDefaultAsync();

            if (referrer == null)
            {
                return NotFound(new { valid = false, message = "Invalid referral code" });
            }

            // Check if referrer's level allows more referrals (max 8 levels)
            var referrerLevel = referrer.ReferralLevel ?? 1;
            if (referrerLevel >= MAX_REFERRAL_LEVEL)
            {
                return BadRequest(new { 
                    valid = false, 
                    message = "This referral link has reached maximum depth. New registrations cannot be added." 
                });
            }

            return Ok(new
            {
                valid = true,
                referrerId = referrer.UserId,
                referrerName = referrer.Username,
                yourLevel = referrerLevel + 1
            });
        }

        // Get my referral network (downline)
        [HttpGet("my-network")]
        [Authorize]
        public async Task<ActionResult> GetMyNetwork()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var user = await _context.Users
                .Where(u => u.UserId == userId)
                .Select(u => new
                {
                    u.UserId,
                    u.Username,
                    u.ReferralCode,
                    u.ReferralLevel,
                    u.JoinedViaReferral,
                    u.ReferredByUserId
                })
                .FirstOrDefaultAsync();

            if (user == null) return NotFound("User not found");

            // Get direct referrals (legs)
            var directReferrals = await _context.Users
                .Where(u => u.ReferredByUserId == userId)
                .Select(u => new
                {
                    u.UserId,
                    u.Username,
                    u.Email,
                    u.ReferralLevel,
                    u.CreatedAt,
                    DownlineCount = _context.ReferralTrees.Count(rt => rt.AncestorUserId == u.UserId)
                })
                .ToListAsync();

            // Get complete downline from ReferralTree
            var downline = await _context.ReferralTrees
                .Where(rt => rt.AncestorUserId == userId)
                .Include(rt => rt.DescendantUser)
                .OrderBy(rt => rt.Level)
                .ThenBy(rt => rt.LegRootUserId)
                .Select(rt => new
                {
                    rt.DescendantUserId,
                    rt.Level,
                    rt.LegRootUserId,
                    Username = rt.DescendantUser!.Username,
                    Email = rt.DescendantUser.Email,
                    ReferralLevel = rt.DescendantUser.ReferralLevel,
                    JoinedAt = rt.DescendantUser.CreatedAt
                })
                .ToListAsync();

            // Get referrer info if user was referred
            object? referrerInfo = null;
            if (user.ReferredByUserId != null)
            {
                referrerInfo = await _context.Users
                    .Where(u => u.UserId == user.ReferredByUserId)
                    .Select(u => new
                    {
                        u.UserId,
                        u.Username,
                        u.ReferralLevel
                    })
                    .FirstOrDefaultAsync();
            }

            // Calculate level-wise counts
            var levelCounts = downline
                .GroupBy(d => d.Level)
                .Select(g => new { Level = g.Key, Count = g.Count() })
                .OrderBy(x => x.Level)
                .ToList();

            return Ok(new
            {
                user = user,
                referrer = referrerInfo,
                directReferrals = directReferrals,
                directReferralsCount = directReferrals.Count,
                totalDownlineCount = downline.Count,
                levelCounts = levelCounts,
                downline = downline
            });
        }

        // Get detailed leg structure
        [HttpGet("my-legs")]
        [Authorize]
        public async Task<ActionResult> GetMyLegs()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            // Get all direct referrals (leg roots)
            var legs = await _context.Users
                .Where(u => u.ReferredByUserId == userId)
                .Select(legRoot => new
                {
                    LegRootId = legRoot.UserId,
                    LegRootName = legRoot.Username,
                    LegRootEmail = legRoot.Email,
                    LegRootJoinedAt = legRoot.CreatedAt,
                    Members = _context.ReferralTrees
                        .Where(rt => rt.AncestorUserId == userId && rt.LegRootUserId == legRoot.UserId)
                        .OrderBy(rt => rt.Level)
                        .Select(rt => new
                        {
                            rt.DescendantUserId,
                            rt.Level,
                            Username = rt.DescendantUser!.Username,
                            Email = rt.DescendantUser.Email,
                            JoinedAt = rt.DescendantUser.CreatedAt
                        })
                        .ToList()
                })
                .ToListAsync();

            // Add leg statistics
            var legsWithStats = legs.Select(leg => new
            {
                leg.LegRootId,
                leg.LegRootName,
                leg.LegRootEmail,
                leg.LegRootJoinedAt,
                TotalMembers = leg.Members.Count,
                MaxLevel = leg.Members.Any() ? leg.Members.Max(m => m.Level) : 0,
                LevelBreakdown = leg.Members
                    .GroupBy(m => m.Level)
                    .Select(g => new { Level = g.Key, Count = g.Count() })
                    .OrderBy(x => x.Level)
                    .ToList(),
                Members = leg.Members
            });

            return Ok(new
            {
                totalLegs = legs.Count,
                legs = legsWithStats
            });
        }

        // Send referral invitation via email
        [HttpPost("send-invitation")]
        [Authorize]
        public async Task<ActionResult> SendInvitation([FromBody] SendInvitationDto dto)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("User not found");

            // Check if user's level allows referrals
            var userLevel = user.ReferralLevel ?? 1;
            if (userLevel >= MAX_REFERRAL_LEVEL)
            {
                return BadRequest("You have reached the maximum referral depth. Cannot send more invitations.");
            }

            // Check if email is already registered
            var existingUser = await _context.Users.AnyAsync(u => u.Email == dto.Email);
            if (existingUser)
            {
                return BadRequest("This email is already registered.");
            }

            // Check for existing pending invitation
            var existingInvitation = await _context.ReferralInvitations
                .Where(i => i.InviteeEmail == dto.Email && i.InvitedByUserId == userId && i.Status == "Pending")
                .FirstOrDefaultAsync();

            if (existingInvitation != null)
            {
                return BadRequest("An invitation has already been sent to this email.");
            }

            // Ensure user has referral code
            if (string.IsNullOrEmpty(user.ReferralCode))
            {
                user.ReferralCode = await _referralCodeService.GetNextReferralCodeAsync();
            }

            // Create invitation
            var invitation = new ReferralInvitation
            {
                InvitedByUserId = userId.Value,
                InviteeEmail = dto.Email,
                InvitationCode = Guid.NewGuid().ToString("N")[..16].ToUpper(),
                Status = "Pending",
                SentAt = DateTime.Now,
                ExpiresAt = DateTime.Now.AddDays(7) // Expires in 7 days
            };

            _context.ReferralInvitations.Add(invitation);
            await _context.SaveChangesAsync();

            var baseUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";
            var referralLink = $"{baseUrl}/register?ref={user.ReferralCode}";

            // In a real application, you would send an email here
            // For now, we'll just return the link

            return Ok(new
            {
                message = "Invitation created successfully",
                invitationId = invitation.InvitationId,
                referralLink = referralLink,
                expiresAt = invitation.ExpiresAt
            });
        }

        // Get sent invitations
        [HttpGet("my-invitations")]
        [Authorize]
        public async Task<ActionResult> GetMyInvitations()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var invitations = await _context.ReferralInvitations
                .Where(i => i.InvitedByUserId == userId)
                .OrderByDescending(i => i.SentAt)
                .Select(i => new
                {
                    i.InvitationId,
                    i.InviteeEmail,
                    i.Status,
                    i.SentAt,
                    i.ExpiresAt,
                    i.AcceptedAt,
                    AcceptedByUsername = i.AcceptedByUser != null ? i.AcceptedByUser.Username : null
                })
                .ToListAsync();

            // Update expired invitations
            var now = DateTime.Now;
            var expiredIds = invitations
                .Where(i => i.Status == "Pending" && i.ExpiresAt < now)
                .Select(i => i.InvitationId)
                .ToList();

            if (expiredIds.Any())
            {
                await _context.ReferralInvitations
                    .Where(i => expiredIds.Contains(i.InvitationId))
                    .ExecuteUpdateAsync(s => s.SetProperty(i => i.Status, "Expired"));
            }

            return Ok(invitations);
        }

        // Get upline (ancestors)
        [HttpGet("my-upline")]
        [Authorize]
        public async Task<ActionResult> GetMyUpline()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var upline = new List<object>();
            var currentUserId = userId;

            while (currentUserId != null)
            {
                var user = await _context.Users
                    .Where(u => u.UserId == currentUserId)
                    .Select(u => new
                    {
                        u.UserId,
                        u.Username,
                        u.ReferralLevel,
                        u.ReferredByUserId,
                        u.CreatedAt
                    })
                    .FirstOrDefaultAsync();

                if (user == null) break;

                if (user.UserId != userId) // Don't include self
                {
                    upline.Add(user);
                }

                currentUserId = user.ReferredByUserId;
            }

            return Ok(new
            {
                uplineCount = upline.Count,
                upline = upline
            });
        }

        // Helper methods
        private int? GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return null;
            }
            return userId;
        }

        // Helper method to add user to referral tree (called after registration)
        [NonAction]
        public async Task AddToReferralTree(int newUserId, int referredByUserId)
        {
            var referrer = await _context.Users.FindAsync(referredByUserId);
            if (referrer == null) return;

            var newUser = await _context.Users.FindAsync(newUserId);
            if (newUser == null) return;

            var referrerLevel = referrer.ReferralLevel ?? 1;
            var newUserLevel = referrerLevel + 1;

            if (newUserLevel > MAX_REFERRAL_LEVEL) return;

            // Update new user's level
            newUser.ReferralLevel = newUserLevel;
            newUser.JoinedViaReferral = true;
            newUser.ReferredByUserId = referredByUserId;

            // Generate referral code for new user
            newUser.ReferralCode = await _referralCodeService.GetNextReferralCodeAsync();

            // Determine leg root
            int legRootUserId;
            if (newUserLevel == 2)
            {
                legRootUserId = newUserId;
            }
            else
            {
                // Find the ancestor at level 2 (direct referral of level 1)
                var legRoot = await _context.ReferralTrees
                    .Where(rt => rt.DescendantUserId == referredByUserId)
                    .OrderBy(rt => rt.Level)
                    .Select(rt => rt.LegRootUserId)
                    .FirstOrDefaultAsync();

                legRootUserId = legRoot != 0 ? legRoot : referredByUserId;
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
                .Where(rt => rt.DescendantUserId == referredByUserId && rt.Level < MAX_REFERRAL_LEVEL - 1)
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
    }

    public class SendInvitationDto
    {
        public required string Email { get; set; }
    }
}

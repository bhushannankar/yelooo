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
    public class OfflineTransactionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OfflineTransactionController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var id) ? id : 0;
        }

        private string? GetUserRole() => User.FindFirst(ClaimTypes.Role)?.Value;

        /// <summary>
        /// Get list of sellers (for Customer dropdown when submitting offline purchase)
        /// </summary>
        [HttpGet("sellers")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult> GetSellersList()
        {
            var list = await _context.Users
                .Include(u => u.Role)
                .Where(u => u.Role != null && u.Role.RoleName == "Seller")
                .Select(u => new { sellerId = u.UserId, sellerName = u.Username })
                .ToListAsync();
            return Ok(list);
        }

        /// <summary>
        /// Customer: Submit offline purchase (I bought from seller at store)
        /// Requires: SellerId, Amount, ReceiptImageUrl, TransactionDate, optional TransactionReference
        /// </summary>
        [HttpPost("submit-as-customer")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult> SubmitAsCustomer([FromBody] SubmitOfflineAsCustomerDto? dto)
        {
            var customerId = GetUserId();
            if (customerId == 0) return Unauthorized();

            if (dto == null)
                return BadRequest("Request body is invalid. Please provide sellerId, amount, receiptImageUrl, and transactionDate.");

            var seller = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == dto.SellerId);
            if (seller == null || seller.Role?.RoleName != "Seller")
                return BadRequest("Invalid seller. Please provide a valid seller ID.");

            if (dto.Amount <= 0) return BadRequest("Amount must be greater than 0.");
            if (string.IsNullOrWhiteSpace(dto.ReceiptImageUrl)) return BadRequest("Receipt image is required.");

            var transactionDate = dto.TransactionDate;
            if (transactionDate == default)
                return BadRequest("Transaction date is required and must be a valid date (e.g. YYYY-MM-DD).");

            var tx = new OfflineTransaction
            {
                CustomerUserId = customerId,
                SellerId = dto.SellerId,
                Amount = dto.Amount,
                ReceiptImageUrl = dto.ReceiptImageUrl.Trim(),
                TransactionReference = string.IsNullOrWhiteSpace(dto.TransactionReference) ? null : dto.TransactionReference.Trim(),
                TransactionDate = transactionDate.Date,
                Status = "Pending",
                SubmittedBy = "Customer",
                SubmittedByUserId = customerId,
                CreatedAt = DateTime.UtcNow
            };
            _context.OfflineTransactions.Add(tx);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to save offline purchase record. Please try again.", detail = ex.Message });
            }

            return CreatedAtAction(nameof(GetMySubmissions), new { id = tx.OfflineTransactionId }, new
            {
                message = "Offline purchase submitted. Admin will verify and credit points after approval.",
                offlineTransactionId = tx.OfflineTransactionId
            });
        }

        /// <summary>
        /// Seller: Submit offline sale (Customer bought from my store)
        /// Requires: CustomerReferralCode, Amount, ReceiptImageUrl, TransactionDate
        /// </summary>
        [HttpPost("submit-as-seller")]
        [Authorize(Roles = "Seller")]
        public async Task<ActionResult> SubmitAsSeller([FromBody] SubmitOfflineAsSellerDto? dto)
        {
            var sellerId = GetUserId();
            if (sellerId == 0) return Unauthorized();

            if (dto == null)
                return BadRequest("Request body is invalid. Please provide customerReferralCode, amount, receiptImageUrl, and transactionDate.");

            var customer = await _context.Users
                .FirstOrDefaultAsync(u => u.ReferralCode != null && u.ReferralCode.Trim().ToUpper() == (dto.CustomerReferralCode ?? "").Trim().ToUpper());
            if (customer == null)
                return BadRequest("Customer not found. Please ensure the customer's referral code is correct.");

            if (dto.Amount <= 0) return BadRequest("Amount must be greater than 0.");
            if (string.IsNullOrWhiteSpace(dto.ReceiptImageUrl)) return BadRequest("Receipt image is required.");

            var transactionDate = dto.TransactionDate;
            if (transactionDate == default)
                return BadRequest("Transaction date is required and must be a valid date (e.g. YYYY-MM-DD).");

            var tx = new OfflineTransaction
            {
                CustomerUserId = customer.UserId,
                SellerId = sellerId,
                Amount = dto.Amount,
                ReceiptImageUrl = dto.ReceiptImageUrl.Trim(),
                TransactionReference = string.IsNullOrWhiteSpace(dto.TransactionReference) ? null : dto.TransactionReference.Trim(),
                TransactionDate = transactionDate.Date,
                Status = "Pending",
                SubmittedBy = "Seller",
                SubmittedByUserId = sellerId,
                CreatedAt = DateTime.UtcNow
            };
            _context.OfflineTransactions.Add(tx);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to save offline sale record. Please try again.", detail = ex.Message });
            }

            return CreatedAtAction(nameof(GetMySubmissions), new { id = tx.OfflineTransactionId }, new
            {
                message = "Offline sale submitted. Admin will verify and credit points to customer after approval.",
                offlineTransactionId = tx.OfflineTransactionId
            });
        }

        /// <summary>
        /// Get my submissions (Customer: my purchases, Seller: my sales)
        /// </summary>
        [HttpGet("my-submissions")]
        public async Task<ActionResult> GetMySubmissions()
        {
            var userId = GetUserId();
            var role = GetUserRole();
            if (userId == 0) return Unauthorized();

            var query = _context.OfflineTransactions
                .Include(t => t.CustomerUser)
                .Include(t => t.SellerUser)
                .AsQueryable();

            if (role == "Customer")
                query = query.Where(t => t.CustomerUserId == userId);
            else if (role == "Seller")
                query = query.Where(t => t.SellerId == userId);
            else
                return Forbid();

            var list = await query
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new
                {
                    t.OfflineTransactionId,
                    customerName = t.CustomerUser != null ? t.CustomerUser.Username : "",
                    customerReferralCode = t.CustomerUser != null ? t.CustomerUser.ReferralCode : "",
                    sellerName = t.SellerUser != null ? t.SellerUser.Username : "",
                    t.Amount,
                    t.ReceiptImageUrl,
                    t.TransactionReference,
                    t.TransactionDate,
                    t.Status,
                    t.SubmittedBy,
                    t.CreatedAt
                })
                .ToListAsync();

            return Ok(list);
        }

        /// <summary>
        /// Admin: Get all offline transactions with filters (alternate to Reports endpoint)
        /// </summary>
        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> GetAdminList(
            [FromQuery] string? status,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate)
        {
            var query = _context.OfflineTransactions
                .Include(t => t.CustomerUser)
                .Include(t => t.SellerUser)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(t => t.Status == status.Trim());
            if (fromDate.HasValue)
                query = query.Where(t => t.TransactionDate >= fromDate.Value.Date);
            if (toDate.HasValue)
                query = query.Where(t => t.TransactionDate <= toDate.Value.Date);

            var list = await query
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new
                {
                    t.OfflineTransactionId,
                    customerUserId = t.CustomerUserId,
                    customerName = t.CustomerUser != null ? t.CustomerUser.Username : "",
                    customerEmail = t.CustomerUser != null ? t.CustomerUser.Email : "",
                    customerReferralCode = t.CustomerUser != null ? t.CustomerUser.ReferralCode : "",
                    sellerId = t.SellerId,
                    sellerName = t.SellerUser != null ? t.SellerUser.Username : "",
                    t.Amount,
                    t.ReceiptImageUrl,
                    t.TransactionReference,
                    t.TransactionDate,
                    t.Status,
                    t.SubmittedBy,
                    t.CreatedAt,
                    t.ApprovedAt,
                    t.AdminNotes
                })
                .ToListAsync();

            return Ok(list);
        }

        /// <summary>
        /// Admin: Approve or reject offline transaction
        /// </summary>
        [HttpPut("admin/{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> UpdateStatus(int id, [FromBody] UpdateOfflineStatusDto dto)
        {
            var tx = await _context.OfflineTransactions
                .Include(t => t.CustomerUser)
                .FirstOrDefaultAsync(t => t.OfflineTransactionId == id);
            if (tx == null) return NotFound();

            if (tx.Status != "Pending")
                return BadRequest($"Transaction is already {tx.Status}.");

            var adminId = GetUserId();

            tx.Status = dto.Status;
            tx.AdminNotes = dto.Notes;
            if (dto.Status == "Approved")
            {
                tx.ApprovedAt = DateTime.UtcNow;
                tx.ApprovedByUserId = adminId;
                await DistributeOfflinePoints(tx);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Transaction {dto.Status.ToLower()}." });
        }

        [NonAction]
        private async Task DistributeOfflinePoints(OfflineTransaction tx)
        {
            try
            {
                var seller = await _context.Users.FindAsync(tx.SellerId);
                if (seller == null || !seller.CommissionPercent.HasValue || seller.CommissionPercent <= 0)
                    return;

                var customerId = tx.CustomerUserId;
                var orderAmount = tx.Amount;
                var commissionPool = Math.Round(orderAmount * (seller.CommissionPercent.Value / 100m), 2);
                var totalPV = Math.Round(commissionPool * 0.90m, 2);   // 90% to 8 levels (for record)
                var adminShare = Math.Round(commissionPool * 0.10m, 2); // 10% to Yelooo admin

                // Record Yelooo admin commission (10% of commission pool)
                _context.SellerCommissions.Add(new SellerCommission
                {
                    OfflineTransactionId = tx.OfflineTransactionId,
                    SellerId = tx.SellerId,
                    TransactionAmount = orderAmount,
                    CommissionPercent = seller.CommissionPercent.Value,
                    CommissionAmount = adminShare,
                    CreatedAt = DateTime.UtcNow
                });

                var levelConfigs = await _context.PVLevelConfigs
                    .Where(c => c.IsActive)
                    .OrderBy(c => c.LevelId)
                    .ToListAsync();
                if (!levelConfigs.Any()) { await _context.SaveChangesAsync(); return; }

                var uplineChain = new List<(int UserId, int Level)>();
                uplineChain.Add((customerId, 1));
                int currentUserId = customerId;
                for (int level = 2; level <= 8; level++)
                {
                    var referrerId = await _context.Users
                        .Where(u => u.UserId == currentUserId)
                        .Select(u => u.ReferredByUserId)
                        .FirstOrDefaultAsync();
                    if (referrerId == null) break;
                    uplineChain.Add((referrerId.Value, level));
                    currentUserId = referrerId.Value;
                }

                foreach (var (userId, level) in uplineChain)
                {
                    var levelConfig = levelConfigs.FirstOrDefault(c => c.LevelId == level);
                    if (levelConfig == null) continue;

                    // PV percentage applies to entire commission pool, not the 90% slice
                    decimal pointsToCredit = Math.Round(commissionPool * (levelConfig.PVPercentage / 100m), 2);
                    if (pointsToCredit <= 0) continue;

                    var balance = await _context.UserPointsBalances.FirstOrDefaultAsync(b => b.UserId == userId);
                    if (balance == null)
                    {
                        balance = new UserPointsBalance
                        {
                            UserId = userId,
                            TotalPointsEarned = 0,
                            TotalPointsRedeemed = 0,
                            CurrentBalance = 0
                        };
                        _context.UserPointsBalances.Add(balance);
                        await _context.SaveChangesAsync();
                    }

                    balance.TotalPointsEarned += pointsToCredit;
                    balance.CurrentBalance += pointsToCredit;
                    balance.LastUpdatedAt = DateTime.Now;

                    _context.PointsTransactions.Add(new PointsTransaction
                    {
                        UserId = userId,
                        OrderId = null,
                        OfflineTransactionId = tx.OfflineTransactionId,
                        SourceUserId = customerId,
                        TransactionType = level == 1 ? "EARNED_SELF" : "EARNED_REFERRAL",
                        LevelId = level,
                        OrderAmount = orderAmount,
                        TotalPV = totalPV,
                        PointsAmount = pointsToCredit,
                        BalanceAfter = balance.CurrentBalance,
                        Description = level == 1
                            ? "Points earned from offline purchase"
                            : $"Points earned from Level {level - 1} referral offline purchase"
                    });
                }
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error distributing offline points: {ex.Message}");
            }
        }
    }

    public class SubmitOfflineAsCustomerDto
    {
        public int SellerId { get; set; }
        public decimal Amount { get; set; }
        public string ReceiptImageUrl { get; set; } = "";
        public DateTime TransactionDate { get; set; }
        public string? TransactionReference { get; set; }
    }

    public class SubmitOfflineAsSellerDto
    {
        public string CustomerReferralCode { get; set; } = "";
        public decimal Amount { get; set; }
        public string ReceiptImageUrl { get; set; } = "";
        public DateTime TransactionDate { get; set; }
        public string? TransactionReference { get; set; }
    }

    public class UpdateOfflineStatusDto
    {
        public string Status { get; set; } = "Approved"; // Approved, Rejected
        public string? Notes { get; set; }
    }
}

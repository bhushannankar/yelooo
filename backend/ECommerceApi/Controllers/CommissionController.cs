using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerceApi.Data;

namespace ECommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class CommissionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CommissionController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get commission report: total commission received from each seller
        /// </summary>
        [HttpGet("report")]
        public async Task<ActionResult<IEnumerable<object>>> GetCommissionReport()
        {
            var report = await _context.SellerCommissions
                .Include(sc => sc.Seller)
                .GroupBy(sc => new { sc.SellerId, sc.Seller!.Username, sc.Seller.Email })
                .Select(g => new
                {
                    sellerId = g.Key.SellerId,
                    sellerName = g.Key.Username,
                    sellerEmail = g.Key.Email,
                    totalTransactionAmount = g.Sum(sc => sc.TransactionAmount),
                    totalCommissionAmount = g.Sum(sc => sc.CommissionAmount),
                    transactionCount = g.Count()
                })
                .OrderByDescending(r => r.totalCommissionAmount)
                .ToListAsync();

            return Ok(report);
        }

        /// <summary>
        /// Get commission summary (totals)
        /// </summary>
        [HttpGet("summary")]
        public async Task<ActionResult<object>> GetCommissionSummary()
        {
            var totalCommission = await _context.SellerCommissions.SumAsync(sc => sc.CommissionAmount);
            var totalTransaction = await _context.SellerCommissions.SumAsync(sc => sc.TransactionAmount);
            var transactionCount = await _context.SellerCommissions.CountAsync();

            return Ok(new
            {
                totalCommissionAmount = totalCommission,
                totalTransactionAmount = totalTransaction,
                transactionCount
            });
        }

        /// <summary>
        /// Get all commission payments with filters (for CA report)
        /// </summary>
        [HttpGet("payments")]
        public async Task<ActionResult<IEnumerable<object>>> GetCommissionPayments(
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate,
            [FromQuery] string? bankName,
            [FromQuery] string? status)
        {
            var query = _context.SellerCommissionPayments
                .Include(p => p.Seller)
                    .ThenInclude(s => s!.BankDetails)
                .AsQueryable();

            if (fromDate.HasValue)
                query = query.Where(p => p.PaymentDate >= fromDate.Value.Date);
            if (toDate.HasValue)
                query = query.Where(p => p.PaymentDate <= toDate.Value.Date);
            if (!string.IsNullOrWhiteSpace(bankName))
                query = query.Where(p => p.BankName != null && p.BankName.Contains(bankName.Trim()));
            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(p => p.Status == status.Trim());

            var payments = await query
                .OrderByDescending(p => p.PaymentDate)
                .ThenByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    sellerCommissionPaymentId = p.SellerCommissionPaymentId,
                    sellerId = p.SellerId,
                    sellerName = p.Seller != null ? p.Seller.Username : "",
                    sellerEmail = p.Seller != null ? p.Seller.Email : "",
                    sellerBankDetails = p.Seller != null && p.Seller.BankDetails != null && p.Seller.BankDetails.Any()
                        ? p.Seller.BankDetails.Select(b => new
                        {
                            bankName = b.BankName,
                            branchName = b.BranchName,
                            accountNumber = b.AccountNumber,
                            ifscCode = b.IFSCCode,
                            accountHolderName = b.AccountHolderName
                        }).FirstOrDefault()
                        : null,
                    amountPaid = p.AmountPaid,
                    paymentMethod = p.PaymentMethod,
                    chequeNumber = p.ChequeNumber,
                    transactionReference = p.TransactionReference,
                    bankName = p.BankName,
                    paymentDate = p.PaymentDate,
                    status = p.Status,
                    notes = p.Notes,
                    createdAt = p.CreatedAt,
                    confirmedAt = p.ConfirmedAt
                })
                .ToListAsync();

            return Ok(payments);
        }

        /// <summary>
        /// Admin confirms or rejects a payment
        /// </summary>
        [HttpPut("payments/{id}/status")]
        public async Task<IActionResult> UpdatePaymentStatus(int id, [FromBody] UpdatePaymentStatusRequest request)
        {
            var payment = await _context.SellerCommissionPayments.FindAsync(id);
            if (payment == null)
                return NotFound("Payment not found.");

            if (request.Status != "Confirmed" && request.Status != "Rejected")
                return BadRequest("Status must be Confirmed or Rejected.");

            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var userId = int.TryParse(userIdClaim, out var u) ? u : (int?)null;

            payment.Status = request.Status;
            payment.ConfirmedAt = request.Status == "Confirmed" ? DateTime.UtcNow : null;
            payment.ConfirmedByUserId = request.Status == "Confirmed" ? userId : null;

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Payment {request.Status.ToLower()}." });
        }

        /// <summary>
        /// Get commission details for a specific seller
        /// </summary>
        [HttpGet("seller/{sellerId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetSellerCommissionDetails(int sellerId)
        {
            var details = await _context.SellerCommissions
                .Include(sc => sc.Order)
                .Include(sc => sc.OrderItem)
                    .ThenInclude(oi => oi!.Product)
                .Where(sc => sc.SellerId == sellerId)
                .OrderByDescending(sc => sc.CreatedAt)
                .Select(sc => new
                {
                    sellerCommissionId = sc.SellerCommissionId,
                    orderId = sc.OrderId,
                    orderDate = sc.Order != null ? sc.Order.OrderDate : (DateTime?)null,
                    productName = sc.OrderItem != null && sc.OrderItem.Product != null ? sc.OrderItem.Product.ProductName : "",
                    transactionAmount = sc.TransactionAmount,
                    commissionPercent = sc.CommissionPercent,
                    commissionAmount = sc.CommissionAmount,
                    createdAt = sc.CreatedAt
                })
                .ToListAsync();

            return Ok(details);
        }
    }

    public class UpdatePaymentStatusRequest
    {
        public string Status { get; set; } = "Confirmed"; // Confirmed, Rejected
    }
}

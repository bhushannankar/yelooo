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
    [Authorize(Roles = "Seller")]
    public class SellerCommissionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SellerCommissionController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetSellerId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userIdClaim ?? "0");
        }

        /// <summary>
        /// Get seller's commission summary: total due, total paid, balance
        /// </summary>
        [HttpGet("my-summary")]
        public async Task<ActionResult<object>> GetMySummary()
        {
            var sellerId = GetSellerId();

            var totalCommission = await _context.SellerCommissions
                .Where(sc => sc.SellerId == sellerId)
                .SumAsync(sc => sc.CommissionAmount);

            var totalConfirmedByAdmin = await _context.SellerCommissionPayments
                .Where(p => p.SellerId == sellerId && p.Status == "Confirmed")
                .SumAsync(p => p.AmountPaid);

            var totalPaidBySeller = await _context.SellerCommissionPayments
                .Where(p => p.SellerId == sellerId)
                .SumAsync(p => p.AmountPaid);

            var pendingPayments = await _context.SellerCommissionPayments
                .Where(p => p.SellerId == sellerId && p.Status == "Pending")
                .SumAsync(p => p.AmountPaid);

            var rejectedPayments = await _context.SellerCommissionPayments
                .Where(p => p.SellerId == sellerId && p.Status == "Rejected")
                .SumAsync(p => p.AmountPaid);

            return Ok(new
            {
                totalCommissionDue = totalCommission,
                totalPaidBySeller = totalPaidBySeller,
                totalConfirmedByAdmin = totalConfirmedByAdmin,
                pendingPaymentAmount = pendingPayments,
                rejectedPaymentAmount = rejectedPayments,
                totalPaid = totalConfirmedByAdmin,
                balanceDue = totalCommission - totalConfirmedByAdmin
            });
        }

        /// <summary>
        /// Get seller's commission breakdown and payment history
        /// </summary>
        [HttpGet("my-details")]
        public async Task<ActionResult<object>> GetMyDetails()
        {
            var sellerId = GetSellerId();

            var commissions = await _context.SellerCommissions
                .Include(sc => sc.Order)
                .Include(sc => sc.OrderItem)
                    .ThenInclude(oi => oi!.Product)
                .Where(sc => sc.SellerId == sellerId)
                .OrderByDescending(sc => sc.CreatedAt)
                .Select(sc => new
                {
                    orderId = sc.OrderId,
                    orderDate = sc.Order != null ? sc.Order.OrderDate : (DateTime?)null,
                    productName = sc.OrderItem != null && sc.OrderItem.Product != null ? sc.OrderItem.Product.ProductName : "",
                    transactionAmount = sc.TransactionAmount,
                    commissionPercent = sc.CommissionPercent,
                    commissionAmount = sc.CommissionAmount,
                    createdAt = sc.CreatedAt
                })
                .ToListAsync();

            var payments = await _context.SellerCommissionPayments
                .Where(p => p.SellerId == sellerId)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    sellerCommissionPaymentId = p.SellerCommissionPaymentId,
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

            return Ok(new { commissions, payments });
        }

        /// <summary>
        /// Seller submits payment details (cheque or online)
        /// </summary>
        [HttpPost("submit-payment")]
        public async Task<IActionResult> SubmitPayment([FromBody] SubmitPaymentRequest request)
        {
            var sellerId = GetSellerId();

            if (request.AmountPaid <= 0)
                return BadRequest("Amount must be greater than 0.");

            if (string.IsNullOrWhiteSpace(request.PaymentMethod))
                return BadRequest("Payment method is required.");

            if (request.PaymentMethod != "Cheque" && request.PaymentMethod != "Online")
                return BadRequest("Payment method must be Cheque or Online.");

            var payment = new SellerCommissionPayment
            {
                SellerId = sellerId,
                AmountPaid = request.AmountPaid,
                PaymentMethod = request.PaymentMethod,
                ChequeNumber = request.ChequeNumber,
                TransactionReference = request.TransactionReference,
                BankName = request.BankName,
                PaymentDate = request.PaymentDate,
                Notes = request.Notes,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.SellerCommissionPayments.Add(payment);
            await _context.SaveChangesAsync();

            return StatusCode(201, new { message = "Payment details submitted. Awaiting admin confirmation.", sellerCommissionPaymentId = payment.SellerCommissionPaymentId });
        }
    }

    public class SubmitPaymentRequest
    {
        public decimal AmountPaid { get; set; }
        public string PaymentMethod { get; set; } = "Cheque";
        public string? ChequeNumber { get; set; }
        public string? TransactionReference { get; set; }
        public string? BankName { get; set; }
        public DateTime PaymentDate { get; set; }
        public string? Notes { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    public class SellerCommissionPayment
    {
        [Key]
        public int SellerCommissionPaymentId { get; set; }

        public int SellerId { get; set; }
        [ForeignKey("SellerId")]
        public User? Seller { get; set; }

        [Column(TypeName = "decimal(10, 2)")]
        public decimal AmountPaid { get; set; }

        [Required]
        [StringLength(20)]
        public string PaymentMethod { get; set; } = "Cheque"; // Cheque, Online

        [StringLength(100)]
        public string? ChequeNumber { get; set; }

        [StringLength(200)]
        public string? TransactionReference { get; set; }

        [StringLength(200)]
        public string? BankName { get; set; }

        [Column(TypeName = "date")]
        public DateTime PaymentDate { get; set; }

        [StringLength(20)]
        public string Status { get; set; } = "Pending"; // Pending, Confirmed, Rejected

        [StringLength(500)]
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ConfirmedAt { get; set; }

        public int? ConfirmedByUserId { get; set; }
        [ForeignKey("ConfirmedByUserId")]
        public User? ConfirmedByUser { get; set; }
    }
}

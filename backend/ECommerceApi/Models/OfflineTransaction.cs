using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    /// <summary>
    /// Records offline/in-store purchases where customer bought directly from seller.
    /// User or Seller uploads the bill; admin approves to credit points to customer.
    /// </summary>
    public class OfflineTransaction
    {
        [Key]
        public int OfflineTransactionId { get; set; }

        [ForeignKey("CustomerUser")]
        public int CustomerUserId { get; set; }
        public User? CustomerUser { get; set; }

        [ForeignKey("SellerUser")]
        public int SellerId { get; set; }
        public User? SellerUser { get; set; }

        [Required]
        [Column(TypeName = "decimal(10, 2)")]
        public decimal Amount { get; set; }

        [StringLength(500)]
        public string? ReceiptImageUrl { get; set; }

        [StringLength(200)]
        public string? TransactionReference { get; set; }

        [Column(TypeName = "date")]
        public DateTime TransactionDate { get; set; }

        [StringLength(20)]
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected

        /// <summary>Who submitted: Customer or Seller</summary>
        [StringLength(20)]
        public string SubmittedBy { get; set; } = "Customer";

        [ForeignKey("SubmittedByUser")]
        public int SubmittedByUserId { get; set; }
        public User? SubmittedByUser { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ApprovedAt { get; set; }

        [ForeignKey("ApprovedByUser")]
        public int? ApprovedByUserId { get; set; }
        public User? ApprovedByUser { get; set; }

        [StringLength(500)]
        public string? AdminNotes { get; set; }
    }
}

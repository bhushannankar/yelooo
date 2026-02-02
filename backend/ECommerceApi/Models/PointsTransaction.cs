using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    public class PointsTransaction
    {
        [Key]
        public int TransactionId { get; set; }

        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        public int? OrderId { get; set; }

        [ForeignKey("OrderId")]
        public Order? Order { get; set; }

        public int? SourceUserId { get; set; }

        [ForeignKey("SourceUserId")]
        public User? SourceUser { get; set; }

        [Required]
        [StringLength(50)]
        public required string TransactionType { get; set; }  // EARNED_SELF, EARNED_REFERRAL, REDEEMED, EXPIRED, ADJUSTMENT

        public int? LevelId { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal? OrderAmount { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal? TotalPV { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal PointsAmount { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal BalanceAfter { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}

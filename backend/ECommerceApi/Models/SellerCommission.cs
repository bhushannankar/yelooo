using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    public class SellerCommission
    {
        [Key]
        public int SellerCommissionId { get; set; }

        /// <summary>Online order (null for offline).</summary>
        public int? OrderId { get; set; }
        [ForeignKey("OrderId")]
        public Order? Order { get; set; }

        /// <summary>Online order item (null for offline).</summary>
        public int? OrderItemId { get; set; }
        [ForeignKey("OrderItemId")]
        public OrderItem? OrderItem { get; set; }

        /// <summary>Offline transaction (null for online orders).</summary>
        public int? OfflineTransactionId { get; set; }
        [ForeignKey("OfflineTransactionId")]
        public OfflineTransaction? OfflineTransaction { get; set; }

        public int SellerId { get; set; }
        [ForeignKey("SellerId")]
        public User? Seller { get; set; }

        [Column(TypeName = "decimal(10, 2)")]
        public decimal TransactionAmount { get; set; }

        [Column(TypeName = "decimal(5, 2)")]
        public decimal CommissionPercent { get; set; }

        /// <summary>10% of commission pool (seller % of sale) — Yelooo admin share.</summary>
        [Column(TypeName = "decimal(10, 2)")]
        public decimal CommissionAmount { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}

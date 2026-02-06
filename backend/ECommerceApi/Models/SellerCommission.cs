using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    public class SellerCommission
    {
        [Key]
        public int SellerCommissionId { get; set; }

        public int OrderId { get; set; }
        [ForeignKey("OrderId")]
        public Order? Order { get; set; }

        public int OrderItemId { get; set; }
        [ForeignKey("OrderItemId")]
        public OrderItem? OrderItem { get; set; }

        public int SellerId { get; set; }
        [ForeignKey("SellerId")]
        public User? Seller { get; set; }

        [Column(TypeName = "decimal(10, 2)")]
        public decimal TransactionAmount { get; set; }

        [Column(TypeName = "decimal(5, 2)")]
        public decimal CommissionPercent { get; set; }

        [Column(TypeName = "decimal(10, 2)")]
        public decimal CommissionAmount { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    public class OrderItem
    {
        [Key]
        public int OrderItemId { get; set; }

        [ForeignKey("Order")]
        public int OrderId { get; set; }
        public Order? Order { get; set; }

        [ForeignKey("Product")]
        public int ProductId { get; set; }
        public Product? Product { get; set; }

        [Required]
        public int Quantity { get; set; }

        [Required]
        [Column(TypeName = "decimal(10, 2)")]
        public decimal UnitPrice { get; set; }

        // Delivery tracking fields
        public int? SellerId { get; set; }
        
        [ForeignKey("SellerId")]
        public User? Seller { get; set; }

        [Column(TypeName = "date")]
        public DateTime? ExpectedDeliveryDate { get; set; }

        [Column(TypeName = "date")]
        public DateTime? ActualDeliveryDate { get; set; }

        [StringLength(50)]
        public string DeliveryStatus { get; set; } = "Pending";

        [StringLength(100)]
        public string? TrackingNumber { get; set; }

        [StringLength(500)]
        public string? DeliveryNotes { get; set; }

        public DateTime? LastUpdatedAt { get; set; }
    }
}

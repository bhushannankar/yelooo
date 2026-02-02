using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    public class DeliveryStatusHistory
    {
        [Key]
        public int HistoryId { get; set; }

        public int OrderItemId { get; set; }
        
        [ForeignKey("OrderItemId")]
        public OrderItem? OrderItem { get; set; }

        [StringLength(50)]
        public string? OldStatus { get; set; }

        [Required]
        [StringLength(50)]
        public required string NewStatus { get; set; }

        [Column(TypeName = "date")]
        public DateTime? OldDeliveryDate { get; set; }

        [Column(TypeName = "date")]
        public DateTime? NewDeliveryDate { get; set; }

        public int ChangedByUserId { get; set; }
        
        [ForeignKey("ChangedByUserId")]
        public User? ChangedByUser { get; set; }

        public DateTime ChangedAt { get; set; } = DateTime.Now;

        [StringLength(500)]
        public string? Notes { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    public class Order
    {
        [Key]
        public int OrderId { get; set; }

        [ForeignKey("User")]
        public int UserId { get; set; }
        public User? User { get; set; }

        public DateTime OrderDate { get; set; }

        [Required]
        [Column(TypeName = "decimal(10, 2)")]
        public decimal TotalAmount { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal PointsRedeemed { get; set; } = 0;

        [Column(TypeName = "decimal(18, 2)")]
        public decimal PointsDiscountAmount { get; set; } = 0;

        [Column(TypeName = "decimal(18, 2)")]
        public decimal BenefitDiscountAmount { get; set; } = 0;

        [Required]
        [StringLength(50)]
        public required string Status { get; set; }

        public ICollection<OrderItem>? OrderItems { get; set; }
    }
}

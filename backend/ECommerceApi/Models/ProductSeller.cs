using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    public class ProductSeller
    {
        [Key]
        public int ProductSellerId { get; set; }

        [Required]
        [ForeignKey("Product")]
        public int ProductId { get; set; }
        public Product? Product { get; set; }

        [Required]
        [ForeignKey("Seller")]
        public int SellerId { get; set; }
        public User? Seller { get; set; }

        [Required]
        [Column(TypeName = "decimal(10, 2)")]
        public decimal SellerPrice { get; set; }

        [Required]
        public int DeliveryDays { get; set; } = 5;

        [Required]
        [Column(TypeName = "decimal(10, 2)")]
        public decimal DeliveryCharge { get; set; } = 0;

        [StringLength(500)]
        public string? SellerAddress { get; set; }

        public int StockQuantity { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime UpdatedAt { get; set; } = DateTime.Now;
    }
}

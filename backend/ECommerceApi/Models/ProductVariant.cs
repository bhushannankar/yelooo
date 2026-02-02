using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    public class ProductVariant
    {
        [Key]
        public int VariantId { get; set; }

        [Required]
        [ForeignKey("Product")]
        public int ProductId { get; set; }
        public Product? Product { get; set; }

        [ForeignKey("Color")]
        public int? ColorId { get; set; }
        public Color? Color { get; set; }

        [ForeignKey("Size")]
        public int? SizeId { get; set; }
        public Size? Size { get; set; }

        [StringLength(100)]
        public string? SKU { get; set; }

        [Required]
        [Column(TypeName = "decimal(10, 2)")]
        public decimal Price { get; set; }

        [Column(TypeName = "decimal(10, 2)")]
        public decimal? OriginalPrice { get; set; }

        [Required]
        public int Stock { get; set; }

        [Required]
        public bool IsAvailable { get; set; } = true;
    }
}

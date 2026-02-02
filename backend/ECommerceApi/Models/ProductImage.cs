using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    public class ProductImage
    {
        [Key]
        public int ImageId { get; set; }

        [Required]
        [ForeignKey("Product")]
        public int ProductId { get; set; }
        public Product? Product { get; set; }

        [ForeignKey("ProductVariant")]
        public int? VariantId { get; set; }
        public ProductVariant? ProductVariant { get; set; }

        [Required]
        [StringLength(500)]
        public required string ImageUrl { get; set; }

        [Required]
        public bool IsMain { get; set; }

        [Required]
        public int DisplayOrder { get; set; }
    }
}

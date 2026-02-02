using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    public class ProductSpecification
    {
        [Key]
        public int SpecId { get; set; }

        [Required]
        [ForeignKey("Product")]
        public int ProductId { get; set; }
        public Product? Product { get; set; }

        [Required]
        [StringLength(200)]
        public required string AttributeName { get; set; }

        [Required]
        [StringLength(500)]
        public required string AttributeValue { get; set; }

        [Required]
        public int DisplayOrder { get; set; }
    }
}

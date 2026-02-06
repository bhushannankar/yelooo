using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    public class Product
    {
        [Key]
        public int ProductId { get; set; }

        [Required]
        [StringLength(200)]
        public required string ProductName { get; set; }

        public string? Description { get; set; }

        [Required]
        [Column(TypeName = "decimal(10, 2)")]
        public decimal Price { get; set; }

        /// <summary>Original/MRP price for discount display. When set and greater than Price, discount % is shown.</summary>
        [Column(TypeName = "decimal(10, 2)")]
        public decimal? OriginalPrice { get; set; }

        public string? ImageUrl { get; set; }

        [Required]
        public int Stock { get; set; }

        [StringLength(200)]
        public string? BrandName { get; set; }

        [StringLength(500)]
        public string? ShortDescription { get; set; }

        [ForeignKey("SubCategory")]
        public int SubCategoryId { get; set; }
        public SubCategory? SubCategory { get; set; }

        [ForeignKey("TertiaryCategory")]
        public int? TertiaryCategoryId { get; set; }
        public TertiaryCategory? TertiaryCategory { get; set; }

        [ForeignKey("QuaternaryCategory")]
        public int? QuaternaryCategoryId { get; set; }
        public QuaternaryCategory? QuaternaryCategory { get; set; }

        public ICollection<OrderItem>? OrderItems { get; set; }
        public ICollection<Review>? Reviews { get; set; }
        public ICollection<ProductVariant>? ProductVariants { get; set; }
        public ICollection<ProductImage>? ProductImages { get; set; }
        public ICollection<ProductSpecification>? ProductSpecifications { get; set; }

        /// <summary>Soft delete: when true, product is excluded from listings and detail views.</summary>
        public bool IsDeleted { get; set; }

        /// <summary>When the product was soft-deleted (null if not deleted).</summary>
        public DateTime? DeletedAt { get; set; }
    }
}

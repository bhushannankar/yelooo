using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    public class SubCategory
    {
        [Key]
        public int SubCategoryId { get; set; }

        [Required]
        [StringLength(100)]
        public required string SubCategoryName { get; set; }

        [ForeignKey("Category")]
        public int CategoryId { get; set; }
        public Category? Category { get; set; }

        public ICollection<Product>? Products { get; set; }
        public ICollection<TertiaryCategory>? TertiaryCategories { get; set; }
    }
}

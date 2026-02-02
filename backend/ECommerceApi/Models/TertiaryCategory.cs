using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    public class TertiaryCategory
    {
        [Key]
        public int TertiaryCategoryId { get; set; }

        [Required]
        [StringLength(100)]
        public required string TertiaryCategoryName { get; set; }

        [ForeignKey("SubCategory")]
        public int SubCategoryId { get; set; }
        public SubCategory? SubCategory { get; set; }

        [StringLength(500)]
        public string? ImageUrl { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        public ICollection<QuaternaryCategory>? QuaternaryCategories { get; set; }
    }
}

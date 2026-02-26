using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    /// <summary>
    /// Slide/banner image for a category shown on the home page. Changes with category selection.
    /// </summary>
    public class CategorySlideImage
    {
        [Key]
        public int CategorySlideImageId { get; set; }

        [Required]
        [ForeignKey("Category")]
        public int CategoryId { get; set; }
        public Category? Category { get; set; }

        [Required]
        [StringLength(500)]
        public string ImageUrl { get; set; } = string.Empty;

        public int DisplayOrder { get; set; }

        [StringLength(200)]
        public string? Title { get; set; }

        [StringLength(200)]
        public string? Subtitle { get; set; }

        [StringLength(100)]
        public string? ButtonText { get; set; }

        [StringLength(500)]
        public string? Link { get; set; }
    }
}

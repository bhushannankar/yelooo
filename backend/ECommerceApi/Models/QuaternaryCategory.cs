using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    public class QuaternaryCategory
    {
        [Key]
        public int QuaternaryCategoryId { get; set; }

        [Required]
        [StringLength(100)]
        public required string QuaternaryCategoryName { get; set; }

        [ForeignKey("TertiaryCategory")]
        public int TertiaryCategoryId { get; set; }
        public TertiaryCategory? TertiaryCategory { get; set; }

        [StringLength(500)]
        public string? ImageUrl { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }
    }
}

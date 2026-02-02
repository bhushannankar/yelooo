using System.ComponentModel.DataAnnotations;

namespace ECommerceApi.Models
{
    public class Size
    {
        [Key]
        public int SizeId { get; set; }

        [Required]
        [StringLength(50)]
        public required string SizeName { get; set; }

        [StringLength(50)]
        public string? SizeCategory { get; set; }
    }
}

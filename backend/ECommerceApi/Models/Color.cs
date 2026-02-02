using System.ComponentModel.DataAnnotations;

namespace ECommerceApi.Models
{
    public class Color
    {
        [Key]
        public int ColorId { get; set; }

        [Required]
        [StringLength(100)]
        public required string ColorName { get; set; }

        [StringLength(7)]
        public string? HexCode { get; set; }
    }
}

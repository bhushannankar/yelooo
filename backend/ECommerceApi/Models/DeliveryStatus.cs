using System.ComponentModel.DataAnnotations;

namespace ECommerceApi.Models
{
    public class DeliveryStatus
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public required string Value { get; set; }

        [Required]
        [StringLength(100)]
        public required string Label { get; set; }

        [StringLength(255)]
        public string? Description { get; set; }

        public int DisplayOrder { get; set; } = 0;

        public bool IsActive { get; set; } = true;
    }
}

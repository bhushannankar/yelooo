using System.ComponentModel.DataAnnotations;

namespace ECommerceApi.Models
{
    public class PaymentMethod
    {
        [Key]
        public int PaymentMethodId { get; set; }

        [Required]
        [StringLength(100)]
        public required string MethodName { get; set; }

        public string? Description { get; set; }

        public bool IsActive { get; set; }
    }
}

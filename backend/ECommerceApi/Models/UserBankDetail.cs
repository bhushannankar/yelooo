using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    public class UserBankDetail
    {
        [Key]
        public int BankDetailId { get; set; }

        [ForeignKey("User")]
        public int UserId { get; set; }
        public User? User { get; set; }

        [Required]
        [StringLength(200)]
        public required string AccountHolderName { get; set; }

        [Required]
        [StringLength(50)]
        public required string AccountNumber { get; set; }

        [Required]
        [StringLength(200)]
        public required string BankName { get; set; }

        [Required]
        [StringLength(200)]
        public required string BranchName { get; set; }

        [Required]
        [StringLength(20)]
        public required string IFSCCode { get; set; }

        [StringLength(50)]
        public string AccountType { get; set; } = "Savings";

        public bool IsVerified { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}

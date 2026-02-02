using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    public class User
    {
        [Key]
        public int UserId { get; set; }

        [Required]
        [StringLength(100)]
        public required string Username { get; set; }

        [Required]
        [StringLength(255)]
        public required string Email { get; set; }

        [Required]
        [StringLength(255)]
        public required string PasswordHash { get; set; }

        public DateTime CreatedAt { get; set; }

        public ICollection<Order>? Orders { get; set; }

        [ForeignKey("Role")]
        public int RoleId { get; set; }
        public Role? Role { get; set; }

        // Password Reset Fields
        [StringLength(255)]
        public string? PasswordResetToken { get; set; }

        public DateTime? PasswordResetTokenExpiry { get; set; }

        public ICollection<Review>? Reviews { get; set; }

        // Profile Fields - Name
        [StringLength(100)]
        public string? FirstName { get; set; }

        [StringLength(100)]
        public string? MiddleName { get; set; }

        [StringLength(100)]
        public string? LastName { get; set; }

        [StringLength(200)]
        public string? FullName { get; set; }

        // Profile Fields - Contact
        [StringLength(20)]
        public string? PhoneNumber { get; set; }

        [StringLength(20)]
        public string? AlternatePhoneNumber { get; set; }

        // Profile Fields - Personal
        public DateTime? DateOfBirth { get; set; }

        [StringLength(20)]
        public string? Gender { get; set; } // Male, Female, Other, Prefer not to say

        // Profile Fields - Address
        [StringLength(500)]
        public string? Address { get; set; }

        [StringLength(500)]
        public string? AddressLine2 { get; set; }

        [StringLength(200)]
        public string? Landmark { get; set; }

        [StringLength(100)]
        public string? City { get; set; }

        [StringLength(100)]
        public string? State { get; set; }

        [StringLength(10)]
        public string? PinCode { get; set; }

        [StringLength(100)]
        public string? Country { get; set; } = "India";

        [StringLength(500)]
        public string? ProfileImageUrl { get; set; }

        // KYC Status
        [StringLength(20)]
        public string? KycStatus { get; set; } = "NotSubmitted"; // NotSubmitted, Pending, Approved, Rejected

        public DateTime? KycApprovedAt { get; set; }

        // Navigation properties for KYC and Bank Details
        public ICollection<UserBankDetail>? BankDetails { get; set; }
        public ICollection<KycDocument>? KycDocuments { get; set; }

        // MLM Referral Fields
        public int? ReferredByUserId { get; set; }
        public User? ReferredByUser { get; set; }

        [StringLength(20)]
        public string? ReferralCode { get; set; }

        public int? ReferralLevel { get; set; } = 1;

        public bool JoinedViaReferral { get; set; } = false;

        // Navigation property for direct referrals (users referred by this user)
        public ICollection<User>? DirectReferrals { get; set; }
    }
}

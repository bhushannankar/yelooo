using System.ComponentModel.DataAnnotations;

namespace ECommerceApi.Models
{
    public class ReferralInvitation
    {
        [Key]
        public int InvitationId { get; set; }

        public int InvitedByUserId { get; set; }
        public User? InvitedByUser { get; set; }

        [Required]
        [StringLength(255)]
        public required string InviteeEmail { get; set; }

        [Required]
        [StringLength(50)]
        public required string InvitationCode { get; set; }

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Pending"; // Pending, Accepted, Expired

        public DateTime SentAt { get; set; } = DateTime.Now;

        public DateTime ExpiresAt { get; set; }

        public DateTime? AcceptedAt { get; set; }

        public int? AcceptedByUserId { get; set; }
        public User? AcceptedByUser { get; set; }
    }
}

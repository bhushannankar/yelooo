using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    public class KycDocument
    {
        [Key]
        public int KycDocumentId { get; set; }

        [ForeignKey("User")]
        public int UserId { get; set; }
        public User? User { get; set; }

        [Required]
        [StringLength(50)]
        public required string DocumentType { get; set; } // Aadhaar, PAN, Passport, VoterId, DrivingLicense

        [Required]
        [StringLength(100)]
        public required string DocumentNumber { get; set; }

        [Required]
        [StringLength(500)]
        public required string DocumentFrontUrl { get; set; }

        [StringLength(500)]
        public string? DocumentBackUrl { get; set; }

        [StringLength(20)]
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected

        [StringLength(500)]
        public string? RejectionReason { get; set; }

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ReviewedAt { get; set; }

        [ForeignKey("ReviewedByUser")]
        public int? ReviewedByUserId { get; set; }
        public User? ReviewedByUser { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}

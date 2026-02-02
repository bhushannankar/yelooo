using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    public class KycStatusHistory
    {
        [Key]
        public int HistoryId { get; set; }

        [ForeignKey("KycDocument")]
        public int KycDocumentId { get; set; }
        public KycDocument? KycDocument { get; set; }

        [StringLength(20)]
        public string? OldStatus { get; set; }

        [Required]
        [StringLength(20)]
        public required string NewStatus { get; set; }

        [ForeignKey("ChangedByUser")]
        public int ChangedByUserId { get; set; }
        public User? ChangedByUser { get; set; }

        [StringLength(500)]
        public string? ChangeReason { get; set; }

        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    }
}

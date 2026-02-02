using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    public class UserPointsBalance
    {
        [Key]
        public int BalanceId { get; set; }

        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal TotalPointsEarned { get; set; } = 0;

        [Column(TypeName = "decimal(18, 2)")]
        public decimal TotalPointsRedeemed { get; set; } = 0;

        [Column(TypeName = "decimal(18, 2)")]
        public decimal CurrentBalance { get; set; } = 0;

        public DateTime LastUpdatedAt { get; set; } = DateTime.Now;
    }
}

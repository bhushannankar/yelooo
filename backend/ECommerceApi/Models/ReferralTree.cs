using System.ComponentModel.DataAnnotations;

namespace ECommerceApi.Models
{
    public class ReferralTree
    {
        [Key]
        public int TreeId { get; set; }

        public int AncestorUserId { get; set; }
        public User? AncestorUser { get; set; }

        public int DescendantUserId { get; set; }
        public User? DescendantUser { get; set; }

        public int Level { get; set; } // Distance between ancestor and descendant (1 = direct)

        public int LegRootUserId { get; set; }
        public User? LegRootUser { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}

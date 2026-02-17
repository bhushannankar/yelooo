using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    /// <summary>
    /// Assigns a seller to a tertiary category — seller can sell in all products under this tertiary (incl. quaternary when present).
    /// </summary>
    public class SellerTertiaryCategory
    {
        [Key]
        public int SellerTertiaryCategoryId { get; set; }

        [Required, ForeignKey("Seller")]
        public int SellerId { get; set; }
        public User? Seller { get; set; }

        [Required, ForeignKey("TertiaryCategory")]
        public int TertiaryCategoryId { get; set; }
        public TertiaryCategory? TertiaryCategory { get; set; }
    }
}

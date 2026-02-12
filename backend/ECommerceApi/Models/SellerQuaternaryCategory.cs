using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    /// <summary>
    /// Assigns a seller to a quaternary category — seller can sell products in this category.
    /// </summary>
    public class SellerQuaternaryCategory
    {
        [Key]
        public int SellerQuaternaryCategoryId { get; set; }

        [Required]
        [ForeignKey("Seller")]
        public int SellerId { get; set; }
        public User? Seller { get; set; }

        [Required]
        [ForeignKey("QuaternaryCategory")]
        public int QuaternaryCategoryId { get; set; }
        public QuaternaryCategory? QuaternaryCategory { get; set; }
    }
}

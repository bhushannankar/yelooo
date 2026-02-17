using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    /// <summary>
    /// Assigns a seller to a subcategory — seller can sell in all products under this sub (incl. tertiary/quaternary when present).
    /// </summary>
    public class SellerSubCategory
    {
        [Key]
        public int SellerSubCategoryId { get; set; }

        [Required, ForeignKey("Seller")]
        public int SellerId { get; set; }
        public User? Seller { get; set; }

        [Required, ForeignKey("SubCategory")]
        public int SubCategoryId { get; set; }
        public SubCategory? SubCategory { get; set; }
    }
}

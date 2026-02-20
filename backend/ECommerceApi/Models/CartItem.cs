using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    public class CartItem
    {
        [Key]
        public int CartItemId { get; set; }

        [Required]
        [ForeignKey("User")]
        public int UserId { get; set; }
        public User? User { get; set; }

        [Required]
        [ForeignKey("Product")]
        public int ProductId { get; set; }
        public Product? Product { get; set; }

        [Required]
        public int Quantity { get; set; } = 1;

        /// <summary>Price at time of add (e.g. selected seller's price). If null, use Product.Price when displaying.</summary>
        public decimal? Price { get; set; }

        /// <summary>Original/MRP at time of add. If null, use Product.OriginalPrice when displaying.</summary>
        public decimal? OriginalPrice { get; set; }

        /// <summary>Selected seller offer (ProductSellerId). If set, checkout shows this seller.</summary>
        public int? ProductSellerId { get; set; }

        public DateTime AddedAt { get; set; } = DateTime.Now;

        public DateTime UpdatedAt { get; set; } = DateTime.Now;
    }
}

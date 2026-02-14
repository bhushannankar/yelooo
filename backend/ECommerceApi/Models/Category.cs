using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models
{
    public class Category
    {
        [Key]
        public int CategoryId { get; set; }

        [Required]
        [StringLength(100)]
        public required string CategoryName { get; set; }

        /// <summary>Display order in header/nav (lower = first). Admin controls sequence.</summary>
        public int DisplayOrder { get; set; }

        public ICollection<SubCategory>? SubCategories { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models;

/// <summary>Configures points-to-rupee conversion. PointsPerRupee = 10 means 10 points = ₹1 discount.</summary>
public class PointsRedemptionConfig
{
    [Key]
    public int Id { get; set; }

    /// <summary>Points required for ₹1 discount. E.g. 10 means 10 points = ₹1</summary>
    [Required]
    [Column(TypeName = "decimal(10, 2)")]
    public decimal PointsPerRupee { get; set; } = 10;

    public bool IsActive { get; set; } = true;
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Models;

/// <summary>Benefits offered to customers who have earned points above a threshold.</summary>
public class PointsBenefit
{
    [Key]
    public int PointsBenefitId { get; set; }

    /// <summary>Minimum TotalPointsEarned required to unlock this benefit</summary>
    [Required]
    [Column(TypeName = "decimal(18, 2)")]
    public decimal PointsThreshold { get; set; }

    /// <summary>ExtraDiscountPercent, FixedDiscount, FreeShipping</summary>
    [Required]
    [StringLength(50)]
    public string BenefitType { get; set; } = "ExtraDiscountPercent";

    /// <summary>Value: % for ExtraDiscountPercent, rupees for FixedDiscount, 1 for FreeShipping</summary>
    [Column(TypeName = "decimal(10, 2)")]
    public decimal BenefitValue { get; set; }

    [StringLength(200)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; } = 0;
}

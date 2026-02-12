namespace ECommerceApi.Services;

public interface IReferralCodeService
{
    /// <summary>Customer referral code: YA + 6 digits (e.g. YA456781).</summary>
    Task<string> GetNextReferralCodeAsync();

    /// <summary>Seller User Id: YSA + 5 digits (e.g. YSA96734). Then YSB, YSC, etc.</summary>
    Task<string> GetNextSellerCodeAsync();
}

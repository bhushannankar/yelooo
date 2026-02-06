namespace ECommerceApi.Services;

public interface IReferralCodeService
{
    Task<string> GetNextReferralCodeAsync();
}

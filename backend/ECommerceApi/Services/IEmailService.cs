namespace ECommerceApi.Services
{
    public interface IEmailService
    {
        Task SendPasswordResetEmailAsync(string email, string resetToken, string resetLink);
        Task SendWelcomeEmailAsync(string email, string displayName, string referralCode, string role = "Customer");
    }
}

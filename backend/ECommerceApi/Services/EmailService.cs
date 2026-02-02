using System.Net;
using System.Net.Mail;

namespace ECommerceApi.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendPasswordResetEmailAsync(string email, string resetToken, string resetLink)
        {
            try
            {
                // For development: Log the reset link instead of sending email
                // In production, configure SMTP settings in appsettings.json
                _logger.LogInformation($"Password Reset Link for {email}: {resetLink}");
                _logger.LogInformation($"Reset Token: {resetToken}");

                // Uncomment and configure the following code for actual email sending
                /*
                var smtpServer = _configuration["Email:SmtpServer"];
                var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
                var smtpUsername = _configuration["Email:Username"];
                var smtpPassword = _configuration["Email:Password"];
                var fromEmail = _configuration["Email:FromEmail"];
                var fromName = _configuration["Email:FromName"] ?? "E-Commerce Store";

                if (string.IsNullOrEmpty(smtpServer) || string.IsNullOrEmpty(smtpUsername))
                {
                    _logger.LogWarning("Email configuration is missing. Logging reset link instead.");
                    _logger.LogInformation($"Password Reset Link: {resetLink}");
                    return;
                }

                using (var client = new SmtpClient(smtpServer, smtpPort))
                {
                    client.EnableSsl = true;
                    client.Credentials = new NetworkCredential(smtpUsername, smtpPassword);

                    var mailMessage = new MailMessage
                    {
                        From = new MailAddress(fromEmail, fromName),
                        Subject = "Password Reset Request",
                        Body = $@"
                            <html>
                            <body>
                                <h2>Password Reset Request</h2>
                                <p>You have requested to reset your password.</p>
                                <p>Click the link below to reset your password:</p>
                                <p><a href=""{resetLink}"">{resetLink}</a></p>
                                <p>This link will expire in 1 hour.</p>
                                <p>If you did not request this, please ignore this email.</p>
                            </body>
                            </html>
                        ",
                        IsBodyHtml = true
                    };

                    mailMessage.To.Add(email);

                    await client.SendMailAsync(mailMessage);
                    _logger.LogInformation($"Password reset email sent to {email}");
                }
                */

                // For now, we'll just log it. In production, implement actual email sending above.
                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending password reset email to {email}");
                // Don't throw - we don't want to expose email sending failures to the user
                // The reset token is still generated and saved
            }
        }
    }
}

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

        private (string? SmtpServer, int Port, string? Username, string? Password, string? FromEmail, string FromName) GetEmailConfig(string fromNameDefault = "Yelooo")
        {
            var smtpServer = _configuration["Email:SmtpServer"]?.Trim();
            var portStr = _configuration["Email:SmtpPort"]?.Trim();
            var username = _configuration["Email:Username"]?.Trim();
            var password = _configuration["Email:Password"];
            var fromEmail = _configuration["Email:FromEmail"]?.Trim();
            var fromName = _configuration["Email:FromName"]?.Trim() ?? fromNameDefault;

            // Gmail: port 587 (STARTTLS) and FromEmail should match authenticated account
            var isGmail = !string.IsNullOrEmpty(smtpServer) && smtpServer.Contains("gmail.com", StringComparison.OrdinalIgnoreCase);
            if (isGmail)
            {
                if (string.IsNullOrEmpty(portStr)) portStr = "587";
                if (string.IsNullOrEmpty(fromEmail) && !string.IsNullOrEmpty(username)) fromEmail = username;
            }

            var port = 587;
            if (!string.IsNullOrEmpty(portStr) && int.TryParse(portStr, out var p) && p > 0)
                port = p;

            return (smtpServer, port, username, password, fromEmail ?? username, fromName);
        }

        public async Task SendPasswordResetEmailAsync(string email, string resetToken, string resetLink)
        {
            var (smtpServer, smtpPort, smtpUsername, smtpPassword, fromEmail, fromName) = GetEmailConfig("E-Commerce Store");

            if (string.IsNullOrEmpty(smtpServer) || string.IsNullOrEmpty(smtpUsername))
            {
                _logger.LogWarning("Email configuration is missing. Logging reset link instead.");
                _logger.LogInformation("Password Reset Link for {Email}: {Link}", email, resetLink);
                await Task.CompletedTask;
                return;
            }

            try
            {
                using var client = new SmtpClient(smtpServer, smtpPort);
                client.EnableSsl = true;
                client.Credentials = new NetworkCredential(smtpUsername, smtpPassword);

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(fromEmail ?? smtpUsername, fromName),
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
                _logger.LogInformation("Password reset email sent to {Email}", email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending password reset email to {Email}. SmtpServer={Server} Port={Port}. {Detail}", email, smtpServer, smtpPort, ex.Message);
                await Task.CompletedTask;
            }
        }

        public async Task SendWelcomeEmailAsync(string email, string displayName, string referralCode, string role = "Customer")
        {
            _logger.LogInformation("Welcome email for {Email}: User Id (Referral Code) = {ReferralCode}, Role = {Role}", email, referralCode, role);

            var (smtpServer, smtpPort, smtpUsername, smtpPassword, fromEmail, fromName) = GetEmailConfig("Yelooo");

            if (string.IsNullOrEmpty(smtpServer) || string.IsNullOrEmpty(smtpUsername))
            {
                _logger.LogWarning("Email configuration missing. Welcome email not sent. User Id: {ReferralCode}", referralCode);
                await Task.CompletedTask;
                return;
            }

            try
            {
                using var client = new SmtpClient(smtpServer, smtpPort);
                client.EnableSsl = true;
                client.Credentials = new NetworkCredential(smtpUsername, smtpPassword);

                var body = $@"
<html><body>
<h2>Welcome to Yelooo!</h2>
<p>Hi {System.Net.WebUtility.HtmlEncode(displayName)},</p>
<p>Your account has been created successfully.</p>
<p><strong>Your User Id (use this to login):</strong> <code>{System.Net.WebUtility.HtmlEncode(referralCode)}</code></p>
<p>Please save this User Id. You will need it along with your password to log in.</p>
<p>Role: {System.Net.WebUtility.HtmlEncode(role)}</p>
<p>Thank you for joining Yelooo!</p>
</body></html>";
                var mailMessage = new MailMessage
                {
                    From = new MailAddress(fromEmail ?? "noreply@yelooo.in", fromName),
                    Subject = "Welcome to Yelooo - Your User Id",
                    Body = body,
                    IsBodyHtml = true
                };
                mailMessage.To.Add(email);
                await client.SendMailAsync(mailMessage);
                _logger.LogInformation("Welcome email sent to {Email}", email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending welcome email to {Email}. SmtpServer={Server} Port={Port}. {Detail}", email, smtpServer, smtpPort, ex.Message);
                await Task.CompletedTask;
            }
        }
    }
}

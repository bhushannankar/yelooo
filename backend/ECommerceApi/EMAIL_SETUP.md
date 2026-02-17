# Email setup (Gmail and others)

If **emails are not received at Gmail** (or not sent at all), check the following.

## 1. Sending **via** Gmail SMTP (your app sends mail using a Gmail account)

Use these settings in `appsettings.json` (or override in `appsettings.Development.json` / User Secrets):

```json
"Email": {
  "SmtpServer": "smtp.gmail.com",
  "SmtpPort": "587",
  "Username": "yourname@gmail.com",
  "Password": "your-16-char-app-password",
  "FromEmail": "yourname@gmail.com",
  "FromName": "Yelooo"
}
```

**Important:**

- **Password** must be a **Gmail App Password**, not your normal Gmail password.  
  - Turn on [2-Step Verification](https://myaccount.google.com/signinoptions/two-step-verification).  
  - Then create an [App Password](https://myaccount.google.com/apppasswords) and use that 16-character password in `Password`.
- **FromEmail** should be the same as **Username** (your Gmail address) when using Gmail SMTP.
- Port **587** with SSL (STARTTLS) is used by default; the app sets this when it detects Gmail.

If you use your normal Gmail password, Google will block the login and emails will not be sent.

## 2. Emails sent **to** Gmail are not received

- **Check Spam / Promotions** in the Gmail inbox.
- If you use a **custom domain** (e.g. `support@yelooo.in`) to send mail, ensure **SPF** and **DKIM** are set for that domain; otherwise Gmail may treat messages as spam or reject them.
- Check **backend logs** when triggering an email (e.g. forgot password, welcome email). You should see either:
  - `"Welcome email sent to ..."` / `"Password reset email sent to ..."` if send succeeded, or
  - `"Error sending welcome email to ..."` with exception details if send failed.

## 3. Storing credentials securely

Do **not** commit real passwords to git. Use one of:

- **User Secrets** (development):  
  `dotnet user-secrets set "Email:Password" "your-app-password"`
- **Environment variables**: e.g. set `Email__Password` (double underscore in .NET config).
- **Production**: use your hosting platform’s secret/config (e.g. Azure Key Vault, env vars).

After changing `appsettings.json` or secrets, restart the API.

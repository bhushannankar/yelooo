# Forgot Password Feature - Setup Guide

This document explains how to set up and use the forgot password feature.

## Database Setup

1. **Run the database migration script:**
   ```sql
   -- Execute the script located at: db/add_password_reset_fields.sql
   ```
   This script adds the following fields to the `Users` table:
   - `PasswordResetToken` (NVARCHAR(255), nullable)
   - `PasswordResetTokenExpiry` (DATETIME, nullable)

2. **Verify the migration:**
   ```sql
   SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
   FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_NAME = 'Users'
       AND COLUMN_NAME IN ('PasswordResetToken', 'PasswordResetTokenExpiry');
   ```

## Backend Configuration

### Email Service Setup

The email service is currently configured to log reset links to the console in development mode. To enable actual email sending:

1. **Update `appsettings.json`** with your SMTP settings:
   ```json
   {
     "Email": {
       "SmtpServer": "smtp.gmail.com",
       "SmtpPort": "587",
       "Username": "your-email@gmail.com",
       "Password": "your-app-password",
       "FromEmail": "noreply@ecommerce.com",
       "FromName": "E-Commerce Store"
     }
   }
   ```

2. **Uncomment the email sending code** in `backend/ECommerceApi/Services/EmailService.cs` (lines 30-70).

3. **For Gmail:**
   - Enable 2-factor authentication
   - Generate an App Password (not your regular password)
   - Use the App Password in the configuration

4. **For other email providers:**
   - Update `SmtpServer` and `SmtpPort` accordingly
   - Common ports: 587 (TLS), 465 (SSL), 25 (unencrypted)

### API Endpoints

The following endpoints are available:

1. **POST `/api/Auth/forgot-password`**
   - Request body: `{ "email": "user@example.com" }`
   - Response: `{ "message": "If an account with that email exists, a password reset link has been sent." }`
   - Generates a reset token and sends an email (or logs in development)

2. **POST `/api/Auth/reset-password`**
   - Request body: 
     ```json
     {
       "email": "user@example.com",
       "token": "reset-token-from-email",
       "newPassword": "newPassword123"
     }
     ```
   - Response: `{ "message": "Password has been reset successfully." }`

3. **POST `/api/Auth/verify-reset-token`**
   - Request body: `{ "email": "user@example.com", "token": "reset-token" }`
   - Response: `{ "isValid": true/false, "message": "..." }`
   - Used to verify if a reset token is valid before showing the reset form

## Frontend Routes

The following routes are available:

- `/forgot-password` - Request password reset
- `/reset-password?token=...&email=...` - Reset password with token

## Security Features

1. **Token Security:**
   - Tokens are hashed using BCrypt before storage
   - Tokens expire after 1 hour
   - Tokens are single-use (cleared after successful reset)

2. **Email Enumeration Protection:**
   - The API always returns the same success message regardless of whether the email exists
   - This prevents attackers from discovering valid email addresses

3. **Password Validation:**
   - Minimum 6 characters required
   - Passwords are hashed using BCrypt

## Usage Flow

1. User clicks "Forgot Password?" on the login page
2. User enters their email address
3. System generates a secure reset token and sends it via email (or logs it in development)
4. User clicks the link in the email (or uses the link from server logs)
5. System verifies the token is valid and not expired
6. User enters new password
7. System validates and updates the password
8. User is redirected to login page

## Development Mode

In development mode, the reset link is logged to the console/server logs instead of being sent via email. Check your backend console output for messages like:

```
Password Reset Link for user@example.com: http://localhost:3000/reset-password?token=...
Reset Token: ...
```

## Testing

1. **Test Forgot Password:**
   - Navigate to `/forgot-password`
   - Enter a valid email address
   - Check server logs for the reset link

2. **Test Reset Password:**
   - Use the reset link from the logs
   - Verify the token validation works
   - Test with expired tokens (wait > 1 hour)
   - Test with invalid tokens

3. **Test Password Validation:**
   - Try passwords less than 6 characters
   - Try mismatched passwords
   - Verify successful password reset

## Troubleshooting

1. **Reset link not working:**
   - Check if token has expired (1 hour limit)
   - Verify the token and email match
   - Check server logs for errors

2. **Email not sending:**
   - Verify SMTP configuration in `appsettings.json`
   - Check firewall/network settings
   - Verify email credentials
   - Check server logs for email errors

3. **Database errors:**
   - Ensure migration script has been run
   - Verify database connection string
   - Check that User model matches database schema

## Production Considerations

1. **Security:**
   - Use strong JWT secret key
   - Enable HTTPS
   - Use secure email service (SendGrid, AWS SES, etc.)
   - Implement rate limiting on reset requests
   - Add CAPTCHA to prevent abuse

2. **Email Service:**
   - Consider using a dedicated email service (SendGrid, Mailgun, AWS SES)
   - Implement email templates
   - Add email delivery tracking
   - Set up email bounce handling

3. **Monitoring:**
   - Log all password reset attempts
   - Monitor for suspicious activity
   - Set up alerts for failed attempts

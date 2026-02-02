-- Add password reset fields to Users table
-- This script adds fields to support forgot password functionality

USE ECommerceDB;
GO

-- Add PasswordResetToken column (nullable, stores the reset token)
ALTER TABLE Users
ADD PasswordResetToken NVARCHAR(255) NULL;

-- Add PasswordResetTokenExpiry column (nullable, stores when the token expires)
ALTER TABLE Users
ADD PasswordResetTokenExpiry DATETIME NULL;

-- Add index on PasswordResetToken for faster lookups
CREATE INDEX IX_Users_PasswordResetToken ON Users(PasswordResetToken);

GO

-- Verify the changes
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Users'
    AND COLUMN_NAME IN ('PasswordResetToken', 'PasswordResetTokenExpiry');

GO

PRINT 'Password reset fields added successfully to Users table.';

-- =====================================================
-- Database Script: Fix Existing Users Null Values
-- Description: Sets default values for new columns on existing users
-- =====================================================

USE ECommerceDB;
GO

-- Set default value for KycStatus for existing users
UPDATE Users 
SET KycStatus = 'NotSubmitted' 
WHERE KycStatus IS NULL;

PRINT 'Updated KycStatus for existing users';

-- Set default value for Country for existing users
UPDATE Users 
SET Country = 'India' 
WHERE Country IS NULL;

PRINT 'Updated Country for existing users';

-- Verify the updates
SELECT 
    UserId, 
    Username, 
    Email, 
    KycStatus, 
    Country 
FROM Users;

GO

PRINT 'Script completed successfully!';

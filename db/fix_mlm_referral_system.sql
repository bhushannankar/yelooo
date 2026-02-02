-- =============================================
-- Fix MLM Referral System Script
-- =============================================
-- This script fixes the issues from the initial MLM setup
-- =============================================

USE [ECommerceDb]
GO

-- =============================================
-- Step 1: Add ReferralCode column if not exists
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'ReferralCode')
BEGIN
    ALTER TABLE Users ADD ReferralCode NVARCHAR(20) NULL;
    PRINT 'Added ReferralCode column to Users table';
END
GO

-- Create unique index for referral codes (if not exists)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_ReferralCode' AND object_id = OBJECT_ID('Users'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX IX_Users_ReferralCode 
        ON Users(ReferralCode) WHERE ReferralCode IS NOT NULL;
    PRINT 'Created unique index on ReferralCode';
END
GO

-- =============================================
-- Step 2: Generate referral codes for existing customers
-- =============================================

-- Generate unique referral codes for existing customers who don't have one
-- Customers have RoleId = 3
UPDATE Users
SET ReferralCode = UPPER(LEFT(REPLACE(NEWID(), '-', ''), 8))
WHERE ReferralCode IS NULL AND RoleId = 3;

PRINT 'Generated referral codes for existing customers';
GO

-- Set default ReferralLevel for existing users who don't have one
UPDATE Users
SET ReferralLevel = 1
WHERE ReferralLevel IS NULL AND RoleId = 3;

PRINT 'Set default ReferralLevel for existing customers';
GO

-- =============================================
-- Step 3: Drop and recreate the view with correct column names
-- =============================================

IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID('vw_UserReferralNetwork'))
    DROP VIEW vw_UserReferralNetwork;
GO

CREATE VIEW vw_UserReferralNetwork AS
SELECT 
    u.UserId,
    u.Username,
    u.Email,
    u.ReferralCode,
    u.ReferralLevel,
    u.ReferredByUserId,
    ru.Username AS ReferredByUsername,
    u.JoinedViaReferral,
    u.CreatedAt,
    (SELECT COUNT(*) FROM Users WHERE ReferredByUserId = u.UserId) AS DirectReferralsCount,
    (SELECT COUNT(*) FROM ReferralTree WHERE AncestorUserId = u.UserId) AS TotalDownlineCount
FROM Users u
LEFT JOIN Users ru ON u.ReferredByUserId = ru.UserId
WHERE u.RoleId = 3;  -- Customer role
GO

PRINT 'Recreated vw_UserReferralNetwork view with correct column names';
GO

-- =============================================
-- Step 4: Verify the setup
-- =============================================

-- Check that all columns exist
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'ReferralCode')
    AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'ReferralLevel')
    AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'ReferredByUserId')
    AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'JoinedViaReferral')
BEGIN
    PRINT 'All referral columns verified in Users table';
END
ELSE
BEGIN
    PRINT 'WARNING: Some referral columns are missing!';
END
GO

-- Show existing customers with their referral codes
SELECT UserId, Username, Email, ReferralCode, ReferralLevel, ReferredByUserId, JoinedViaReferral
FROM Users
WHERE RoleId = 3;
GO

PRINT '=============================================';
PRINT 'MLM Referral System fix completed successfully!';
PRINT '=============================================';

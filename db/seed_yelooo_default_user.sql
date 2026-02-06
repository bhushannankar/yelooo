-- =============================================
-- Seed Yelooo Default User with Referral Code YA000001
-- Run this script if the default user does not exist
-- (The API also creates this user automatically on startup)
-- =============================================

USE ECommerceDB;
GO

-- Check if Yelooo user with YA000001 already exists
IF NOT EXISTS (SELECT 1 FROM Users WHERE ReferralCode = 'YA000001')
BEGIN
    -- Migrate old YELOOO user if exists
    IF EXISTS (SELECT 1 FROM Users WHERE ReferralCode = 'YELOOO')
    BEGIN
        UPDATE Users 
        SET ReferralCode = 'YA000001'
        WHERE ReferralCode = 'YELOOO';
        PRINT 'Updated existing Yelooo user: YELOOO -> YA000001';
    END
    ELSE
    BEGIN
        -- Create new Yelooo company user
        -- Password: Yelooo@Company#NoLogin (BCrypt hash)
        DECLARE @RoleId INT = (SELECT RoleId FROM Roles WHERE RoleName = 'Customer');
        IF @RoleId IS NULL SET @RoleId = 3;

        INSERT INTO Users (
            Username,
            Email,
            PasswordHash,
            CreatedAt,
            RoleId,
            ReferralCode,
            ReferralLevel,
            ReferredByUserId,
            JoinedViaReferral,
            FullName
        )
        VALUES (
            'yelooo',
            'company@yelooo.in',
            '$2a$11$8K1p/a0dL1LXMIgoEDFrwOfMQD6mYPnQbGnJGnjnH7nJKxY/jY4Vi', -- BCrypt of Yelooo@Company#NoLogin
            GETUTCDATE(),
            @RoleId,
            'YA000001',
            1,
            NULL,
            0,
            'Yelooo'
        );
        PRINT 'Created Yelooo default user with ReferralCode YA000001';
    END
END
ELSE
BEGIN
    PRINT 'Yelooo user with YA000001 already exists. No action needed.';
END
GO

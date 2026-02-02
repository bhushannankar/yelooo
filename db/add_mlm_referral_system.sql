-- =============================================
-- MLM Referral System Database Script
-- =============================================
-- This script adds Multi-Level Marketing (MLM) referral capabilities
-- - Each customer can refer others via referral link
-- - Referral tree can extend up to 8 levels deep
-- - Customers can have unlimited direct referrals (legs)
-- =============================================

USE [ECommerceDb]
GO

-- =============================================
-- Step 1: Add referral fields to Users table
-- =============================================

-- Add ReferredByUserId column to track who referred this user
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'ReferredByUserId')
BEGIN
    ALTER TABLE Users ADD ReferredByUserId INT NULL;
    
    -- Add foreign key constraint
    ALTER TABLE Users ADD CONSTRAINT FK_Users_ReferredBy 
        FOREIGN KEY (ReferredByUserId) REFERENCES Users(UserId);
    
    PRINT 'Added ReferredByUserId column to Users table';
END
GO

-- Add ReferralCode column - unique code for each user to share
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'ReferralCode')
BEGIN
    ALTER TABLE Users ADD ReferralCode NVARCHAR(20) NULL;
    
    -- Create unique index for referral codes
    CREATE UNIQUE NONCLUSTERED INDEX IX_Users_ReferralCode 
        ON Users(ReferralCode) WHERE ReferralCode IS NOT NULL;
    
    PRINT 'Added ReferralCode column to Users table';
END
GO

-- Add ReferralLevel column - the level of this user in the MLM tree (1-8)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'ReferralLevel')
BEGIN
    ALTER TABLE Users ADD ReferralLevel INT NULL DEFAULT 1;
    PRINT 'Added ReferralLevel column to Users table';
END
GO

-- Add JoinedViaReferral column - indicates if user joined via referral
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'JoinedViaReferral')
BEGIN
    ALTER TABLE Users ADD JoinedViaReferral BIT NOT NULL DEFAULT 0;
    PRINT 'Added JoinedViaReferral column to Users table';
END
GO

-- =============================================
-- Step 2: Create ReferralInvitations table
-- =============================================
-- Tracks referral invitations sent via email

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('ReferralInvitations') AND type = 'U')
BEGIN
    CREATE TABLE ReferralInvitations (
        InvitationId INT IDENTITY(1,1) PRIMARY KEY,
        InvitedByUserId INT NOT NULL,
        InviteeEmail NVARCHAR(255) NOT NULL,
        InvitationCode NVARCHAR(50) NOT NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT 'Pending', -- Pending, Accepted, Expired
        SentAt DATETIME NOT NULL DEFAULT GETDATE(),
        ExpiresAt DATETIME NOT NULL,
        AcceptedAt DATETIME NULL,
        AcceptedByUserId INT NULL,
        
        CONSTRAINT FK_ReferralInvitations_InvitedBy FOREIGN KEY (InvitedByUserId) 
            REFERENCES Users(UserId),
        CONSTRAINT FK_ReferralInvitations_AcceptedBy FOREIGN KEY (AcceptedByUserId) 
            REFERENCES Users(UserId)
    );
    
    CREATE INDEX IX_ReferralInvitations_Code ON ReferralInvitations(InvitationCode);
    CREATE INDEX IX_ReferralInvitations_Email ON ReferralInvitations(InviteeEmail);
    
    PRINT 'Created ReferralInvitations table';
END
GO

-- =============================================
-- Step 3: Create ReferralTree table
-- =============================================
-- Stores the complete referral tree with level information
-- This denormalized table helps in quick lookups of the entire downline

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('ReferralTree') AND type = 'U')
BEGIN
    CREATE TABLE ReferralTree (
        TreeId INT IDENTITY(1,1) PRIMARY KEY,
        AncestorUserId INT NOT NULL,      -- The user who is an ancestor
        DescendantUserId INT NOT NULL,    -- The user who is a descendant
        Level INT NOT NULL,               -- Distance between ancestor and descendant (1 = direct referral)
        LegRootUserId INT NOT NULL,       -- The direct referral that started this leg
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT FK_ReferralTree_Ancestor FOREIGN KEY (AncestorUserId) 
            REFERENCES Users(UserId),
        CONSTRAINT FK_ReferralTree_Descendant FOREIGN KEY (DescendantUserId) 
            REFERENCES Users(UserId),
        CONSTRAINT FK_ReferralTree_LegRoot FOREIGN KEY (LegRootUserId) 
            REFERENCES Users(UserId),
        CONSTRAINT UQ_ReferralTree_AncestorDescendant UNIQUE (AncestorUserId, DescendantUserId)
    );
    
    CREATE INDEX IX_ReferralTree_Ancestor ON ReferralTree(AncestorUserId);
    CREATE INDEX IX_ReferralTree_Descendant ON ReferralTree(DescendantUserId);
    CREATE INDEX IX_ReferralTree_Level ON ReferralTree(Level);
    CREATE INDEX IX_ReferralTree_LegRoot ON ReferralTree(LegRootUserId);
    
    PRINT 'Created ReferralTree table';
END
GO

-- =============================================
-- Step 4: Generate referral codes for existing users
-- =============================================

-- Generate unique referral codes for existing users who don't have one
UPDATE Users
SET ReferralCode = UPPER(LEFT(REPLACE(NEWID(), '-', ''), 8))
WHERE ReferralCode IS NULL AND Role = 'Customer';

PRINT 'Generated referral codes for existing users';
GO

-- =============================================
-- Step 5: Create stored procedure for adding referral tree entries
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('sp_AddToReferralTree') AND type = 'P')
    DROP PROCEDURE sp_AddToReferralTree;
GO

CREATE PROCEDURE sp_AddToReferralTree
    @NewUserId INT,
    @ReferredByUserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @MaxLevel INT = 8;
    DECLARE @NewUserLevel INT;
    
    -- Get the level of the referrer
    DECLARE @ReferrerLevel INT;
    SELECT @ReferrerLevel = ISNULL(ReferralLevel, 1) FROM Users WHERE UserId = @ReferredByUserId;
    
    -- Calculate new user's level
    SET @NewUserLevel = @ReferrerLevel + 1;
    
    -- Only proceed if within 8 levels
    IF @NewUserLevel <= @MaxLevel
    BEGIN
        -- Update the new user's referral level
        UPDATE Users SET ReferralLevel = @NewUserLevel WHERE UserId = @NewUserId;
        
        -- Determine the leg root (direct referral of the top-level ancestor)
        DECLARE @LegRootUserId INT;
        
        -- Find the leg root by traversing up to find who is at level 2 (direct referral of level 1)
        -- If the new user is at level 2, they ARE the leg root
        IF @NewUserLevel = 2
        BEGIN
            SET @LegRootUserId = @NewUserId;
        END
        ELSE
        BEGIN
            -- Find the ancestor at level 2 in this chain
            ;WITH AncestorChain AS (
                SELECT UserId, ReferredByUserId, ReferralLevel
                FROM Users
                WHERE UserId = @NewUserId
                
                UNION ALL
                
                SELECT u.UserId, u.ReferredByUserId, u.ReferralLevel
                FROM Users u
                INNER JOIN AncestorChain ac ON u.UserId = ac.ReferredByUserId
                WHERE u.ReferralLevel >= 2
            )
            SELECT @LegRootUserId = UserId
            FROM AncestorChain
            WHERE ReferralLevel = 2;
            
            -- If no level 2 found, use the direct referrer as leg root
            IF @LegRootUserId IS NULL
                SET @LegRootUserId = @ReferredByUserId;
        END
        
        -- Add direct relationship
        INSERT INTO ReferralTree (AncestorUserId, DescendantUserId, Level, LegRootUserId)
        VALUES (@ReferredByUserId, @NewUserId, 1, @LegRootUserId);
        
        -- Add all ancestor relationships from the referrer's ancestors
        INSERT INTO ReferralTree (AncestorUserId, DescendantUserId, Level, LegRootUserId)
        SELECT 
            rt.AncestorUserId,
            @NewUserId,
            rt.Level + 1,
            @LegRootUserId
        FROM ReferralTree rt
        WHERE rt.DescendantUserId = @ReferredByUserId
        AND rt.Level + 1 <= @MaxLevel - 1; -- Ensure we don't exceed max level
    END
END
GO

PRINT 'Created sp_AddToReferralTree stored procedure';
GO

-- =============================================
-- Step 6: Create view for easy referral network queries
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
WHERE u.Role = 'Customer';
GO

PRINT 'Created vw_UserReferralNetwork view';
GO

PRINT '=============================================';
PRINT 'MLM Referral System setup completed successfully!';
PRINT '=============================================';

-- =====================================================
-- Database Script: KYC and Bank Details
-- Description: Adds tables for user profile, bank details, and KYC documents
-- =====================================================

USE ECommerceDB;
GO

-- =====================================================
-- Step 1: Add profile fields to Users table
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'FullName')
BEGIN
    ALTER TABLE Users ADD FullName NVARCHAR(200) NULL;
    PRINT 'Added FullName column to Users table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'PhoneNumber')
BEGIN
    ALTER TABLE Users ADD PhoneNumber NVARCHAR(20) NULL;
    PRINT 'Added PhoneNumber column to Users table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'DateOfBirth')
BEGIN
    ALTER TABLE Users ADD DateOfBirth DATE NULL;
    PRINT 'Added DateOfBirth column to Users table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'Address')
BEGIN
    ALTER TABLE Users ADD Address NVARCHAR(500) NULL;
    PRINT 'Added Address column to Users table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'City')
BEGIN
    ALTER TABLE Users ADD City NVARCHAR(100) NULL;
    PRINT 'Added City column to Users table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'State')
BEGIN
    ALTER TABLE Users ADD [State] NVARCHAR(100) NULL;
    PRINT 'Added State column to Users table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'PinCode')
BEGIN
    ALTER TABLE Users ADD PinCode NVARCHAR(10) NULL;
    PRINT 'Added PinCode column to Users table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'ProfileImageUrl')
BEGIN
    ALTER TABLE Users ADD ProfileImageUrl NVARCHAR(500) NULL;
    PRINT 'Added ProfileImageUrl column to Users table';
END
GO

-- =====================================================
-- Step 2: Create UserBankDetails table
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'UserBankDetails') AND type = 'U')
BEGIN
    CREATE TABLE UserBankDetails (
        BankDetailId INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        AccountHolderName NVARCHAR(200) NOT NULL,
        AccountNumber NVARCHAR(50) NOT NULL,
        BankName NVARCHAR(200) NOT NULL,
        BranchName NVARCHAR(200) NOT NULL,
        IFSCCode NVARCHAR(20) NOT NULL,
        AccountType NVARCHAR(50) DEFAULT 'Savings', -- Savings, Current
        IsVerified BIT DEFAULT 0,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_UserBankDetails_Users FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE
    );
    
    CREATE INDEX IX_UserBankDetails_UserId ON UserBankDetails(UserId);
    
    PRINT 'Created UserBankDetails table';
END
GO

-- =====================================================
-- Step 3: Create KycDocuments table
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'KycDocuments') AND type = 'U')
BEGIN
    CREATE TABLE KycDocuments (
        KycDocumentId INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        DocumentType NVARCHAR(50) NOT NULL, -- Aadhaar, PAN, Passport, VoterId, DrivingLicense
        DocumentNumber NVARCHAR(100) NOT NULL,
        DocumentFrontUrl NVARCHAR(500) NOT NULL,
        DocumentBackUrl NVARCHAR(500) NULL, -- Some documents may not have back side
        Status NVARCHAR(20) DEFAULT 'Pending', -- Pending, Approved, Rejected
        RejectionReason NVARCHAR(500) NULL,
        SubmittedAt DATETIME DEFAULT GETDATE(),
        ReviewedAt DATETIME NULL,
        ReviewedByUserId INT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_KycDocuments_Users FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
        CONSTRAINT FK_KycDocuments_ReviewedBy FOREIGN KEY (ReviewedByUserId) REFERENCES Users(UserId)
    );
    
    CREATE INDEX IX_KycDocuments_UserId ON KycDocuments(UserId);
    CREATE INDEX IX_KycDocuments_Status ON KycDocuments(Status);
    
    PRINT 'Created KycDocuments table';
END
GO

-- =====================================================
-- Step 4: Add KYC status to Users table
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'KycStatus')
BEGIN
    ALTER TABLE Users ADD KycStatus NVARCHAR(20) DEFAULT 'NotSubmitted'; -- NotSubmitted, Pending, Approved, Rejected
    PRINT 'Added KycStatus column to Users table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'KycApprovedAt')
BEGIN
    ALTER TABLE Users ADD KycApprovedAt DATETIME NULL;
    PRINT 'Added KycApprovedAt column to Users table';
END
GO

-- =====================================================
-- Step 5: Create audit log for KYC status changes
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'KycStatusHistory') AND type = 'U')
BEGIN
    CREATE TABLE KycStatusHistory (
        HistoryId INT IDENTITY(1,1) PRIMARY KEY,
        KycDocumentId INT NOT NULL,
        OldStatus NVARCHAR(20) NULL,
        NewStatus NVARCHAR(20) NOT NULL,
        ChangedByUserId INT NOT NULL,
        ChangeReason NVARCHAR(500) NULL,
        ChangedAt DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_KycStatusHistory_KycDocuments FOREIGN KEY (KycDocumentId) REFERENCES KycDocuments(KycDocumentId) ON DELETE CASCADE,
        CONSTRAINT FK_KycStatusHistory_Users FOREIGN KEY (ChangedByUserId) REFERENCES Users(UserId)
    );
    
    CREATE INDEX IX_KycStatusHistory_KycDocumentId ON KycStatusHistory(KycDocumentId);
    
    PRINT 'Created KycStatusHistory table';
END
GO

-- =====================================================
-- Step 6: Verify the schema
-- =====================================================

PRINT '';
PRINT '========== Schema Verification ==========';

-- Check Users table columns
SELECT 
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable
FROM sys.columns c
JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('Users')
AND c.name IN ('FullName', 'PhoneNumber', 'DateOfBirth', 'Address', 'City', 'State', 'PinCode', 'ProfileImageUrl', 'KycStatus', 'KycApprovedAt')
ORDER BY c.name;

-- Check new tables exist
SELECT name AS TableName FROM sys.tables WHERE name IN ('UserBankDetails', 'KycDocuments', 'KycStatusHistory');

GO

PRINT '';
PRINT 'Script completed successfully!';

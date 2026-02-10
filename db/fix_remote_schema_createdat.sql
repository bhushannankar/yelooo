-- Run this on the REMOTE database to add missing columns that cause
-- "Invalid column name 'CreatedAt'" when calling GetProfile (UserProfile API).
-- Safe to run multiple times. Only alters tables that exist; skips missing tables.

-- KycDocuments: add CreatedAt/UpdatedAt only if the table exists.
IF OBJECT_ID(N'dbo.KycDocuments', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.KycDocuments') AND name = 'CreatedAt')
        ALTER TABLE dbo.KycDocuments ADD CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE();
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.KycDocuments') AND name = 'UpdatedAt')
        ALTER TABLE dbo.KycDocuments ADD UpdatedAt DATETIME NOT NULL DEFAULT GETUTCDATE();
END
ELSE
    PRINT 'Skipped KycDocuments (table does not exist).';

-- Users: ensure CreatedAt exists (in case remote was created from an older script).
IF OBJECT_ID(N'dbo.Users', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = 'CreatedAt')
    BEGIN
        ALTER TABLE dbo.Users ADD CreatedAt DATETIME NULL;
        UPDATE dbo.Users SET CreatedAt = GETUTCDATE() WHERE CreatedAt IS NULL;
        ALTER TABLE dbo.Users ALTER COLUMN CreatedAt DATETIME NOT NULL;
    END
END
ELSE
    PRINT 'Skipped Users (table does not exist).';

-- UserBankDetails: ensure CreatedAt/UpdatedAt exist.
IF OBJECT_ID(N'dbo.UserBankDetails', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.UserBankDetails') AND name = 'CreatedAt')
        ALTER TABLE dbo.UserBankDetails ADD CreatedAt DATETIME NOT NULL DEFAULT GETDATE();
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.UserBankDetails') AND name = 'UpdatedAt')
        ALTER TABLE dbo.UserBankDetails ADD UpdatedAt DATETIME NOT NULL DEFAULT GETDATE();
END
ELSE
    PRINT 'Skipped UserBankDetails (table does not exist).';

PRINT 'Schema fix for CreatedAt/UpdatedAt completed.';

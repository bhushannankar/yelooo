-- =====================================================
-- Database Script: Additional Profile Fields
-- Description: Adds more optional profile fields to Users table
-- =====================================================

USE ECommerceDB;
GO

-- =====================================================
-- Add First Name, Middle Name, Last Name
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'FirstName')
BEGIN
    ALTER TABLE Users ADD FirstName NVARCHAR(100) NULL;
    PRINT 'Added FirstName column to Users table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'MiddleName')
BEGIN
    ALTER TABLE Users ADD MiddleName NVARCHAR(100) NULL;
    PRINT 'Added MiddleName column to Users table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'LastName')
BEGIN
    ALTER TABLE Users ADD LastName NVARCHAR(100) NULL;
    PRINT 'Added LastName column to Users table';
END
GO

-- =====================================================
-- Add Gender
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'Gender')
BEGIN
    ALTER TABLE Users ADD Gender NVARCHAR(20) NULL; -- Male, Female, Other, Prefer not to say
    PRINT 'Added Gender column to Users table';
END
GO

-- =====================================================
-- Add Alternate Phone Number
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'AlternatePhoneNumber')
BEGIN
    ALTER TABLE Users ADD AlternatePhoneNumber NVARCHAR(20) NULL;
    PRINT 'Added AlternatePhoneNumber column to Users table';
END
GO

-- =====================================================
-- Add Address Line 2 and Landmark
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'AddressLine2')
BEGIN
    ALTER TABLE Users ADD AddressLine2 NVARCHAR(500) NULL;
    PRINT 'Added AddressLine2 column to Users table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'Landmark')
BEGIN
    ALTER TABLE Users ADD Landmark NVARCHAR(200) NULL;
    PRINT 'Added Landmark column to Users table';
END
GO

-- =====================================================
-- Add Country
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'Country')
BEGIN
    ALTER TABLE Users ADD Country NVARCHAR(100) NULL DEFAULT 'India';
    PRINT 'Added Country column to Users table';
END
GO

-- =====================================================
-- Verify the schema
-- =====================================================

PRINT '';
PRINT '========== Profile Fields Verification ==========';

SELECT 
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable
FROM sys.columns c
JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('Users')
AND c.name IN ('FirstName', 'MiddleName', 'LastName', 'Gender', 'AlternatePhoneNumber', 'AddressLine2', 'Landmark', 'Country')
ORDER BY c.name;

GO

PRINT '';
PRINT 'Script completed successfully!';

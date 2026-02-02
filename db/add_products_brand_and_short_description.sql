-- Add BrandName and ShortDescription columns to Products table.
-- Run this if you get: Invalid column name 'BrandName' / 'ShortDescription'

USE ECommerceDB;
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'BrandName')
BEGIN
    ALTER TABLE Products ADD BrandName NVARCHAR(200) NULL;
    PRINT 'BrandName column added to Products.';
END
ELSE
    PRINT 'BrandName already exists.';

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'ShortDescription')
BEGIN
    ALTER TABLE Products ADD ShortDescription NVARCHAR(500) NULL;
    PRINT 'ShortDescription column added to Products.';
END
ELSE
    PRINT 'ShortDescription already exists.';

GO
PRINT 'Done.';

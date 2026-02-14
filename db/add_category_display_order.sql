-- Add DisplayOrder column to Categories for admin-controlled sequence in header/nav
-- Run against existing ECommerceDB. If Categories table does not exist yet, run prod_ECommerceDB_full.sql first.

SET NOCOUNT ON;
GO

USE ECommerceDB;
GO

IF OBJECT_ID('dbo.Categories', 'U') IS NULL
BEGIN
    PRINT 'Table dbo.Categories does not exist. Create the schema first (e.g. run prod_ECommerceDB_full.sql), then run this script.';
END
ELSE IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Categories') AND name = 'DisplayOrder'
)
BEGIN
    ALTER TABLE dbo.Categories ADD DisplayOrder INT NOT NULL DEFAULT 0;
    UPDATE dbo.Categories SET DisplayOrder = CategoryId;
    PRINT 'Added DisplayOrder to Categories and backfilled.';
END
ELSE
    PRINT 'DisplayOrder already exists on Categories.';
GO

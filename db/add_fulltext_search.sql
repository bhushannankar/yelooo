-- =============================================
-- Full-Text Search Setup for Products
-- =============================================
-- This script creates full-text search indexes for better product search performance
-- Run this script if you have a large product catalog and want faster search

-- NOTE: Full-text search requires SQL Server Full-Text Search component to be installed
-- The basic LIKE search will work without this, but will be slower for large datasets

USE [Yelooo];
GO

-- Check if Full-Text Catalog exists, create if not
IF NOT EXISTS (SELECT * FROM sys.fulltext_catalogs WHERE name = 'ProductSearchCatalog')
BEGIN
    CREATE FULLTEXT CATALOG ProductSearchCatalog AS DEFAULT;
    PRINT 'Created Full-Text Catalog: ProductSearchCatalog';
END
ELSE
BEGIN
    PRINT 'Full-Text Catalog already exists';
END
GO

-- Check if Products table has a primary key (required for full-text index)
IF EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('Products') AND is_primary_key = 1)
BEGIN
    -- Check if full-text index already exists on Products
    IF NOT EXISTS (SELECT * FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID('Products'))
    BEGIN
        -- Create full-text index on Products table
        CREATE FULLTEXT INDEX ON Products
        (
            ProductName LANGUAGE 1033,           -- English
            Description LANGUAGE 1033,
            BrandName LANGUAGE 1033,
            ShortDescription LANGUAGE 1033
        )
        KEY INDEX PK_Products                    -- Primary key index name
        ON ProductSearchCatalog
        WITH STOPLIST = SYSTEM, CHANGE_TRACKING AUTO;
        
        PRINT 'Created Full-Text Index on Products table';
    END
    ELSE
    BEGIN
        PRINT 'Full-Text Index already exists on Products table';
    END
END
ELSE
BEGIN
    PRINT 'ERROR: Products table must have a primary key to create full-text index';
END
GO

-- Optional: Create full-text index on Categories for category search
IF EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('Categories') AND is_primary_key = 1)
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID('Categories'))
    BEGIN
        CREATE FULLTEXT INDEX ON Categories
        (
            CategoryName LANGUAGE 1033
        )
        KEY INDEX PK_Categories
        ON ProductSearchCatalog
        WITH STOPLIST = SYSTEM, CHANGE_TRACKING AUTO;
        
        PRINT 'Created Full-Text Index on Categories table';
    END
END
GO

-- Optional: Create full-text index on SubCategories
IF EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('SubCategories') AND is_primary_key = 1)
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID('SubCategories'))
    BEGIN
        CREATE FULLTEXT INDEX ON SubCategories
        (
            SubCategoryName LANGUAGE 1033
        )
        KEY INDEX PK_SubCategories
        ON ProductSearchCatalog
        WITH STOPLIST = SYSTEM, CHANGE_TRACKING AUTO;
        
        PRINT 'Created Full-Text Index on SubCategories table';
    END
END
GO

PRINT '';
PRINT '=============================================';
PRINT 'Full-Text Search setup completed!';
PRINT '=============================================';
PRINT '';
PRINT 'Note: Full-text indexes are OPTIONAL for the search feature.';
PRINT 'The basic LIKE search works without them but may be slower';
PRINT 'for large product catalogs (10,000+ products).';
PRINT '';
PRINT 'If you see errors about Full-Text Search not being installed,';
PRINT 'you can safely ignore this script - the search will still work.';
GO

-- =============================================
-- Add soft delete columns to Products table
-- =============================================

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'IsDeleted')
BEGIN
    ALTER TABLE Products ADD IsDeleted BIT NOT NULL DEFAULT 0;
    PRINT 'Added IsDeleted column to Products table';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'DeletedAt')
BEGIN
    ALTER TABLE Products ADD DeletedAt DATETIME2 NULL;
    PRINT 'Added DeletedAt column to Products table';
END
GO

PRINT 'Product soft delete setup completed.';

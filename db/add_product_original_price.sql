-- Add OriginalPrice (MRP) to Products for discount display
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'OriginalPrice')
BEGIN
    ALTER TABLE Products ADD OriginalPrice DECIMAL(10, 2) NULL;
    PRINT 'Added OriginalPrice column to Products table';
END
GO

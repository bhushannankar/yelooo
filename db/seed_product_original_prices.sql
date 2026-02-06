-- Set OriginalPrice (MRP) for products that don't have it, so discount shows on home page.
-- Uses 25% above current price as MRP (shows ~20% off). Run after add_product_original_price.sql.

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'OriginalPrice')
BEGIN
    PRINT 'Run add_product_original_price.sql first to add OriginalPrice column.';
END
ELSE
BEGIN
    UPDATE Products
    SET OriginalPrice = ROUND(Price * 1.25, 2)
    WHERE (OriginalPrice IS NULL OR OriginalPrice <= 0 OR OriginalPrice <= Price)
      AND IsDeleted = 0;

    PRINT CONCAT('Updated ', @@ROWCOUNT, ' product(s) with OriginalPrice for discount display.');
END
GO

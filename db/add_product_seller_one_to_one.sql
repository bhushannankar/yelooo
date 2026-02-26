-- Enforce one-to-one: one product can have only one seller.
-- Run this after add_product_sellers_table.sql.
-- If you have multiple sellers per product, we keep one per product (lowest ProductSellerId) and drop the rest.

USE ECommerceDB;
GO

-- 1) Remove duplicate ProductSellers: keep one row per ProductId (the one with smallest ProductSellerId)
;WITH Ranked AS (
    SELECT ProductSellerId, ProductId,
           ROW_NUMBER() OVER (PARTITION BY ProductId ORDER BY ProductSellerId) AS rn
    FROM ProductSellers
)
DELETE FROM ProductSellers
WHERE ProductSellerId IN (SELECT ProductSellerId FROM Ranked WHERE rn > 1);

PRINT 'Duplicate product-seller rows removed (one seller per product kept).';

-- 2) Create unique index on ProductId so each product can have at most one seller
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ProductSellers_ProductId_Unique' AND object_id = OBJECT_ID('ProductSellers'))
BEGIN
    CREATE UNIQUE INDEX IX_ProductSellers_ProductId_Unique ON ProductSellers(ProductId);
    PRINT 'Unique index IX_ProductSellers_ProductId_Unique created.';
END
ELSE
    PRINT 'Unique index on ProductId already exists.';

GO

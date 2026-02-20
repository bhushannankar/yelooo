-- Add Price, OriginalPrice, and ProductSellerId to CartItems so selected seller's price and seller are stored
-- Run if your CartItems table was created before this change

USE ECommerceDB;
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CartItems' AND COLUMN_NAME = 'Price')
BEGIN
    ALTER TABLE CartItems ADD Price DECIMAL(18,2) NULL;
    PRINT 'CartItems.Price column added.';
END
ELSE
    PRINT 'CartItems.Price already exists.';
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CartItems' AND COLUMN_NAME = 'OriginalPrice')
BEGIN
    ALTER TABLE CartItems ADD OriginalPrice DECIMAL(18,2) NULL;
    PRINT 'CartItems.OriginalPrice column added.';
END
ELSE
    PRINT 'CartItems.OriginalPrice already exists.';
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CartItems' AND COLUMN_NAME = 'ProductSellerId')
BEGIN
    ALTER TABLE CartItems ADD ProductSellerId INT NULL;
    PRINT 'CartItems.ProductSellerId column added.';
END
ELSE
    PRINT 'CartItems.ProductSellerId already exists.';
GO

-- Add ProductSellers Table for Seller-Product Relationship
-- This enables multiple sellers to sell the same product with different prices and delivery options
-- Run this script to create the ProductSellers table

USE ECommerceDB;
GO

-- ProductSellers table - links products to sellers with seller-specific details
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ProductSellers')
BEGIN
    CREATE TABLE ProductSellers (
        ProductSellerId INT PRIMARY KEY IDENTITY(1,1),
        ProductId INT NOT NULL,
        SellerId INT NOT NULL,
        SellerPrice DECIMAL(10, 2) NOT NULL,
        DeliveryDays INT NOT NULL DEFAULT 5,
        DeliveryCharge DECIMAL(10, 2) NOT NULL DEFAULT 0,
        SellerAddress NVARCHAR(500) NULL,
        StockQuantity INT NOT NULL DEFAULT 0,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT FK_ProductSellers_Products FOREIGN KEY (ProductId) REFERENCES Products(ProductId) ON DELETE CASCADE,
        CONSTRAINT FK_ProductSellers_Sellers FOREIGN KEY (SellerId) REFERENCES Users(UserId) ON DELETE NO ACTION,
        CONSTRAINT UQ_ProductSellers_Product_Seller UNIQUE (ProductId, SellerId)
    );

    CREATE INDEX IX_ProductSellers_ProductId ON ProductSellers(ProductId);
    CREATE INDEX IX_ProductSellers_SellerId ON ProductSellers(SellerId);
    
    PRINT 'ProductSellers table created successfully.';
END
ELSE
BEGIN
    PRINT 'ProductSellers table already exists.';
END
GO

-- Add sample data for existing products (optional - assign to existing sellers)
-- Uncomment and modify the following if you have sellers and want to add sample data

/*
-- Get seller IDs (assuming sellers exist)
DECLARE @Seller1 INT = (SELECT TOP 1 UserId FROM Users WHERE RoleId = 2 ORDER BY UserId);
DECLARE @Seller2 INT = (SELECT TOP 1 UserId FROM Users WHERE RoleId = 2 AND UserId > @Seller1 ORDER BY UserId);

-- If we have at least one seller, add some sample product-seller relationships
IF @Seller1 IS NOT NULL
BEGIN
    -- Add first seller to first 5 products
    INSERT INTO ProductSellers (ProductId, SellerId, SellerPrice, DeliveryDays, DeliveryCharge, SellerAddress, StockQuantity)
    SELECT TOP 5 
        ProductId, 
        @Seller1, 
        Price, 
        3, 
        0, 
        'Mumbai, Maharashtra, India',
        50
    FROM Products 
    WHERE NOT EXISTS (SELECT 1 FROM ProductSellers WHERE ProductSellers.ProductId = Products.ProductId AND ProductSellers.SellerId = @Seller1);
    
    PRINT 'Sample data added for Seller 1.';
END

IF @Seller2 IS NOT NULL
BEGIN
    -- Add second seller to first 3 products with different prices
    INSERT INTO ProductSellers (ProductId, SellerId, SellerPrice, DeliveryDays, DeliveryCharge, SellerAddress, StockQuantity)
    SELECT TOP 3 
        ProductId, 
        @Seller2, 
        Price * 0.95, -- 5% cheaper
        5, 
        50, -- ₹50 delivery charge
        'Delhi, India',
        30
    FROM Products 
    WHERE NOT EXISTS (SELECT 1 FROM ProductSellers WHERE ProductSellers.ProductId = Products.ProductId AND ProductSellers.SellerId = @Seller2);
    
    PRINT 'Sample data added for Seller 2.';
END
*/

PRINT 'ProductSellers table setup complete.';
GO

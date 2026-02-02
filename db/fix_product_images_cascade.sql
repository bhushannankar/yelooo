-- Run this ONLY if you already ran add_product_variants_and_detail_tables.sql
-- and got the cascade error. Colors, Sizes, ProductVariants already exist.
-- This creates ProductImages and ProductSpecifications and seeds them.

USE ECommerceDB;
GO

-- Add BrandName and ShortDescription to Products if missing
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'BrandName')
BEGIN
    ALTER TABLE Products ADD BrandName NVARCHAR(200) NULL;
    PRINT 'Products.BrandName added.';
END
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'ShortDescription')
BEGIN
    ALTER TABLE Products ADD ShortDescription NVARCHAR(500) NULL;
    PRINT 'Products.ShortDescription added.';
END
GO

-- Create ProductImages with ON DELETE NO ACTION to avoid cascade cycle
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductImages')
BEGIN
    CREATE TABLE ProductImages (
        ImageId INT PRIMARY KEY IDENTITY(1,1),
        ProductId INT NOT NULL,
        VariantId INT NULL,
        ImageUrl NVARCHAR(500) NOT NULL,
        IsMain BIT NOT NULL DEFAULT 0,
        DisplayOrder INT NOT NULL DEFAULT 0,
        FOREIGN KEY (ProductId) REFERENCES Products(ProductId) ON DELETE CASCADE,
        FOREIGN KEY (VariantId) REFERENCES ProductVariants(VariantId) ON DELETE NO ACTION
    );
    CREATE INDEX IX_ProductImages_ProductId ON ProductImages(ProductId);
    CREATE INDEX IX_ProductImages_VariantId ON ProductImages(VariantId);
    PRINT 'ProductImages table created.';
END
GO

-- Create ProductSpecifications if missing
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductSpecifications')
BEGIN
    CREATE TABLE ProductSpecifications (
        SpecId INT PRIMARY KEY IDENTITY(1,1),
        ProductId INT NOT NULL,
        AttributeName NVARCHAR(200) NOT NULL,
        AttributeValue NVARCHAR(500) NOT NULL,
        DisplayOrder INT NOT NULL DEFAULT 0,
        FOREIGN KEY (ProductId) REFERENCES Products(ProductId) ON DELETE CASCADE
    );
    CREATE INDEX IX_ProductSpecifications_ProductId ON ProductSpecifications(ProductId);
    PRINT 'ProductSpecifications table created.';
END
GO

-- Seed ProductImages for product 3 (skip if already seeded)
IF NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = 3)
BEGIN
    INSERT INTO ProductImages (ProductId, VariantId, ImageUrl, IsMain, DisplayOrder) VALUES
    (3, NULL, '/images/jeans1.jpg', 1, 0),
    (3, NULL, '/images/jeans2.jpg', 0, 1),
    (3, NULL, '/images/jeans3.jpg', 0, 2);
    PRINT 'ProductImages seeded for product 3.';
END
GO

-- Seed ProductSpecifications for product 3 (skip if already seeded)
IF NOT EXISTS (SELECT 1 FROM ProductSpecifications WHERE ProductId = 3)
BEGIN
    INSERT INTO ProductSpecifications (ProductId, AttributeName, AttributeValue, DisplayOrder) VALUES
    (3, 'Material type', 'Cotton', 0),
    (3, 'Length', 'Standard Length', 1),
    (3, 'Style', 'Slim Fit', 2),
    (3, 'Closure type', 'Button', 3),
    (3, 'Care instructions', 'Machine Wash', 4);
    PRINT 'ProductSpecifications seeded for product 3.';
END
GO

PRINT 'Fix complete.';

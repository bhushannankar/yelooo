-- Product detail: Colors, Sizes, Variants, Images, Specifications
-- Run after base schema (Products, etc.) exists.

USE ECommerceDB;
GO

-- Colors lookup
CREATE TABLE Colors (
    ColorId INT PRIMARY KEY IDENTITY(1,1),
    ColorName NVARCHAR(100) NOT NULL UNIQUE,
    HexCode NVARCHAR(7) NULL
);

-- Sizes lookup (e.g. Waist 28, 30; Shoe 42; S/M/L)
CREATE TABLE Sizes (
    SizeId INT PRIMARY KEY IDENTITY(1,1),
    SizeName NVARCHAR(50) NOT NULL,
    SizeCategory NVARCHAR(50) NULL  -- e.g. 'Waist', 'Length', 'General'
);

-- Product variants: color + size per product, with price and stock
CREATE TABLE ProductVariants (
    VariantId INT PRIMARY KEY IDENTITY(1,1),
    ProductId INT NOT NULL,
    ColorId INT NULL,
    SizeId INT NULL,
    SKU NVARCHAR(100) NULL UNIQUE,
    Price DECIMAL(10, 2) NOT NULL,
    OriginalPrice DECIMAL(10, 2) NULL,
    Stock INT NOT NULL DEFAULT 0,
    IsAvailable BIT NOT NULL DEFAULT 1,
    FOREIGN KEY (ProductId) REFERENCES Products(ProductId) ON DELETE CASCADE,
    FOREIGN KEY (ColorId) REFERENCES Colors(ColorId),
    FOREIGN KEY (SizeId) REFERENCES Sizes(SizeId)
);

CREATE INDEX IX_ProductVariants_ProductId ON ProductVariants(ProductId);

-- Multiple images per product (optionally per variant)
-- Use ON DELETE NO ACTION on VariantId to avoid multiple cascade paths (Product -> ProductImages and Product -> ProductVariants -> ProductImages)
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

-- Product specifications (Material type, Length, Style, etc.)
CREATE TABLE ProductSpecifications (
    SpecId INT PRIMARY KEY IDENTITY(1,1),
    ProductId INT NOT NULL,
    AttributeName NVARCHAR(200) NOT NULL,
    AttributeValue NVARCHAR(500) NOT NULL,
    DisplayOrder INT NOT NULL DEFAULT 0,
    FOREIGN KEY (ProductId) REFERENCES Products(ProductId) ON DELETE CASCADE
);

CREATE INDEX IX_ProductSpecifications_ProductId ON ProductSpecifications(ProductId);

-- Optional: Brand name on product (if not already present)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'BrandName')
BEGIN
    ALTER TABLE Products ADD BrandName NVARCHAR(200) NULL;
END
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'ShortDescription')
BEGIN
    ALTER TABLE Products ADD ShortDescription NVARCHAR(500) NULL;
END

GO

-- Seed Colors and Sizes
INSERT INTO Colors (ColorName, HexCode) VALUES
('Black', '#000000'),
('White', '#FFFFFF'),
('Blue', '#0000FF'),
('Navy', '#000080'),
('Lt Vintage blue', '#5B7C99'),
('Grey', '#808080'),
('Red', '#FF0000'),
('Green', '#008000');

INSERT INTO Sizes (SizeName, SizeCategory) VALUES
('28', 'Waist'), ('30', 'Waist'), ('32', 'Waist'), ('34', 'Waist'),
('36', 'Waist'), ('38', 'Waist'), ('40', 'Waist'), ('42', 'Waist'),
('S', 'General'), ('M', 'General'), ('L', 'General'), ('XL', 'General');

GO

-- Example: Add variants and images for ProductId 3 (Men's Jeans)
DECLARE @Pid INT = 3;
DECLARE @VariantId INT;

INSERT INTO ProductVariants (ProductId, ColorId, SizeId, SKU, Price, OriginalPrice, Stock, IsAvailable)
SELECT @Pid, c.ColorId, s.SizeId, 'JEANS-' + c.ColorName + '-' + s.SizeName, 49.99, 99.99, 10, 1
FROM Colors c
CROSS JOIN Sizes s
WHERE s.SizeCategory = 'Waist' AND s.SizeId <= 6
AND c.ColorId IN (SELECT TOP 3 ColorId FROM Colors);

-- Add product-level images (no variant) for product 3
INSERT INTO ProductImages (ProductId, VariantId, ImageUrl, IsMain, DisplayOrder) VALUES
(@Pid, NULL, '/images/jeans1.jpg', 1, 0),
(@Pid, NULL, '/images/jeans2.jpg', 0, 1),
(@Pid, NULL, '/images/jeans3.jpg', 0, 2);

-- Add specifications for product 3
INSERT INTO ProductSpecifications (ProductId, AttributeName, AttributeValue, DisplayOrder) VALUES
(@Pid, 'Material type', 'Cotton', 0),
(@Pid, 'Length', 'Standard Length', 1),
(@Pid, 'Style', 'Slim Fit', 2),
(@Pid, 'Closure type', 'Button', 3),
(@Pid, 'Care instructions', 'Machine Wash', 4);

GO

PRINT 'Product variants, images, and specifications tables created and seeded.';

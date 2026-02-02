-- =====================================================
-- Database Script: Tertiary and Quaternary Categories
-- Description: Adds multi-level category support
-- Structure: Category → SubCategory → TertiaryCategory → QuaternaryCategory
-- =====================================================

USE ECommerceDB;
GO

-- =====================================================
-- Step 1: Create TertiaryCategories Table
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TertiaryCategories')
BEGIN
    CREATE TABLE TertiaryCategories (
        TertiaryCategoryId INT PRIMARY KEY IDENTITY(1,1),
        TertiaryCategoryName NVARCHAR(100) NOT NULL,
        SubCategoryId INT NOT NULL,
        ImageUrl NVARCHAR(500) NULL,
        Description NVARCHAR(500) NULL,
        FOREIGN KEY (SubCategoryId) REFERENCES SubCategories(SubCategoryId)
    );
    PRINT 'Created table: TertiaryCategories';
END
ELSE
BEGIN
    PRINT 'Table TertiaryCategories already exists';
END
GO

-- =====================================================
-- Step 2: Create QuaternaryCategories Table
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'QuaternaryCategories')
BEGIN
    CREATE TABLE QuaternaryCategories (
        QuaternaryCategoryId INT PRIMARY KEY IDENTITY(1,1),
        QuaternaryCategoryName NVARCHAR(100) NOT NULL,
        TertiaryCategoryId INT NOT NULL,
        ImageUrl NVARCHAR(500) NULL,
        Description NVARCHAR(500) NULL,
        FOREIGN KEY (TertiaryCategoryId) REFERENCES TertiaryCategories(TertiaryCategoryId)
    );
    PRINT 'Created table: QuaternaryCategories';
END
ELSE
BEGIN
    PRINT 'Table QuaternaryCategories already exists';
END
GO

-- =====================================================
-- Step 3: Insert Water Purifier Tertiary Categories
-- =====================================================

-- First, get the Water Purifier SubCategoryId
DECLARE @WaterPurifierSubCategoryId INT;
SELECT @WaterPurifierSubCategoryId = SubCategoryId 
FROM SubCategories 
WHERE SubCategoryName = 'Water Purifier';

-- If Water Purifier doesn't exist, create it
IF @WaterPurifierSubCategoryId IS NULL
BEGIN
    DECLARE @HomeAppliancesCategoryId INT;
    SELECT @HomeAppliancesCategoryId = CategoryId FROM Categories WHERE CategoryName = 'Home Appliances';
    
    IF @HomeAppliancesCategoryId IS NOT NULL
    BEGIN
        INSERT INTO SubCategories (SubCategoryName, CategoryId) VALUES ('Water Purifier', @HomeAppliancesCategoryId);
        SELECT @WaterPurifierSubCategoryId = SCOPE_IDENTITY();
        PRINT 'Inserted SubCategory: Water Purifier';
    END
END

-- Insert Tertiary Categories for Water Purifier
IF @WaterPurifierSubCategoryId IS NOT NULL
BEGIN
    -- Domestic
    IF NOT EXISTS (SELECT 1 FROM TertiaryCategories WHERE TertiaryCategoryName = 'Domestic' AND SubCategoryId = @WaterPurifierSubCategoryId)
    BEGIN
        INSERT INTO TertiaryCategories (TertiaryCategoryName, SubCategoryId, ImageUrl, Description) 
        VALUES ('Domestic', @WaterPurifierSubCategoryId, '/images/categories/domestic-water-purifier.jpg', 'Water purifiers for home use');
        PRINT 'Inserted Tertiary Category: Domestic';
    END

    -- Commercial
    IF NOT EXISTS (SELECT 1 FROM TertiaryCategories WHERE TertiaryCategoryName = 'Commercial' AND SubCategoryId = @WaterPurifierSubCategoryId)
    BEGIN
        INSERT INTO TertiaryCategories (TertiaryCategoryName, SubCategoryId, ImageUrl, Description) 
        VALUES ('Commercial', @WaterPurifierSubCategoryId, '/images/categories/commercial-water-purifier.jpg', 'Water purifiers for offices and businesses');
        PRINT 'Inserted Tertiary Category: Commercial';
    END

    -- Industrial
    IF NOT EXISTS (SELECT 1 FROM TertiaryCategories WHERE TertiaryCategoryName = 'Industrial' AND SubCategoryId = @WaterPurifierSubCategoryId)
    BEGIN
        INSERT INTO TertiaryCategories (TertiaryCategoryName, SubCategoryId, ImageUrl, Description) 
        VALUES ('Industrial', @WaterPurifierSubCategoryId, '/images/categories/industrial-water-purifier.jpg', 'Large scale water purification systems');
        PRINT 'Inserted Tertiary Category: Industrial';
    END
END
GO

-- =====================================================
-- Step 4: Insert Quaternary Categories under Domestic
-- =====================================================

DECLARE @DomesticTertiaryCategoryId INT;
SELECT @DomesticTertiaryCategoryId = TertiaryCategoryId 
FROM TertiaryCategories 
WHERE TertiaryCategoryName = 'Domestic';

IF @DomesticTertiaryCategoryId IS NOT NULL
BEGIN
    -- Premium
    IF NOT EXISTS (SELECT 1 FROM QuaternaryCategories WHERE QuaternaryCategoryName = 'Premium' AND TertiaryCategoryId = @DomesticTertiaryCategoryId)
    BEGIN
        INSERT INTO QuaternaryCategories (QuaternaryCategoryName, TertiaryCategoryId, ImageUrl, Description) 
        VALUES ('Premium', @DomesticTertiaryCategoryId, '/images/categories/premium-water-purifier.jpg', 'High-end water purifiers with advanced features');
        PRINT 'Inserted Quaternary Category: Premium';
    END

    -- Regular
    IF NOT EXISTS (SELECT 1 FROM QuaternaryCategories WHERE QuaternaryCategoryName = 'Regular' AND TertiaryCategoryId = @DomesticTertiaryCategoryId)
    BEGIN
        INSERT INTO QuaternaryCategories (QuaternaryCategoryName, TertiaryCategoryId, ImageUrl, Description) 
        VALUES ('Regular', @DomesticTertiaryCategoryId, '/images/categories/regular-water-purifier.jpg', 'Standard water purifiers for everyday use');
        PRINT 'Inserted Quaternary Category: Regular';
    END
END
GO

-- =====================================================
-- Step 5: Verify the data
-- =====================================================

PRINT '';
PRINT '========== Category Hierarchy Summary ==========';
PRINT '';

SELECT 
    c.CategoryName AS [Category],
    s.SubCategoryName AS [SubCategory],
    t.TertiaryCategoryName AS [TertiaryCategory],
    q.QuaternaryCategoryName AS [QuaternaryCategory]
FROM Categories c
LEFT JOIN SubCategories s ON c.CategoryId = s.CategoryId
LEFT JOIN TertiaryCategories t ON s.SubCategoryId = t.SubCategoryId
LEFT JOIN QuaternaryCategories q ON t.TertiaryCategoryId = q.TertiaryCategoryId
WHERE c.CategoryName = 'Home Appliances'
ORDER BY c.CategoryName, s.SubCategoryName, t.TertiaryCategoryName, q.QuaternaryCategoryName;

GO

PRINT '';
PRINT 'Script completed successfully!';

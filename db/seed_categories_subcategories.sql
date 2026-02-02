-- =====================================================
-- Database Script: Categories and SubCategories Setup
-- Description: Seeds the database with category navigation structure
-- Categories: Home Appliances, Clothes, Grocery
-- =====================================================

USE ECommerceDB;
GO

-- =====================================================
-- Step 1: Clear existing data (optional - uncomment if needed)
-- =====================================================
-- WARNING: Only use if you want to reset categories completely
-- This will delete products first due to foreign key constraints

-- DELETE FROM Products;
-- DELETE FROM SubCategories;
-- DELETE FROM Categories;

-- =====================================================
-- Step 2: Insert/Update Categories
-- =====================================================

-- Insert Categories if they don't exist
IF NOT EXISTS (SELECT 1 FROM Categories WHERE CategoryName = 'Home Appliances')
BEGIN
    INSERT INTO Categories (CategoryName) VALUES ('Home Appliances');
    PRINT 'Inserted Category: Home Appliances';
END
ELSE
BEGIN
    PRINT 'Category already exists: Home Appliances';
END

IF NOT EXISTS (SELECT 1 FROM Categories WHERE CategoryName = 'Clothes')
BEGIN
    INSERT INTO Categories (CategoryName) VALUES ('Clothes');
    PRINT 'Inserted Category: Clothes';
END
ELSE
BEGIN
    PRINT 'Category already exists: Clothes';
END

IF NOT EXISTS (SELECT 1 FROM Categories WHERE CategoryName = 'Grocery')
BEGIN
    INSERT INTO Categories (CategoryName) VALUES ('Grocery');
    PRINT 'Inserted Category: Grocery';
END
ELSE
BEGIN
    PRINT 'Category already exists: Grocery';
END

GO

-- =====================================================
-- Step 3: Insert/Update SubCategories
-- =====================================================

-- Home Appliances SubCategories
DECLARE @HomeAppliancesCategoryId INT;
SELECT @HomeAppliancesCategoryId = CategoryId FROM Categories WHERE CategoryName = 'Home Appliances';

IF @HomeAppliancesCategoryId IS NOT NULL
BEGIN
    -- Water Purifier
    IF NOT EXISTS (SELECT 1 FROM SubCategories WHERE SubCategoryName = 'Water Purifier' AND CategoryId = @HomeAppliancesCategoryId)
    BEGIN
        INSERT INTO SubCategories (SubCategoryName, CategoryId) VALUES ('Water Purifier', @HomeAppliancesCategoryId);
        PRINT 'Inserted SubCategory: Water Purifier under Home Appliances';
    END
    
    -- Additional Home Appliances SubCategories (optional)
    IF NOT EXISTS (SELECT 1 FROM SubCategories WHERE SubCategoryName = 'Kitchen Appliances' AND CategoryId = @HomeAppliancesCategoryId)
    BEGIN
        INSERT INTO SubCategories (SubCategoryName, CategoryId) VALUES ('Kitchen Appliances', @HomeAppliancesCategoryId);
        PRINT 'Inserted SubCategory: Kitchen Appliances under Home Appliances';
    END
    
    IF NOT EXISTS (SELECT 1 FROM SubCategories WHERE SubCategoryName = 'Air Conditioners' AND CategoryId = @HomeAppliancesCategoryId)
    BEGIN
        INSERT INTO SubCategories (SubCategoryName, CategoryId) VALUES ('Air Conditioners', @HomeAppliancesCategoryId);
        PRINT 'Inserted SubCategory: Air Conditioners under Home Appliances';
    END
    
    IF NOT EXISTS (SELECT 1 FROM SubCategories WHERE SubCategoryName = 'Washing Machines' AND CategoryId = @HomeAppliancesCategoryId)
    BEGIN
        INSERT INTO SubCategories (SubCategoryName, CategoryId) VALUES ('Washing Machines', @HomeAppliancesCategoryId);
        PRINT 'Inserted SubCategory: Washing Machines under Home Appliances';
    END
END

GO

-- Clothes SubCategories
DECLARE @ClothesCategoryId INT;
SELECT @ClothesCategoryId = CategoryId FROM Categories WHERE CategoryName = 'Clothes';

IF @ClothesCategoryId IS NOT NULL
BEGIN
    -- Mens
    IF NOT EXISTS (SELECT 1 FROM SubCategories WHERE SubCategoryName = 'Mens' AND CategoryId = @ClothesCategoryId)
    BEGIN
        INSERT INTO SubCategories (SubCategoryName, CategoryId) VALUES ('Mens', @ClothesCategoryId);
        PRINT 'Inserted SubCategory: Mens under Clothes';
    END
    
    -- Womens
    IF NOT EXISTS (SELECT 1 FROM SubCategories WHERE SubCategoryName = 'Womens' AND CategoryId = @ClothesCategoryId)
    BEGIN
        INSERT INTO SubCategories (SubCategoryName, CategoryId) VALUES ('Womens', @ClothesCategoryId);
        PRINT 'Inserted SubCategory: Womens under Clothes';
    END
    
    -- Kids
    IF NOT EXISTS (SELECT 1 FROM SubCategories WHERE SubCategoryName = 'Kids' AND CategoryId = @ClothesCategoryId)
    BEGIN
        INSERT INTO SubCategories (SubCategoryName, CategoryId) VALUES ('Kids', @ClothesCategoryId);
        PRINT 'Inserted SubCategory: Kids under Clothes';
    END
END

GO

-- Grocery SubCategories
DECLARE @GroceryCategoryId INT;
SELECT @GroceryCategoryId = CategoryId FROM Categories WHERE CategoryName = 'Grocery';

IF @GroceryCategoryId IS NOT NULL
BEGIN
    -- Fresh Produce
    IF NOT EXISTS (SELECT 1 FROM SubCategories WHERE SubCategoryName = 'Fresh Produce' AND CategoryId = @GroceryCategoryId)
    BEGIN
        INSERT INTO SubCategories (SubCategoryName, CategoryId) VALUES ('Fresh Produce', @GroceryCategoryId);
        PRINT 'Inserted SubCategory: Fresh Produce under Grocery';
    END
    
    -- Dairy & Eggs
    IF NOT EXISTS (SELECT 1 FROM SubCategories WHERE SubCategoryName = 'Dairy & Eggs' AND CategoryId = @GroceryCategoryId)
    BEGIN
        INSERT INTO SubCategories (SubCategoryName, CategoryId) VALUES ('Dairy & Eggs', @GroceryCategoryId);
        PRINT 'Inserted SubCategory: Dairy & Eggs under Grocery';
    END
    
    -- Beverages
    IF NOT EXISTS (SELECT 1 FROM SubCategories WHERE SubCategoryName = 'Beverages' AND CategoryId = @GroceryCategoryId)
    BEGIN
        INSERT INTO SubCategories (SubCategoryName, CategoryId) VALUES ('Beverages', @GroceryCategoryId);
        PRINT 'Inserted SubCategory: Beverages under Grocery';
    END
END

GO

-- =====================================================
-- Step 4: Verify the data
-- =====================================================

PRINT '';
PRINT '========== Categories and SubCategories Summary ==========';
PRINT '';

SELECT 
    c.CategoryId,
    c.CategoryName,
    s.SubCategoryId,
    s.SubCategoryName
FROM Categories c
LEFT JOIN SubCategories s ON c.CategoryId = s.CategoryId
ORDER BY c.CategoryId, s.SubCategoryId;

GO

PRINT '';
PRINT 'Script completed successfully!';

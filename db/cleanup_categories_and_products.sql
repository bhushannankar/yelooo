-- =============================================
-- Cleanup: Remove all categories and products
-- =============================================
-- Deletes all products, categories (and sub/tertiary/quaternary) and related data.
-- Preserves: Users, Roles, Orders (but OrderItems are removed), PaymentMethods, Colors, Sizes, etc.
-- Target: SQL Server 2016+
-- =============================================

SET NOCOUNT ON;
GO

USE ECommerceDB;
GO

PRINT 'Starting cleanup of categories and products...';

-- 1. Tables that reference OrderItems (must delete before OrderItems)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'DeliveryStatusHistory')
    DELETE FROM DeliveryStatusHistory;
PRINT '  Deleted DeliveryStatusHistory.';

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'SellerCommissions')
    DELETE FROM SellerCommissions;
PRINT '  Deleted SellerCommissions.';

-- 2. OrderItems (references Products - must delete before Products)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'OrderItems')
    DELETE FROM OrderItems;
PRINT '  Deleted OrderItems.';

-- 3. Product-related tables (delete before Products due to FK or before cascades)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductSellers')
    DELETE FROM ProductSellers;
PRINT '  Deleted ProductSellers.';

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'CartItems')
    DELETE FROM CartItems;
PRINT '  Deleted CartItems.';

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Reviews')
    DELETE FROM Reviews;
PRINT '  Deleted Reviews.';

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductSpecifications')
    DELETE FROM ProductSpecifications;
PRINT '  Deleted ProductSpecifications.';

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductImages')
    DELETE FROM ProductImages;
PRINT '  Deleted ProductImages.';

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductVariants')
    DELETE FROM ProductVariants;
PRINT '  Deleted ProductVariants.';

-- 4. Products
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Products')
    DELETE FROM Products;
PRINT '  Deleted Products.';

-- 5. Category hierarchy (Products reference categories - now safe to delete)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'SellerQuaternaryCategories')
    DELETE FROM SellerQuaternaryCategories;
PRINT '  Deleted SellerQuaternaryCategories.';

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'QuaternaryCategories')
    DELETE FROM QuaternaryCategories;
PRINT '  Deleted QuaternaryCategories.';

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'TertiaryCategories')
    DELETE FROM TertiaryCategories;
PRINT '  Deleted TertiaryCategories.';

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'SubCategories')
    DELETE FROM SubCategories;
PRINT '  Deleted SubCategories.';

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Categories')
    DELETE FROM Categories;
PRINT '  Deleted Categories.';

-- 6. Reseed identity columns (optional - new records start from 1)
DBCC CHECKIDENT ('Categories', RESEED, 0);
DBCC CHECKIDENT ('SubCategories', RESEED, 0);
DBCC CHECKIDENT ('TertiaryCategories', RESEED, 0);
DBCC CHECKIDENT ('QuaternaryCategories', RESEED, 0);
DBCC CHECKIDENT ('Products', RESEED, 0);
DBCC CHECKIDENT ('ProductVariants', RESEED, 0);
DBCC CHECKIDENT ('ProductImages', RESEED, 0);
DBCC CHECKIDENT ('ProductSpecifications', RESEED, 0);
DBCC CHECKIDENT ('Reviews', RESEED, 0);
DBCC CHECKIDENT ('CartItems', RESEED, 0);
DBCC CHECKIDENT ('ProductSellers', RESEED, 0);
DBCC CHECKIDENT ('OrderItems', RESEED, 0);
DBCC CHECKIDENT ('SellerQuaternaryCategories', RESEED, 0);
PRINT '  Reseeded identity columns.';

PRINT 'Cleanup complete.';
GO

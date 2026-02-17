-- Add SellerSubCategories and SellerTertiaryCategories tables
-- Allows sellers to be assigned at SubCategory or Tertiary level (tertiary/quaternary optional)
-- Run against existing ECommerceDB.

SET NOCOUNT ON;
GO

USE ECommerceDB;
GO

IF OBJECT_ID('dbo.SellerSubCategories', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SellerSubCategories (
        SellerSubCategoryId INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
        SellerId INT NOT NULL,
        SubCategoryId INT NOT NULL,
        CONSTRAINT FK_SellerSubCategories_Users_SellerId FOREIGN KEY (SellerId) REFERENCES dbo.Users(UserId) ON DELETE CASCADE,
        CONSTRAINT FK_SellerSubCategories_SubCategories_SubCategoryId FOREIGN KEY (SubCategoryId) REFERENCES dbo.SubCategories(SubCategoryId) ON DELETE CASCADE
    );
    CREATE UNIQUE NONCLUSTERED INDEX IX_SellerSubCategories_SellerId_SubCategoryId ON dbo.SellerSubCategories(SellerId, SubCategoryId);
    PRINT 'Created SellerSubCategories table.';
END
ELSE
    PRINT 'SellerSubCategories already exists.';
GO

IF OBJECT_ID('dbo.SellerTertiaryCategories', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SellerTertiaryCategories (
        SellerTertiaryCategoryId INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
        SellerId INT NOT NULL,
        TertiaryCategoryId INT NOT NULL,
        CONSTRAINT FK_SellerTertiaryCategories_Users_SellerId FOREIGN KEY (SellerId) REFERENCES dbo.Users(UserId) ON DELETE CASCADE,
        CONSTRAINT FK_SellerTertiaryCategories_TertiaryCategories_TertiaryCategoryId FOREIGN KEY (TertiaryCategoryId) REFERENCES dbo.TertiaryCategories(TertiaryCategoryId) ON DELETE CASCADE
    );
    CREATE UNIQUE NONCLUSTERED INDEX IX_SellerTertiaryCategories_SellerId_TertiaryCategoryId ON dbo.SellerTertiaryCategories(SellerId, TertiaryCategoryId);
    PRINT 'Created SellerTertiaryCategories table.';
END
ELSE
    PRINT 'SellerTertiaryCategories already exists.';
GO

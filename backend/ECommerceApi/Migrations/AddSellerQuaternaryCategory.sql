-- Run this script if you cannot run EF migrations (e.g. API is running).
-- Creates SellerQuaternaryCategories table and unique index.
-- Requires: Run after prod_ECommerceDB_full.sql so Users and QuaternaryCategories exist.

USE ECommerceDB;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SellerQuaternaryCategories')
BEGIN
  IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
  BEGIN
    RAISERROR('Cannot create SellerQuaternaryCategories: table dbo.Users does not exist. Run the main DB schema script first.', 16, 1);
    RETURN;
  END
  IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'QuaternaryCategories')
  BEGIN
    RAISERROR('Cannot create SellerQuaternaryCategories: table dbo.QuaternaryCategories does not exist. Run the main DB schema script first.', 16, 1);
    RETURN;
  END

  CREATE TABLE [dbo].[SellerQuaternaryCategories] (
    [SellerQuaternaryCategoryId] INT NOT NULL IDENTITY(1,1),
    [SellerId] INT NOT NULL,
    [QuaternaryCategoryId] INT NOT NULL,
    CONSTRAINT [PK_SellerQuaternaryCategories] PRIMARY KEY ([SellerQuaternaryCategoryId]),
    CONSTRAINT [FK_SellerQuaternaryCategories_Users_SellerId] FOREIGN KEY ([SellerId]) REFERENCES [dbo].[Users] ([UserId]) ON DELETE CASCADE,
    CONSTRAINT [FK_SellerQuaternaryCategories_QuaternaryCategories_QuaternaryCategoryId] FOREIGN KEY ([QuaternaryCategoryId]) REFERENCES [dbo].[QuaternaryCategories] ([QuaternaryCategoryId]) ON DELETE CASCADE
  );
  CREATE UNIQUE INDEX [IX_SellerQuaternaryCategories_SellerId_QuaternaryCategoryId] ON [dbo].[SellerQuaternaryCategories] ([SellerId], [QuaternaryCategoryId]);
END
GO

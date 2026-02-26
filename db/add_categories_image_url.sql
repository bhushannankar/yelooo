-- Add ImageUrl to Categories for shop page category cards (mobile and desktop)
-- Run if your Categories table was created before this change

USE ECommerceDB;
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Categories' AND COLUMN_NAME = 'ImageUrl')
BEGIN
    ALTER TABLE Categories ADD ImageUrl NVARCHAR(500) NULL;
    PRINT 'Categories.ImageUrl column added.';
END
ELSE
    PRINT 'Categories.ImageUrl already exists.';
GO

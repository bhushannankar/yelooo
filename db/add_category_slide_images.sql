-- Category slide images for home page (database-driven, per category selection)
-- Admin uploads/updates these in Manage Categories. Run once.

USE ECommerceDB;
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CategorySlideImages')
BEGIN
    CREATE TABLE CategorySlideImages (
        CategorySlideImageId INT NOT NULL IDENTITY(1,1),
        CategoryId INT NOT NULL,
        ImageUrl NVARCHAR(500) NOT NULL,
        DisplayOrder INT NOT NULL DEFAULT 0,
        Title NVARCHAR(200) NULL,
        Subtitle NVARCHAR(200) NULL,
        ButtonText NVARCHAR(100) NULL,
        Link NVARCHAR(500) NULL,
        CONSTRAINT PK_CategorySlideImages PRIMARY KEY (CategorySlideImageId),
        CONSTRAINT FK_CategorySlideImages_Categories FOREIGN KEY (CategoryId) REFERENCES Categories(CategoryId) ON DELETE CASCADE
    );
    CREATE INDEX IX_CategorySlideImages_CategoryId ON CategorySlideImages(CategoryId);
    PRINT 'CategorySlideImages table created.';
END
ELSE
    PRINT 'CategorySlideImages table already exists.';
GO

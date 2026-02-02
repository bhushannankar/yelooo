-- Create Reviews table for product reviews with star ratings
-- This script creates a table to store product reviews submitted by users

USE ECommerceDB;
GO

-- Create Reviews table
CREATE TABLE Reviews (
    ReviewId INT PRIMARY KEY IDENTITY(1,1),
    ProductId INT NOT NULL,
    UserId INT NOT NULL,
    Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5), -- Star rating from 1 to 5
    Comment NVARCHAR(MAX), -- Review comment/text
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    
    -- Foreign Keys
    FOREIGN KEY (ProductId) REFERENCES Products(ProductId) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    
    -- Ensure a user can only review a product once (optional - remove if you want multiple reviews per user)
    UNIQUE(ProductId, UserId)
);

-- Create indexes for better query performance
CREATE INDEX IX_Reviews_ProductId ON Reviews(ProductId);
CREATE INDEX IX_Reviews_UserId ON Reviews(UserId);
CREATE INDEX IX_Reviews_CreatedAt ON Reviews(CreatedAt DESC);

GO

-- Verify the table was created
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Reviews'
ORDER BY ORDINAL_POSITION;

GO

PRINT 'Reviews table created successfully with indexes.';

-- Optional: Add a computed column or view for average rating per product
-- This can be calculated on-the-fly or cached in the Product table
-- For now, we'll calculate it in the API

GO

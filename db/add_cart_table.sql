-- Add Cart Items Table for Persistent Cart Storage
-- Run this script to enable cart persistence across sessions

USE ECommerceDB;
GO

-- Cart Items table - stores cart items per user
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CartItems')
BEGIN
    CREATE TABLE CartItems (
        CartItemId INT PRIMARY KEY IDENTITY(1,1),
        UserId INT NOT NULL,
        ProductId INT NOT NULL,
        Quantity INT NOT NULL DEFAULT 1,
        AddedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT FK_CartItems_Users FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
        CONSTRAINT FK_CartItems_Products FOREIGN KEY (ProductId) REFERENCES Products(ProductId) ON DELETE CASCADE,
        CONSTRAINT UQ_CartItems_User_Product UNIQUE (UserId, ProductId)
    );

    CREATE INDEX IX_CartItems_UserId ON CartItems(UserId);
    
    PRINT 'CartItems table created successfully.';
END
ELSE
BEGIN
    PRINT 'CartItems table already exists.';
END
GO

-- =============================================
-- Add Seller Commission feature
-- 1. CommissionPercent column on Users (for sellers)
-- 2. SellerCommissions table
-- =============================================

USE ECommerceDB;
GO

-- Add CommissionPercent to Users (for Seller role)
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'CommissionPercent'
)
BEGIN
    ALTER TABLE Users ADD CommissionPercent DECIMAL(5, 2) NULL;
    PRINT 'Added CommissionPercent column to Users table.';
END
ELSE
BEGIN
    PRINT 'CommissionPercent column already exists in Users table.';
END
GO

-- Create SellerCommissions table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SellerCommissions')
BEGIN
    CREATE TABLE SellerCommissions (
        SellerCommissionId INT PRIMARY KEY IDENTITY(1,1),
        OrderId INT NOT NULL,
        OrderItemId INT NOT NULL,
        SellerId INT NOT NULL,
        TransactionAmount DECIMAL(10, 2) NOT NULL,
        CommissionPercent DECIMAL(5, 2) NOT NULL,
        CommissionAmount DECIMAL(10, 2) NOT NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_SellerCommissions_Orders FOREIGN KEY (OrderId) REFERENCES Orders(OrderId),
        CONSTRAINT FK_SellerCommissions_OrderItems FOREIGN KEY (OrderItemId) REFERENCES OrderItems(OrderItemId),
        CONSTRAINT FK_SellerCommissions_Users FOREIGN KEY (SellerId) REFERENCES Users(UserId)
    );
    CREATE INDEX IX_SellerCommissions_SellerId ON SellerCommissions(SellerId);
    CREATE INDEX IX_SellerCommissions_OrderId ON SellerCommissions(OrderId);
    PRINT 'SellerCommissions table created.';
END
ELSE
BEGIN
    PRINT 'SellerCommissions table already exists.';
END
GO

-- =============================================
-- Delivery Tracking Database Script
-- =============================================
-- This script adds delivery tracking capabilities to order items
-- - Expected delivery date per order item
-- - Seller tracking for each order item
-- - Delivery status tracking
-- =============================================

USE [ECommerceDb]
GO

-- =============================================
-- Step 1: Add delivery fields to OrderItems table
-- =============================================

-- Add SellerId to track which seller is fulfilling this item
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('OrderItems') AND name = 'SellerId')
BEGIN
    ALTER TABLE OrderItems ADD SellerId INT NULL;
    PRINT 'Added SellerId column to OrderItems table';
END
GO

-- Add ExpectedDeliveryDate 
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('OrderItems') AND name = 'ExpectedDeliveryDate')
BEGIN
    ALTER TABLE OrderItems ADD ExpectedDeliveryDate DATE NULL;
    PRINT 'Added ExpectedDeliveryDate column to OrderItems table';
END
GO

-- Add ActualDeliveryDate
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('OrderItems') AND name = 'ActualDeliveryDate')
BEGIN
    ALTER TABLE OrderItems ADD ActualDeliveryDate DATE NULL;
    PRINT 'Added ActualDeliveryDate column to OrderItems table';
END
GO

-- Add DeliveryStatus (Pending, Processing, Shipped, OutForDelivery, Delivered, Cancelled)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('OrderItems') AND name = 'DeliveryStatus')
BEGIN
    ALTER TABLE OrderItems ADD DeliveryStatus NVARCHAR(50) NOT NULL DEFAULT 'Pending';
    PRINT 'Added DeliveryStatus column to OrderItems table';
END
GO

-- Add TrackingNumber
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('OrderItems') AND name = 'TrackingNumber')
BEGIN
    ALTER TABLE OrderItems ADD TrackingNumber NVARCHAR(100) NULL;
    PRINT 'Added TrackingNumber column to OrderItems table';
END
GO

-- Add DeliveryNotes (for seller to add notes)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('OrderItems') AND name = 'DeliveryNotes')
BEGIN
    ALTER TABLE OrderItems ADD DeliveryNotes NVARCHAR(500) NULL;
    PRINT 'Added DeliveryNotes column to OrderItems table';
END
GO

-- Add LastUpdatedAt for tracking when delivery info was last updated
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('OrderItems') AND name = 'LastUpdatedAt')
BEGIN
    ALTER TABLE OrderItems ADD LastUpdatedAt DATETIME NULL;
    PRINT 'Added LastUpdatedAt column to OrderItems table';
END
GO

-- Add foreign key for SellerId if not exists
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_OrderItems_Seller')
BEGIN
    ALTER TABLE OrderItems ADD CONSTRAINT FK_OrderItems_Seller 
        FOREIGN KEY (SellerId) REFERENCES Users(UserId);
    PRINT 'Added foreign key FK_OrderItems_Seller';
END
GO

-- =============================================
-- Step 2: Create DeliveryStatusHistory table for audit trail
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('DeliveryStatusHistory') AND type = 'U')
BEGIN
    CREATE TABLE DeliveryStatusHistory (
        HistoryId INT IDENTITY(1,1) PRIMARY KEY,
        OrderItemId INT NOT NULL,
        OldStatus NVARCHAR(50) NULL,
        NewStatus NVARCHAR(50) NOT NULL,
        OldDeliveryDate DATE NULL,
        NewDeliveryDate DATE NULL,
        ChangedByUserId INT NOT NULL,
        ChangedAt DATETIME NOT NULL DEFAULT GETDATE(),
        Notes NVARCHAR(500) NULL,
        
        CONSTRAINT FK_DeliveryStatusHistory_OrderItem FOREIGN KEY (OrderItemId) 
            REFERENCES OrderItems(OrderItemId),
        CONSTRAINT FK_DeliveryStatusHistory_ChangedBy FOREIGN KEY (ChangedByUserId) 
            REFERENCES Users(UserId)
    );
    
    CREATE INDEX IX_DeliveryStatusHistory_OrderItem ON DeliveryStatusHistory(OrderItemId);
    CREATE INDEX IX_DeliveryStatusHistory_ChangedAt ON DeliveryStatusHistory(ChangedAt);
    
    PRINT 'Created DeliveryStatusHistory table';
END
GO

-- =============================================
-- Step 3: Update existing OrderItems with default delivery dates
-- =============================================

-- Set default expected delivery date (7 days from order date) for existing items
UPDATE oi
SET 
    ExpectedDeliveryDate = DATEADD(DAY, 7, o.OrderDate),
    DeliveryStatus = CASE 
        WHEN o.Status = 'Delivered' THEN 'Delivered'
        WHEN o.Status = 'Shipped' THEN 'Shipped'
        WHEN o.Status = 'Cancelled' THEN 'Cancelled'
        ELSE 'Pending'
    END,
    LastUpdatedAt = GETDATE()
FROM OrderItems oi
INNER JOIN Orders o ON oi.OrderId = o.OrderId
WHERE oi.ExpectedDeliveryDate IS NULL;

PRINT 'Updated existing OrderItems with default delivery dates';
GO

-- =============================================
-- Step 4: Create view for seller order management
-- =============================================

IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID('vw_SellerOrderItems'))
    DROP VIEW vw_SellerOrderItems;
GO

CREATE VIEW vw_SellerOrderItems AS
SELECT 
    oi.OrderItemId,
    oi.OrderId,
    oi.ProductId,
    p.ProductName,
    p.ImageUrl AS ProductImage,
    oi.Quantity,
    oi.UnitPrice,
    oi.Quantity * oi.UnitPrice AS TotalPrice,
    oi.SellerId,
    oi.ExpectedDeliveryDate,
    oi.ActualDeliveryDate,
    oi.DeliveryStatus,
    oi.TrackingNumber,
    oi.DeliveryNotes,
    oi.LastUpdatedAt,
    o.OrderDate,
    o.Status AS OrderStatus,
    o.UserId AS CustomerId,
    c.Username AS CustomerName,
    c.Email AS CustomerEmail,
    c.PhoneNumber AS CustomerPhone,
    c.Address AS CustomerAddress,
    c.City AS CustomerCity,
    c.State AS CustomerState,
    c.PinCode AS CustomerPinCode,
    ps.SellerId AS ProductSellerId
FROM OrderItems oi
INNER JOIN Orders o ON oi.OrderId = o.OrderId
INNER JOIN Products p ON oi.ProductId = p.ProductId
INNER JOIN Users c ON o.UserId = c.UserId
LEFT JOIN ProductSellers ps ON p.ProductId = ps.ProductId
GO

PRINT 'Created vw_SellerOrderItems view';
GO

PRINT '=============================================';
PRINT 'Delivery Tracking setup completed successfully!';
PRINT '=============================================';

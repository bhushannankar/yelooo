-- =============================================
-- Delivery Status Lookup Table (Database-driven statuses)
-- =============================================

USE [ECommerceDb]
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('DeliveryStatuses') AND type = 'U')
BEGIN
    CREATE TABLE DeliveryStatuses (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Value NVARCHAR(50) NOT NULL UNIQUE,
        Label NVARCHAR(100) NOT NULL,
        [Description] NVARCHAR(255) NULL,
        DisplayOrder INT NOT NULL DEFAULT 0,
        IsActive BIT NOT NULL DEFAULT 1
    );

    INSERT INTO DeliveryStatuses (Value, Label, [Description], DisplayOrder) VALUES
        ('Pending', 'Pending', 'Order received, awaiting processing', 1),
        ('Processing', 'Processing', 'Order is being prepared', 2),
        ('Shipped', 'Shipped', 'Order has been shipped', 3),
        ('OutForDelivery', 'Out for Delivery', 'Order is out for delivery', 4),
        ('Delivered', 'Delivered', 'Order has been delivered', 5),
        ('Cancelled', 'Cancelled', 'Order has been cancelled', 6);

    PRINT 'Created DeliveryStatuses table and seeded data';
END
GO

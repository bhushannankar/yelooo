-- Support offline transactions in SellerCommissions: 10% of seller commission goes to Yelooo admin on offline sales too.
-- Makes OrderId/OrderItemId nullable and adds OfflineTransactionId.
-- Run once on existing DB.

USE ECommerceDB;
GO

-- Add OfflineTransactionId column (nullable)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SellerCommissions') AND name = 'OfflineTransactionId')
BEGIN
    ALTER TABLE SellerCommissions ADD OfflineTransactionId INT NULL;
    PRINT 'Added OfflineTransactionId to SellerCommissions.';
END
GO

-- FK to OfflineTransactions
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_SellerCommissions_OfflineTransactions')
BEGIN
    ALTER TABLE SellerCommissions
    ADD CONSTRAINT FK_SellerCommissions_OfflineTransactions
    FOREIGN KEY (OfflineTransactionId) REFERENCES OfflineTransactions(OfflineTransactionId) ON DELETE NO ACTION;
    PRINT 'Added FK_SellerCommissions_OfflineTransactions.';
END
GO

-- Make OrderId nullable (for offline records)
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SellerCommissions') AND name = 'OrderId')
BEGIN
    ALTER TABLE SellerCommissions ALTER COLUMN OrderId INT NULL;
    PRINT 'OrderId is now nullable.';
END
GO

-- Make OrderItemId nullable (for offline records)
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SellerCommissions') AND name = 'OrderItemId')
BEGIN
    ALTER TABLE SellerCommissions ALTER COLUMN OrderItemId INT NULL;
    PRINT 'OrderItemId is now nullable.';
END
GO

PRINT 'SellerCommissions offline support complete.';
GO

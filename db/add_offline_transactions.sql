-- Offline Transactions: For in-store purchases where customer buys directly from seller.
-- User or Seller uploads the bill; admin approves to credit points to customer.
-- Run this after add_pv_points_system.sql and other dependencies.

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OfflineTransactions')
BEGIN
    CREATE TABLE OfflineTransactions (
        OfflineTransactionId INT IDENTITY(1,1) PRIMARY KEY,
        CustomerUserId INT NOT NULL,
        SellerId INT NOT NULL,
        Amount DECIMAL(10,2) NOT NULL,
        ReceiptImageUrl NVARCHAR(500) NULL,
        TransactionReference NVARCHAR(200) NULL,
        TransactionDate DATE NOT NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
        SubmittedBy NVARCHAR(20) NOT NULL DEFAULT 'Customer',
        SubmittedByUserId INT NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        ApprovedAt DATETIME2 NULL,
        ApprovedByUserId INT NULL,
        AdminNotes NVARCHAR(500) NULL,
        CONSTRAINT FK_OfflineTransactions_CustomerUser FOREIGN KEY (CustomerUserId) REFERENCES Users(UserId),
        CONSTRAINT FK_OfflineTransactions_SellerUser FOREIGN KEY (SellerId) REFERENCES Users(UserId),
        CONSTRAINT FK_OfflineTransactions_SubmittedByUser FOREIGN KEY (SubmittedByUserId) REFERENCES Users(UserId),
        CONSTRAINT FK_OfflineTransactions_ApprovedByUser FOREIGN KEY (ApprovedByUserId) REFERENCES Users(UserId)
    );
    
    CREATE INDEX IX_OfflineTransactions_CustomerUserId ON OfflineTransactions(CustomerUserId);
    CREATE INDEX IX_OfflineTransactions_SellerId ON OfflineTransactions(SellerId);
    CREATE INDEX IX_OfflineTransactions_Status ON OfflineTransactions(Status);
    CREATE INDEX IX_OfflineTransactions_TransactionDate ON OfflineTransactions(TransactionDate);
    
    PRINT 'Created OfflineTransactions table';
END
ELSE
BEGIN
    PRINT 'OfflineTransactions table already exists';
END
GO

-- Add OfflineTransactionId to PointsTransactions if not exists (for linking points to offline transactions)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PointsTransactions') AND name = 'OfflineTransactionId')
BEGIN
    ALTER TABLE PointsTransactions ADD OfflineTransactionId INT NULL;
    ALTER TABLE PointsTransactions ADD CONSTRAINT FK_PointsTransactions_OfflineTransaction 
        FOREIGN KEY (OfflineTransactionId) REFERENCES OfflineTransactions(OfflineTransactionId);
    PRINT 'Added OfflineTransactionId to PointsTransactions';
END
GO

-- =============================================
-- Add Seller Commission Payment tracking
-- Sellers submit payment details (cheque/online)
-- Admin sees status, can filter by date/bank for CA report
-- =============================================

USE ECommerceDB;
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SellerCommissionPayments')
BEGIN
    CREATE TABLE SellerCommissionPayments (
        SellerCommissionPaymentId INT PRIMARY KEY IDENTITY(1,1),
        SellerId INT NOT NULL,
        AmountPaid DECIMAL(10, 2) NOT NULL,
        PaymentMethod NVARCHAR(20) NOT NULL DEFAULT 'Cheque',
        ChequeNumber NVARCHAR(100) NULL,
        TransactionReference NVARCHAR(200) NULL,
        BankName NVARCHAR(200) NULL,
        PaymentDate DATE NOT NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
        Notes NVARCHAR(500) NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
        ConfirmedAt DATETIME NULL,
        ConfirmedByUserId INT NULL,
        CONSTRAINT FK_SellerCommissionPayments_Seller FOREIGN KEY (SellerId) REFERENCES Users(UserId),
        CONSTRAINT FK_SellerCommissionPayments_ConfirmedBy FOREIGN KEY (ConfirmedByUserId) REFERENCES Users(UserId)
    );
    CREATE INDEX IX_SellerCommissionPayments_SellerId ON SellerCommissionPayments(SellerId);
    CREATE INDEX IX_SellerCommissionPayments_PaymentDate ON SellerCommissionPayments(PaymentDate);
    CREATE INDEX IX_SellerCommissionPayments_BankName ON SellerCommissionPayments(BankName);
    CREATE INDEX IX_SellerCommissionPayments_Status ON SellerCommissionPayments(Status);
    PRINT 'SellerCommissionPayments table created.';
END
ELSE
BEGIN
    PRINT 'SellerCommissionPayments table already exists.';
END
GO

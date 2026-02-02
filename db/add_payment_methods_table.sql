USE ECommerceDB;
GO

CREATE TABLE PaymentMethods (
    PaymentMethodId INT PRIMARY KEY IDENTITY(1,1),
    MethodName NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(MAX),
    IsActive BIT NOT NULL DEFAULT 1
);

INSERT INTO PaymentMethods (MethodName, Description) VALUES
('Cash on Delivery', 'Pay with cash upon delivery.'),
('QR Code Payment', 'Scan QR code to make payment.');

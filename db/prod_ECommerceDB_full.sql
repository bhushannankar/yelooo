-- =============================================
-- Yelooo ECommerceDB - Production Full Deployment Script
-- =============================================
-- Creates ECommerceDB database and all schema + seed data
-- Idempotent: Safe to run multiple times (uses IF NOT EXISTS / DROP IF EXISTS)
-- Target: SQL Server 2016+
-- =============================================

SET NOCOUNT ON;
GO

-- Create database if not exists
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'ECommerceDB')
BEGIN
    CREATE DATABASE ECommerceDB;
    PRINT 'Created database ECommerceDB';
END
ELSE
    PRINT 'Database ECommerceDB already exists';
GO

USE ECommerceDB;
GO

-- =============================================
-- SECTION 0: CLEANUP EXISTING OBJECTS (Reverse Dependency Order)
-- Drop views, then foreign keys, then tables to ensure a clean slate.
-- =============================================

PRINT 'Starting cleanup of existing database objects...';

-- Drop Views
IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID('vw_UserReferralNetwork')) DROP VIEW vw_UserReferralNetwork;
IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID('vw_SellerOrderItems')) DROP VIEW vw_SellerOrderItems;
GO
PRINT 'Dropped existing views.';

-- Drop Foreign Keys (in reverse order of creation or dependency)
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[FK_PointsTransactions_OfflineTransaction]')) ALTER TABLE PointsTransactions DROP CONSTRAINT FK_PointsTransactions_OfflineTransaction;
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[FK_OrderItems_Seller]')) ALTER TABLE OrderItems DROP CONSTRAINT FK_OrderItems_Seller;
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[FK_Users_ReferredBy]')) ALTER TABLE Users DROP CONSTRAINT FK_Users_ReferredBy;
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[FK_Users_Roles]')) ALTER TABLE Users DROP CONSTRAINT FK_Users_Roles;
GO
PRINT 'Dropped problematic foreign key constraints.';

-- Drop Tables (in reverse dependency order to prevent FK errors)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'SellerCommissionPayments') DROP TABLE SellerCommissionPayments;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'SellerCommissions') DROP TABLE SellerCommissions;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'OfflineTransactions') DROP TABLE OfflineTransactions;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'PointsBenefits') DROP TABLE PointsBenefits;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'PointsRedemptionConfigs') DROP TABLE PointsRedemptionConfigs;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'PointsTransactions') DROP TABLE PointsTransactions;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'UserPointsBalance') DROP TABLE UserPointsBalance;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'PVLevelConfig') DROP TABLE PVLevelConfig;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'DeliveryStatuses') DROP TABLE DeliveryStatuses;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'DeliveryStatusHistory') DROP TABLE DeliveryStatusHistory;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ReferralTree') DROP TABLE ReferralTree;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ReferralInvitations') DROP TABLE ReferralInvitations;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'KycStatusHistory') DROP TABLE KycStatusHistory;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'KycDocuments') DROP TABLE KycDocuments;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'UserBankDetails') DROP TABLE UserBankDetails;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'SellerTertiaryCategories') DROP TABLE SellerTertiaryCategories;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'SellerSubCategories') DROP TABLE SellerSubCategories;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'SellerQuaternaryCategories') DROP TABLE SellerQuaternaryCategories;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductSellers') DROP TABLE ProductSellers;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'CartItems') DROP TABLE CartItems;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Reviews') DROP TABLE Reviews;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductSpecifications') DROP TABLE ProductSpecifications;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductImages') DROP TABLE ProductImages;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductVariants') DROP TABLE ProductVariants;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Sizes') DROP TABLE Sizes;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Colors') DROP TABLE Colors;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'PaymentMethods') DROP TABLE PaymentMethods;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'OrderItems') DROP TABLE OrderItems;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Orders') DROP TABLE Orders;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Users') DROP TABLE Users;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Products') DROP TABLE Products;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'QuaternaryCategories') DROP TABLE QuaternaryCategories;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'TertiaryCategories') DROP TABLE TertiaryCategories;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'SubCategories') DROP TABLE SubCategories;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Categories') DROP TABLE Categories;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles') DROP TABLE Roles;
GO
PRINT 'Dropped all existing tables.';
PRINT 'Cleanup complete.';

-- =============================================
-- SECTION 1: CREATE ALL TABLES (without FKs initially)
-- All tables are created with their columns.
-- =============================================

PRINT 'Creating all tables...';

CREATE TABLE Roles (
    RoleId INT PRIMARY KEY IDENTITY(1,1),
    RoleName NVARCHAR(50) NOT NULL UNIQUE
);
GO
PRINT 'Created Roles table.';

CREATE TABLE Categories (
    CategoryId INT PRIMARY KEY IDENTITY(1,1),
    CategoryName NVARCHAR(100) NOT NULL UNIQUE,
    DisplayOrder INT NOT NULL DEFAULT 0
);
GO
PRINT 'Created Categories table.';

CREATE TABLE SubCategories (
    SubCategoryId INT PRIMARY KEY IDENTITY(1,1),
    SubCategoryName NVARCHAR(100) NOT NULL,
    CategoryId INT NOT NULL
    -- FK to Categories will be added later
);
GO
PRINT 'Created SubCategories table.';

CREATE TABLE TertiaryCategories (
    TertiaryCategoryId INT PRIMARY KEY IDENTITY(1,1),
    TertiaryCategoryName NVARCHAR(100) NOT NULL,
    SubCategoryId INT NOT NULL,
    ImageUrl NVARCHAR(500) NULL,
    Description NVARCHAR(500) NULL
    -- FK to SubCategories will be added later
);
GO
PRINT 'Created TertiaryCategories table.';

CREATE TABLE QuaternaryCategories (
    QuaternaryCategoryId INT PRIMARY KEY IDENTITY(1,1),
    QuaternaryCategoryName NVARCHAR(100) NOT NULL,
    TertiaryCategoryId INT NOT NULL,
    ImageUrl NVARCHAR(500) NULL,
    Description NVARCHAR(500) NULL
    -- FK to TertiaryCategories will be added later
);
GO
PRINT 'Created QuaternaryCategories table.';

CREATE TABLE Products (
    ProductId INT PRIMARY KEY IDENTITY(1,1),
    ProductName NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX),
    Price DECIMAL(10, 2) NOT NULL,
    ImageUrl NVARCHAR(MAX),
    Stock INT NOT NULL,
    SubCategoryId INT NOT NULL,
    BrandName NVARCHAR(200) NULL,
    ShortDescription NVARCHAR(500) NULL,
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL,
    OriginalPrice DECIMAL(10, 2) NULL,
    TertiaryCategoryId INT NULL,
    QuaternaryCategoryId INT NULL
    -- FKs to SubCategories, TertiaryCategories, QuaternaryCategories will be added later
);
GO
PRINT 'Created Products table.';

CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(100) NOT NULL UNIQUE,
    Email NVARCHAR(255) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    RoleId INT NULL,
    FullName NVARCHAR(200) NULL,
    PhoneNumber NVARCHAR(20) NULL,
    DateOfBirth DATE NULL,
    Address NVARCHAR(500) NULL,
    City NVARCHAR(100) NULL,
    [State] NVARCHAR(100) NULL,
    PinCode NVARCHAR(10) NULL,
    ProfileImageUrl NVARCHAR(500) NULL,
    FirstName NVARCHAR(100) NULL,
    MiddleName NVARCHAR(100) NULL,
    LastName NVARCHAR(100) NULL,
    Gender NVARCHAR(20) NULL,
    AlternatePhoneNumber NVARCHAR(20) NULL,
    AddressLine2 NVARCHAR(500) NULL,
    Landmark NVARCHAR(200) NULL,
    Country NVARCHAR(100) NULL DEFAULT 'India',
    PasswordResetToken NVARCHAR(255) NULL,
    PasswordResetTokenExpiry DATETIME NULL,
    KycStatus NVARCHAR(20) DEFAULT 'NotSubmitted',
    KycApprovedAt DATETIME NULL,
    ReferredByUserId INT NULL,
    ReferralCode NVARCHAR(20) NULL,
    ReferralLevel INT NULL DEFAULT 1,
    JoinedViaReferral BIT NOT NULL DEFAULT 0,
    CommissionPercent DECIMAL(5, 2) NULL
    -- FKs to Roles, Users (self-reference) will be added later
);
GO
PRINT 'Created Users table.';

CREATE TABLE Orders (
    OrderId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    OrderDate DATETIME DEFAULT GETDATE(),
    TotalAmount DECIMAL(10, 2) NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    PointsRedeemed DECIMAL(18, 2) NOT NULL DEFAULT 0,
    PointsDiscountAmount DECIMAL(18, 2) NOT NULL DEFAULT 0,
    BenefitDiscountAmount DECIMAL(18, 2) NOT NULL DEFAULT 0
    -- FK to Users will be added later
);
GO
PRINT 'Created Orders table.';

CREATE TABLE OrderItems (
    OrderItemId INT PRIMARY KEY IDENTITY(1,1),
    OrderId INT NOT NULL,
    ProductId INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10, 2) NOT NULL,
    SellerId INT NULL,
    ExpectedDeliveryDate DATE NULL,
    ActualDeliveryDate DATE NULL,
    DeliveryStatus NVARCHAR(50) NOT NULL DEFAULT 'Pending',
    TrackingNumber NVARCHAR(100) NULL,
    DeliveryNotes NVARCHAR(500) NULL,
    LastUpdatedAt DATETIME NULL
    -- FKs to Orders, Products, Users (SellerId) will be added later
);
GO
PRINT 'Created OrderItems table.';

CREATE TABLE PaymentMethods (
    PaymentMethodId INT PRIMARY KEY IDENTITY(1,1),
    MethodName NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(MAX),
    IsActive BIT NOT NULL DEFAULT 1
);
GO
PRINT 'Created PaymentMethods table.';

CREATE TABLE Colors (
    ColorId INT PRIMARY KEY IDENTITY(1,1),
    ColorName NVARCHAR(100) NOT NULL UNIQUE,
    HexCode NVARCHAR(7) NULL
);
GO
PRINT 'Created Colors table.';

CREATE TABLE Sizes (
    SizeId INT PRIMARY KEY IDENTITY(1,1),
    SizeName NVARCHAR(50) NOT NULL,
    SizeCategory NVARCHAR(50) NULL
);
GO
PRINT 'Created Sizes table.';

CREATE TABLE ProductVariants (
    VariantId INT PRIMARY KEY IDENTITY(1,1),
    ProductId INT NOT NULL,
    ColorId INT NULL,
    SizeId INT NULL,
    SKU NVARCHAR(100) NULL UNIQUE,
    Price DECIMAL(10, 2) NOT NULL,
    OriginalPrice DECIMAL(10, 2) NULL,
    Stock INT NOT NULL DEFAULT 0,
    IsAvailable BIT NOT NULL DEFAULT 1
    -- FKs to Products, Colors, Sizes will be added later
);
GO
PRINT 'Created ProductVariants table.';

CREATE TABLE ProductImages (
    ImageId INT PRIMARY KEY IDENTITY(1,1),
    ProductId INT NOT NULL,
    VariantId INT NULL,
    ImageUrl NVARCHAR(500) NOT NULL,
    IsMain BIT NOT NULL DEFAULT 0,
    DisplayOrder INT NOT NULL DEFAULT 0
    -- FKs to Products, ProductVariants will be added later
);
GO
PRINT 'Created ProductImages table.';

CREATE TABLE ProductSpecifications (
    SpecId INT PRIMARY KEY IDENTITY(1,1),
    ProductId INT NOT NULL,
    AttributeName NVARCHAR(200) NOT NULL,
    AttributeValue NVARCHAR(500) NOT NULL,
    DisplayOrder INT NOT NULL DEFAULT 0
    -- FK to Products will be added later
);
GO
PRINT 'Created ProductSpecifications table.';

CREATE TABLE Reviews (
    ReviewId INT PRIMARY KEY IDENTITY(1,1),
    ProductId INT NOT NULL,
    UserId INT NOT NULL,
    Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
    Comment NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
    -- FKs to Products, Users will be added later
);
GO
PRINT 'Created Reviews table.';

CREATE TABLE CartItems (
    CartItemId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    ProductId INT NOT NULL,
    Quantity INT NOT NULL DEFAULT 1,
    AddedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NOT NULL DEFAULT GETDATE()
    -- FKs to Users, Products will be added later
);
GO
PRINT 'Created CartItems table.';

CREATE TABLE ProductSellers (
    ProductSellerId INT PRIMARY KEY IDENTITY(1,1),
    ProductId INT NOT NULL,
    SellerId INT NOT NULL,
    SellerPrice DECIMAL(10, 2) NOT NULL,
    DeliveryDays INT NOT NULL DEFAULT 5,
    DeliveryCharge DECIMAL(10, 2) NOT NULL DEFAULT 0,
    SellerAddress NVARCHAR(500) NULL,
    StockQuantity INT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NOT NULL DEFAULT GETDATE()
    -- FKs to Products, Users (SellerId) will be added later
);
GO
PRINT 'Created ProductSellers table.';

CREATE TABLE UserBankDetails (
    BankDetailId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    AccountHolderName NVARCHAR(200) NOT NULL,
    AccountNumber NVARCHAR(50) NOT NULL,
    BankName NVARCHAR(200) NOT NULL,
    BranchName NVARCHAR(200) NOT NULL,
    IFSCCode NVARCHAR(20) NOT NULL,
    AccountType NVARCHAR(50) DEFAULT 'Savings',
    IsVerified BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
    -- FK to Users will be added later
);
GO
PRINT 'Created UserBankDetails table.';

CREATE TABLE KycDocuments (
    KycDocumentId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    DocumentType NVARCHAR(50) NOT NULL,
    DocumentNumber NVARCHAR(100) NOT NULL,
    DocumentFrontUrl NVARCHAR(500) NOT NULL,
    DocumentBackUrl NVARCHAR(500) NULL,
    Status NVARCHAR(20) DEFAULT 'Pending',
    RejectionReason NVARCHAR(500) NULL,
    SubmittedAt DATETIME DEFAULT GETDATE(),
    ReviewedAt DATETIME NULL,
    ReviewedByUserId INT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME NOT NULL DEFAULT GETUTCDATE()
    -- FKs to Users (UserId, ReviewedByUserId) will be added later
);
GO
PRINT 'Created KycDocuments table.';

CREATE TABLE KycStatusHistory (
    HistoryId INT IDENTITY(1,1) PRIMARY KEY,
    KycDocumentId INT NOT NULL,
    OldStatus NVARCHAR(20) NULL,
    NewStatus NVARCHAR(20) NOT NULL,
    ChangedByUserId INT NOT NULL,
    ChangeReason NVARCHAR(500) NULL,
    ChangedAt DATETIME DEFAULT GETDATE()
    -- FKs to KycDocuments, Users will be added later
);
GO
PRINT 'Created KycStatusHistory table.';

CREATE TABLE ReferralInvitations (
    InvitationId INT IDENTITY(1,1) PRIMARY KEY,
    InvitedByUserId INT NOT NULL,
    InviteeEmail NVARCHAR(255) NOT NULL,
    InvitationCode NVARCHAR(50) NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    SentAt DATETIME NOT NULL DEFAULT GETDATE(),
    ExpiresAt DATETIME NOT NULL,
    AcceptedAt DATETIME NULL,
    AcceptedByUserId INT NULL
    -- FKs to Users (InvitedByUserId, AcceptedByUserId) will be added later
);
GO
PRINT 'Created ReferralInvitations table.';

CREATE TABLE ReferralTree (
    TreeId INT IDENTITY(1,1) PRIMARY KEY,
    AncestorUserId INT NOT NULL,
    DescendantUserId INT NOT NULL,
    Level INT NOT NULL,
    LegRootUserId INT NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
    -- FKs to Users (AncestorUserId, DescendantUserId, LegRootUserId) will be added later
);
GO
PRINT 'Created ReferralTree table.';

CREATE TABLE DeliveryStatusHistory (
    HistoryId INT IDENTITY(1,1) PRIMARY KEY,
    OrderItemId INT NOT NULL,
    OldStatus NVARCHAR(50) NULL,
    NewStatus NVARCHAR(50) NOT NULL,
    OldDeliveryDate DATE NULL,
    NewDeliveryDate DATE NULL,
    ChangedByUserId INT NOT NULL,
    ChangedAt DATETIME NOT NULL DEFAULT GETDATE(),
    Notes NVARCHAR(500) NULL
    -- FKs to OrderItems, Users will be added later
);
GO
PRINT 'Created DeliveryStatusHistory table.';

CREATE TABLE DeliveryStatuses (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Value NVARCHAR(50) NOT NULL UNIQUE,
    Label NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(255) NULL,
    DisplayOrder INT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1
);
GO
PRINT 'Created DeliveryStatuses table.';

CREATE TABLE PVLevelConfig (
    LevelId INT PRIMARY KEY,
    LevelName NVARCHAR(50) NOT NULL,
    PVPercentage DECIMAL(5, 2) NOT NULL,
    Description NVARCHAR(200) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL
);
GO
PRINT 'Created PVLevelConfig table.';

CREATE TABLE UserPointsBalance (
    BalanceId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    TotalPointsEarned DECIMAL(18, 2) NOT NULL DEFAULT 0,
    TotalPointsRedeemed DECIMAL(18, 2) NOT NULL DEFAULT 0,
    CurrentBalance DECIMAL(18, 2) NOT NULL DEFAULT 0,
    LastUpdatedAt DATETIME NOT NULL DEFAULT GETDATE()
    -- FK to Users will be added later
);
GO
PRINT 'Created UserPointsBalance table.';

CREATE TABLE PointsTransactions (
    TransactionId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    OrderId INT NULL,
    SourceUserId INT NULL,
    TransactionType NVARCHAR(50) NOT NULL,
    LevelId INT NULL,
    OrderAmount DECIMAL(18, 2) NULL,
    TotalPV DECIMAL(18, 2) NULL,
    PointsAmount DECIMAL(18, 2) NOT NULL,
    BalanceAfter DECIMAL(18, 2) NOT NULL,
    Description NVARCHAR(500) NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    OfflineTransactionId INT NULL -- Column added directly
    -- FKs to Users, Orders, OfflineTransactions will be added later
);
GO
PRINT 'Created PointsTransactions table.';

CREATE TABLE PointsRedemptionConfigs (
    Id INT PRIMARY KEY DEFAULT 1,
    PointsPerRupee DECIMAL(10, 2) NOT NULL DEFAULT 10,
    IsActive BIT NOT NULL DEFAULT 1,
    CONSTRAINT CK_PointsRedemptionConfig_Id CHECK (Id = 1)
);
GO
PRINT 'Created PointsRedemptionConfigs table.';

CREATE TABLE PointsBenefits (
    PointsBenefitId INT IDENTITY(1,1) PRIMARY KEY,
    PointsThreshold DECIMAL(18, 2) NOT NULL,
    BenefitType NVARCHAR(50) NOT NULL,
    BenefitValue DECIMAL(10, 2) NOT NULL,
    Description NVARCHAR(200) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    DisplayOrder INT NOT NULL DEFAULT 0
);
GO
PRINT 'Created PointsBenefits table.';

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
    ApprovedByUserId INT NULL
    -- FKs to Users (CustomerUserId, SellerId, SubmittedByUserId, ApprovedByUserId) will be added later
);
GO
PRINT 'Created OfflineTransactions table.';

CREATE TABLE SellerCommissions (
    SellerCommissionId INT PRIMARY KEY IDENTITY(1,1),
    OrderId INT NOT NULL,
    OrderItemId INT NOT NULL,
    SellerId INT NOT NULL,
    TransactionAmount DECIMAL(10, 2) NOT NULL,
    CommissionPercent DECIMAL(5, 2) NOT NULL,
    CommissionAmount DECIMAL(10, 2) NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE()
    -- FKs to Orders, OrderItems, Users will be added later
);
GO
PRINT 'Created SellerCommissions table.';

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
    ConfirmedByUserId INT NULL
    -- FKs to Users (SellerId, ConfirmedByUserId) will be added later
);
GO
PRINT 'Created SellerCommissionPayments table.';
PRINT 'All tables created.';

-- =============================================
-- SECTION 2: ADD FOREIGN KEY CONSTRAINTS
-- Add all FKs after all tables exist.
-- =============================================

PRINT 'Adding foreign key constraints...';

ALTER TABLE SubCategories ADD CONSTRAINT FK_SubCategories_Categories FOREIGN KEY (CategoryId) REFERENCES Categories(CategoryId);
GO
ALTER TABLE TertiaryCategories ADD CONSTRAINT FK_TertiaryCategories_SubCategories FOREIGN KEY (SubCategoryId) REFERENCES SubCategories(SubCategoryId);
GO
ALTER TABLE QuaternaryCategories ADD CONSTRAINT FK_QuaternaryCategories_TertiaryCategories FOREIGN KEY (TertiaryCategoryId) REFERENCES TertiaryCategories(TertiaryCategoryId);
GO
ALTER TABLE Products ADD CONSTRAINT FK_Products_SubCategories FOREIGN KEY (SubCategoryId) REFERENCES SubCategories(SubCategoryId);
ALTER TABLE Products ADD CONSTRAINT FK_Products_TertiaryCategories FOREIGN KEY (TertiaryCategoryId) REFERENCES TertiaryCategories(TertiaryCategoryId);
ALTER TABLE Products ADD CONSTRAINT FK_Products_QuaternaryCategories FOREIGN KEY (QuaternaryCategoryId) REFERENCES QuaternaryCategories(QuaternaryCategoryId);
GO
ALTER TABLE Users ADD CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleId) REFERENCES Roles(RoleId);
ALTER TABLE Users ADD CONSTRAINT FK_Users_ReferredBy FOREIGN KEY (ReferredByUserId) REFERENCES Users(UserId);
GO
ALTER TABLE Orders ADD CONSTRAINT FK_Orders_Users FOREIGN KEY (UserId) REFERENCES Users(UserId);
GO
ALTER TABLE OrderItems ADD CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (OrderId) REFERENCES Orders(OrderId);
ALTER TABLE OrderItems ADD CONSTRAINT FK_OrderItems_Products FOREIGN KEY (ProductId) REFERENCES Products(ProductId);
ALTER TABLE OrderItems ADD CONSTRAINT FK_OrderItems_Seller FOREIGN KEY (SellerId) REFERENCES Users(UserId);
GO
ALTER TABLE ProductVariants ADD CONSTRAINT FK_ProductVariants_Products FOREIGN KEY (ProductId) REFERENCES Products(ProductId) ON DELETE CASCADE;
ALTER TABLE ProductVariants ADD CONSTRAINT FK_ProductVariants_Colors FOREIGN KEY (ColorId) REFERENCES Colors(ColorId);
ALTER TABLE ProductVariants ADD CONSTRAINT FK_ProductVariants_Sizes FOREIGN KEY (SizeId) REFERENCES Sizes(SizeId);
GO
ALTER TABLE ProductImages ADD CONSTRAINT FK_ProductImages_Products FOREIGN KEY (ProductId) REFERENCES Products(ProductId) ON DELETE CASCADE;
ALTER TABLE ProductImages ADD CONSTRAINT FK_ProductImages_ProductVariants FOREIGN KEY (VariantId) REFERENCES ProductVariants(VariantId) ON DELETE NO ACTION;
GO
ALTER TABLE ProductSpecifications ADD CONSTRAINT FK_ProductSpecifications_Products FOREIGN KEY (ProductId) REFERENCES Products(ProductId) ON DELETE CASCADE;
GO
ALTER TABLE Reviews ADD CONSTRAINT FK_Reviews_Products FOREIGN KEY (ProductId) REFERENCES Products(ProductId) ON DELETE CASCADE;
ALTER TABLE Reviews ADD CONSTRAINT FK_Reviews_Users FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE;
GO
ALTER TABLE CartItems ADD CONSTRAINT FK_CartItems_Users FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE;
ALTER TABLE CartItems ADD CONSTRAINT FK_CartItems_Products FOREIGN KEY (ProductId) REFERENCES Products(ProductId) ON DELETE CASCADE;
GO
ALTER TABLE ProductSellers ADD CONSTRAINT FK_ProductSellers_Products FOREIGN KEY (ProductId) REFERENCES Products(ProductId) ON DELETE CASCADE;
ALTER TABLE ProductSellers ADD CONSTRAINT FK_ProductSellers_Sellers FOREIGN KEY (SellerId) REFERENCES Users(UserId) ON DELETE NO ACTION;
GO
ALTER TABLE UserBankDetails ADD CONSTRAINT FK_UserBankDetails_Users FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE;
GO
ALTER TABLE KycDocuments ADD CONSTRAINT FK_KycDocuments_Users FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE;
ALTER TABLE KycDocuments ADD CONSTRAINT FK_KycDocuments_ReviewedBy FOREIGN KEY (ReviewedByUserId) REFERENCES Users(UserId);
GO
ALTER TABLE KycStatusHistory ADD CONSTRAINT FK_KycStatusHistory_KycDocuments FOREIGN KEY (KycDocumentId) REFERENCES KycDocuments(KycDocumentId) ON DELETE CASCADE;
ALTER TABLE KycStatusHistory ADD CONSTRAINT FK_KycStatusHistory_Users FOREIGN KEY (ChangedByUserId) REFERENCES Users(UserId);
GO
ALTER TABLE ReferralInvitations ADD CONSTRAINT FK_ReferralInvitations_InvitedBy FOREIGN KEY (InvitedByUserId) REFERENCES Users(UserId);
ALTER TABLE ReferralInvitations ADD CONSTRAINT FK_ReferralInvitations_AcceptedBy FOREIGN KEY (AcceptedByUserId) REFERENCES Users(UserId);
GO
ALTER TABLE ReferralTree ADD CONSTRAINT FK_ReferralTree_Ancestor FOREIGN KEY (AncestorUserId) REFERENCES Users(UserId);
ALTER TABLE ReferralTree ADD CONSTRAINT FK_ReferralTree_Descendant FOREIGN KEY (DescendantUserId) REFERENCES Users(UserId);
ALTER TABLE ReferralTree ADD CONSTRAINT FK_ReferralTree_LegRoot FOREIGN KEY (LegRootUserId) REFERENCES Users(UserId);
GO
ALTER TABLE DeliveryStatusHistory ADD CONSTRAINT FK_DeliveryStatusHistory_OrderItem FOREIGN KEY (OrderItemId) REFERENCES OrderItems(OrderItemId);
ALTER TABLE DeliveryStatusHistory ADD CONSTRAINT FK_DeliveryStatusHistory_ChangedBy FOREIGN KEY (ChangedByUserId) REFERENCES Users(UserId);
GO
ALTER TABLE UserPointsBalance ADD CONSTRAINT FK_UserPointsBalance_User FOREIGN KEY (UserId) REFERENCES Users(UserId);
GO
ALTER TABLE PointsTransactions ADD CONSTRAINT FK_PointsTransactions_User FOREIGN KEY (UserId) REFERENCES Users(UserId);
ALTER TABLE PointsTransactions ADD CONSTRAINT FK_PointsTransactions_Order FOREIGN KEY (OrderId) REFERENCES Orders(OrderId);
ALTER TABLE PointsTransactions ADD CONSTRAINT FK_PointsTransactions_SourceUser FOREIGN KEY (SourceUserId) REFERENCES Users(UserId);
ALTER TABLE PointsTransactions ADD CONSTRAINT FK_PointsTransactions_OfflineTransaction FOREIGN KEY (OfflineTransactionId) REFERENCES OfflineTransactions(OfflineTransactionId);
GO
ALTER TABLE OfflineTransactions ADD CONSTRAINT FK_OfflineTransactions_CustomerUser FOREIGN KEY (CustomerUserId) REFERENCES Users(UserId);
ALTER TABLE OfflineTransactions ADD CONSTRAINT FK_OfflineTransactions_SellerUser FOREIGN KEY (SellerId) REFERENCES Users(UserId);
ALTER TABLE OfflineTransactions ADD CONSTRAINT FK_OfflineTransactions_SubmittedByUser FOREIGN KEY (SubmittedByUserId) REFERENCES Users(UserId);
ALTER TABLE OfflineTransactions ADD CONSTRAINT FK_OfflineTransactions_ApprovedByUser FOREIGN KEY (ApprovedByUserId) REFERENCES Users(UserId);
GO
ALTER TABLE SellerCommissions ADD CONSTRAINT FK_SellerCommissions_Orders FOREIGN KEY (OrderId) REFERENCES Orders(OrderId);
ALTER TABLE SellerCommissions ADD CONSTRAINT FK_SellerCommissions_OrderItems FOREIGN KEY (OrderItemId) REFERENCES OrderItems(OrderItemId);
ALTER TABLE SellerCommissions ADD CONSTRAINT FK_SellerCommissions_Users FOREIGN KEY (SellerId) REFERENCES Users(UserId);
GO
ALTER TABLE SellerCommissionPayments ADD CONSTRAINT FK_SellerCommissionPayments_Seller FOREIGN KEY (SellerId) REFERENCES Users(UserId);
ALTER TABLE SellerCommissionPayments ADD CONSTRAINT FK_SellerCommissionPayments_ConfirmedBy FOREIGN KEY (ConfirmedByUserId) REFERENCES Users(UserId);
GO
CREATE TABLE SellerSubCategories (
    SellerSubCategoryId INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
    SellerId INT NOT NULL,
    SubCategoryId INT NOT NULL,
    CONSTRAINT FK_SellerSubCategories_Users_SellerId FOREIGN KEY (SellerId) REFERENCES Users(UserId) ON DELETE CASCADE,
    CONSTRAINT FK_SellerSubCategories_SubCategories_SubCategoryId FOREIGN KEY (SubCategoryId) REFERENCES SubCategories(SubCategoryId) ON DELETE CASCADE
);
GO
CREATE TABLE SellerTertiaryCategories (
    SellerTertiaryCategoryId INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
    SellerId INT NOT NULL,
    TertiaryCategoryId INT NOT NULL,
    CONSTRAINT FK_SellerTertiaryCategories_Users_SellerId FOREIGN KEY (SellerId) REFERENCES Users(UserId) ON DELETE CASCADE,
    CONSTRAINT FK_SellerTertiaryCategories_TertiaryCategories_TertiaryCategoryId FOREIGN KEY (TertiaryCategoryId) REFERENCES TertiaryCategories(TertiaryCategoryId) ON DELETE CASCADE
);
GO
CREATE TABLE SellerQuaternaryCategories (
    SellerQuaternaryCategoryId INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
    SellerId INT NOT NULL,
    QuaternaryCategoryId INT NOT NULL,
    CONSTRAINT FK_SellerQuaternaryCategories_Users_SellerId FOREIGN KEY (SellerId) REFERENCES Users(UserId) ON DELETE CASCADE,
    CONSTRAINT FK_SellerQuaternaryCategories_QuaternaryCategories_QuaternaryCategoryId FOREIGN KEY (QuaternaryCategoryId) REFERENCES QuaternaryCategories(QuaternaryCategoryId) ON DELETE CASCADE
);
GO
PRINT 'Created SellerSubCategories, SellerTertiaryCategories, SellerQuaternaryCategories tables.';
PRINT 'All foreign key constraints added.';

-- =============================================
-- SECTION 3: ADD INDEXES
-- Add all indexes after tables and FKs are in place.
-- =============================================

PRINT 'Creating indexes...';

CREATE UNIQUE NONCLUSTERED INDEX IX_Users_ReferralCode ON Users(ReferralCode) WHERE ReferralCode IS NOT NULL;
CREATE INDEX IX_Users_PasswordResetToken ON Users(PasswordResetToken);
GO
CREATE INDEX IX_ProductVariants_ProductId ON ProductVariants(ProductId);
GO
CREATE INDEX IX_ProductImages_ProductId ON ProductImages(ProductId);
CREATE INDEX IX_ProductImages_VariantId ON ProductImages(VariantId);
GO
CREATE INDEX IX_ProductSpecifications_ProductId ON ProductSpecifications(ProductId);
GO
CREATE UNIQUE NONCLUSTERED INDEX UQ_Reviews_ProductId_UserId ON Reviews(ProductId, UserId);
CREATE INDEX IX_Reviews_ProductId ON Reviews(ProductId);
CREATE INDEX IX_Reviews_UserId ON Reviews(UserId);
GO
CREATE UNIQUE NONCLUSTERED INDEX UQ_CartItems_User_Product ON CartItems(UserId, ProductId);
CREATE INDEX IX_CartItems_UserId ON CartItems(UserId);
GO
CREATE UNIQUE NONCLUSTERED INDEX UQ_ProductSellers_Product_Seller ON ProductSellers(ProductId, SellerId);
CREATE INDEX IX_ProductSellers_ProductId ON ProductSellers(ProductId);
CREATE INDEX IX_ProductSellers_SellerId ON ProductSellers(SellerId);
GO
CREATE UNIQUE NONCLUSTERED INDEX IX_SellerSubCategories_SellerId_SubCategoryId ON SellerSubCategories(SellerId, SubCategoryId);
CREATE UNIQUE NONCLUSTERED INDEX IX_SellerTertiaryCategories_SellerId_TertiaryCategoryId ON SellerTertiaryCategories(SellerId, TertiaryCategoryId);
CREATE UNIQUE NONCLUSTERED INDEX IX_SellerQuaternaryCategories_SellerId_QuaternaryCategoryId ON SellerQuaternaryCategories(SellerId, QuaternaryCategoryId);
GO
CREATE INDEX IX_UserBankDetails_UserId ON UserBankDetails(UserId);
GO
CREATE INDEX IX_KycDocuments_UserId ON KycDocuments(UserId);
GO
CREATE INDEX IX_KycStatusHistory_KycDocumentId ON KycStatusHistory(KycDocumentId);
GO
CREATE INDEX IX_ReferralInvitations_Code ON ReferralInvitations(InvitationCode);
GO
CREATE UNIQUE NONCLUSTERED INDEX UQ_ReferralTree_AncestorDescendant ON ReferralTree(AncestorUserId, DescendantUserId);
CREATE INDEX IX_ReferralTree_Ancestor ON ReferralTree(AncestorUserId);
CREATE INDEX IX_ReferralTree_Descendant ON ReferralTree(DescendantUserId);
GO
CREATE INDEX IX_DeliveryStatusHistory_OrderItem ON DeliveryStatusHistory(OrderItemId);
GO
CREATE UNIQUE NONCLUSTERED INDEX UQ_UserPointsBalance_User ON UserPointsBalance(UserId);
GO
CREATE INDEX IX_PointsTransactions_UserId ON PointsTransactions(UserId);
CREATE INDEX IX_PointsTransactions_OrderId ON PointsTransactions(OrderId);
GO
CREATE INDEX IX_OfflineTransactions_CustomerUserId ON OfflineTransactions(CustomerUserId);
CREATE INDEX IX_OfflineTransactions_SellerId ON OfflineTransactions(SellerId);
CREATE INDEX IX_OfflineTransactions_Status ON OfflineTransactions(Status);
GO
CREATE INDEX IX_SellerCommissions_SellerId ON SellerCommissions(SellerId);
GO
CREATE INDEX IX_SellerCommissionPayments_SellerId ON SellerCommissionPayments(SellerId);
CREATE INDEX IX_SellerCommissionPayments_Status ON SellerCommissionPayments(Status);
GO
PRINT 'All indexes created.';

-- =============================================
-- SECTION 4: SEED DATA
-- Insert initial data into lookup and core tables.
-- =============================================

PRINT 'Inserting seed data...';

-- Seed Roles
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'Admin') INSERT INTO Roles (RoleName) VALUES ('Admin');
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'Seller') INSERT INTO Roles (RoleName) VALUES ('Seller');
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'Customer') INSERT INTO Roles (RoleName) VALUES ('Customer');
GO
PRINT 'Inserted base roles.';

-- Seed Categories
IF NOT EXISTS (SELECT 1 FROM Categories WHERE CategoryName = 'Home appliances')
    INSERT INTO Categories (CategoryName) VALUES ('Home appliances');
IF NOT EXISTS (SELECT 1 FROM Categories WHERE CategoryName = 'Clothes')
    INSERT INTO Categories (CategoryName) VALUES ('Clothes');
IF NOT EXISTS (SELECT 1 FROM Categories WHERE CategoryName = 'Grocery')
    INSERT INTO Categories (CategoryName) VALUES ('Grocery');
IF NOT EXISTS (SELECT 1 FROM Categories WHERE CategoryName = 'Home Appliances') -- Additional case for different capitalization
    INSERT INTO Categories (CategoryName) VALUES ('Home Appliances');
GO
PRINT 'Inserted base categories.';

-- Seed SubCategories
DECLARE @CatHA INT, @CatC INT, @CatG INT, @CatHACap INT;
SELECT @CatHA = CategoryId FROM Categories WHERE CategoryName = 'Home appliances';
SELECT @CatC = CategoryId FROM Categories WHERE CategoryName = 'Clothes';
SELECT @CatG = CategoryId FROM Categories WHERE CategoryName = 'Grocery';
SELECT @CatHACap = CategoryId FROM Categories WHERE CategoryName = 'Home Appliances';

IF @CatHA IS NOT NULL AND NOT EXISTS (SELECT 1 FROM SubCategories WHERE SubCategoryName = 'Electronics' AND CategoryId = @CatHA)
    INSERT INTO SubCategories (SubCategoryName, CategoryId) VALUES ('Electronics', @CatHA);
IF @CatHA IS NOT NULL AND NOT EXISTS (SELECT 1 FROM SubCategories WHERE SubCategoryName = 'Household' AND CategoryId = @CatHA)
    INSERT INTO SubCategories (SubCategoryName, CategoryId) VALUES ('Household', @CatHA);
IF @CatC IS NOT NULL AND NOT EXISTS (SELECT 1 FROM SubCategories WHERE SubCategoryName = 'Men''s Wear' AND CategoryId = @CatC)
    INSERT INTO SubCategories (SubCategoryName, CategoryId) VALUES ('Men''s Wear', @CatC);
IF @CatC IS NOT NULL AND NOT EXISTS (SELECT 1 FROM SubCategories WHERE SubCategoryName = 'Women''s Wear' AND CategoryId = @CatC)
    INSERT INTO SubCategories (SubCategoryName, CategoryId) VALUES ('Women''s Wear', @CatC);
IF @CatC IS NOT NULL AND NOT EXISTS (SELECT 1 FROM SubCategories WHERE SubCategoryName = 'Kid''s Wear' AND CategoryId = @CatC)
    INSERT INTO SubCategories (SubCategoryName, CategoryId) VALUES ('Kid''s Wear', @CatC);
IF @CatC IS NOT NULL AND NOT EXISTS (SELECT 1 FROM SubCategories WHERE SubCategoryName = 'Footwear' AND CategoryId = @CatC)
    INSERT INTO SubCategories (SubCategoryName, CategoryId) VALUES ('Footwear', @CatC);
IF @CatC IS NOT NULL AND NOT EXISTS (SELECT 1 FROM SubCategories WHERE SubCategoryName = 'Luggage & Bags' AND CategoryId = @CatC)
    INSERT INTO SubCategories (SubCategoryName, CategoryId) VALUES ('Luggage & Bags', @CatC);
IF @CatG IS NOT NULL AND NOT EXISTS (SELECT 1 FROM SubCategories WHERE SubCategoryName = 'Food & Grocery' AND CategoryId = @CatG)
    INSERT INTO SubCategories (SubCategoryName, CategoryId) VALUES ('Food & Grocery', @CatG);
IF @CatG IS NOT NULL AND NOT EXISTS (SELECT 1 FROM SubCategories WHERE SubCategoryName = 'Health Care' AND CategoryId = @CatG)
    INSERT INTO SubCategories (SubCategoryName, CategoryId) VALUES ('Health Care', @CatG);
IF @CatG IS NOT NULL AND NOT EXISTS (SELECT 1 FROM SubCategories WHERE SubCategoryName = 'Personal Care' AND CategoryId = @CatG)
    INSERT INTO SubCategories (SubCategoryName, CategoryId) VALUES ('Personal Care', @CatG);
IF @CatHACap IS NOT NULL AND NOT EXISTS (SELECT 1 FROM SubCategories WHERE SubCategoryName = 'Water Purifier' AND CategoryId = @CatHACap)
    INSERT INTO SubCategories (SubCategoryName, CategoryId) VALUES ('Water Purifier', @CatHACap);
GO
PRINT 'Inserted base subcategories.';

-- Seed PaymentMethods
IF NOT EXISTS (SELECT 1 FROM PaymentMethods WHERE MethodName = 'Cash on Delivery')
    INSERT INTO PaymentMethods (MethodName, Description) VALUES ('Cash on Delivery', 'Pay with cash upon delivery.');
IF NOT EXISTS (SELECT 1 FROM PaymentMethods WHERE MethodName = 'QR Code Payment')
    INSERT INTO PaymentMethods (MethodName, Description) VALUES ('QR Code Payment', 'Scan QR code to make payment.');
GO
PRINT 'Inserted base payment methods.';

-- Seed Colors
IF NOT EXISTS (SELECT 1 FROM Colors WHERE ColorName = 'Black')
    INSERT INTO Colors (ColorName, HexCode) VALUES
    ('Black', '#000000'), ('White', '#FFFFFF'), ('Blue', '#0000FF'), ('Navy', '#000080'),
    ('Lt Vintage blue', '#5B7C99'), ('Grey', '#808080'), ('Red', '#FF0000'), ('Green', '#008000');
GO
PRINT 'Inserted base colors.';

-- Seed Sizes
IF NOT EXISTS (SELECT 1 FROM Sizes WHERE SizeName = '28')
    INSERT INTO Sizes (SizeName, SizeCategory) VALUES
    ('28', 'Waist'), ('30', 'Waist'), ('32', 'Waist'), ('34', 'Waist'), ('36', 'Waist'), ('38', 'Waist'),
    ('S', 'General'), ('M', 'General'), ('L', 'General'), ('XL', 'General');
GO
PRINT 'Inserted base sizes.';

-- Seed Products
IF NOT EXISTS (SELECT 1 FROM Products WHERE ProductId = 1)
BEGIN
    INSERT INTO Products (ProductName, Description, Price, ImageUrl, Stock, SubCategoryId, IsDeleted) VALUES
    ('Smart TV 55 inch', '4K UHD Smart TV', 599.99, '', 50, (SELECT SubCategoryId FROM SubCategories WHERE SubCategoryName='Electronics'), 0),
    ('Washing Machine', 'Front Load 8kg', 450.00, '', 30, (SELECT SubCategoryId FROM SubCategories WHERE SubCategoryName='Household'), 0),
    ('Men''s Jeans', 'Blue Slim Fit Denim', 49.99, '', 100, (SELECT SubCategoryId FROM SubCategories WHERE SubCategoryName='Men''s Wear'), 0),
    ('Women''s Dress', 'Summer Floral Dress', 35.50, '', 75, (SELECT SubCategoryId FROM SubCategories WHERE SubCategoryName='Women''s Wear'), 0),
    ('Organic Apples', 'Fresh organic apples (1kg)', 3.20, '', 200, (SELECT SubCategoryId FROM SubCategories WHERE SubCategoryName='Food & Grocery'), 0);
    PRINT 'Inserted base products.';
END
GO

-- Seed Default Users
-- Admin user: admin@yelooo.in / password (BCrypt)
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'admin@yelooo.in')
BEGIN
    DECLARE @AdminRoleId INT = (SELECT RoleId FROM Roles WHERE RoleName = 'Admin');
    INSERT INTO Users (Username, Email, PasswordHash, CreatedAt, RoleId, FullName)
    VALUES (
        'admin',
        'admin@yelooo.in',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- password
        GETUTCDATE(),
        @AdminRoleId,
        'Administrator'
    );
    PRINT 'Created Admin user (admin@yelooo.in / password - CHANGE IN PRODUCTION)';
END
GO

-- Yelooo company user (for default referral)
IF NOT EXISTS (SELECT 1 FROM Users WHERE ReferralCode = 'YA000001')
BEGIN
    IF EXISTS (SELECT 1 FROM Users WHERE ReferralCode = 'YELOOO')
    BEGIN
        UPDATE Users SET ReferralCode = 'YA000001' WHERE ReferralCode = 'YELOOO';
        PRINT 'Updated Yelooo user: YELOOO -> YA000001';
    END
    ELSE
    BEGIN
        DECLARE @CustomerRoleId INT = (SELECT RoleId FROM Roles WHERE RoleName = 'Customer');
        IF @CustomerRoleId IS NULL SET @CustomerRoleId = 3; -- Fallback if role not found
        INSERT INTO Users (Username, Email, PasswordHash, CreatedAt, RoleId, ReferralCode, ReferralLevel, ReferredByUserId, JoinedViaReferral, FullName)
        VALUES (
            'yelooo', 'company@yelooo.in',
            '$2a$11$8K1p/a0dL1LXMIgoEDFrwOfMQD6mYPnQbGnJGnjnH7nJKxY/jY4Vi',
            GETUTCDATE(), @CustomerRoleId, 'YA000001', 1, NULL, 0, 'Yelooo'
        );
    PRINT 'Created Yelooo default user (YA000001)';
    END
END
GO

-- Fix nulls for existing users
UPDATE Users SET KycStatus = 'NotSubmitted' WHERE KycStatus IS NULL;
UPDATE Users SET Country = 'India' WHERE Country IS NULL;
-- Only generate referral code for customers without one
UPDATE Users SET ReferralCode = UPPER(LEFT(REPLACE(NEWID(), '-', ''), 8)) WHERE ReferralCode IS NULL AND RoleId = (SELECT RoleId FROM Roles WHERE RoleName = 'Customer');
UPDATE Users SET ReferralLevel = 1 WHERE ReferralLevel IS NULL AND RoleId = (SELECT RoleId FROM Roles WHERE RoleName = 'Customer');
GO
PRINT 'Fixed nulls for existing users.';

-- Initialize UserPointsBalance for existing customers
INSERT INTO UserPointsBalance (UserId, TotalPointsEarned, TotalPointsRedeemed, CurrentBalance)
SELECT u.UserId, 0, 0, 0
FROM Users u
WHERE u.RoleId = (SELECT RoleId FROM Roles WHERE RoleName = 'Customer')
AND u.UserId NOT IN (SELECT UserId FROM UserPointsBalance);
GO
PRINT 'Initialized UserPointsBalance for existing customers.';

-- Seed DeliveryStatuses
IF NOT EXISTS (SELECT 1 FROM DeliveryStatuses WHERE Value = 'Pending')
    INSERT INTO DeliveryStatuses (Value, Label, [Description], DisplayOrder) VALUES
    ('Pending', 'Pending', 'Order received, awaiting processing', 1),
    ('Processing', 'Processing', 'Order is being prepared', 2),
    ('Shipped', 'Shipped', 'Order has been shipped', 3),
    ('OutForDelivery', 'Out for Delivery', 'Order is out for delivery', 4),
    ('Delivered', 'Delivered', 'Order has been delivered', 5),
    ('Cancelled', 'Cancelled', 'Order has been cancelled', 6);
GO
PRINT 'Inserted default delivery statuses.';

-- Seed PVLevelConfig
IF NOT EXISTS (SELECT 1 FROM PVLevelConfig WHERE LevelId = 1)
    INSERT INTO PVLevelConfig (LevelId, LevelName, PVPercentage, Description) VALUES
    (1, 'Self (Purchaser)', 10.00, 'Customer who made the purchase'),
    (2, 'Direct Referrer', 40.00, 'Person who directly referred the purchaser'),
    (3, 'Level 3', 20.00, 'Second level upline'),
    (4, 'Level 4', 5.00, 'Third level upline'),
    (5, 'Level 5', 5.00, 'Fourth level upline'),
    (6, 'Level 6', 3.00, 'Fifth level upline'),
    (7, 'Level 7', 2.00, 'Sixth level upline'),
    (8, 'Level 8', 5.00, 'Seventh level upline');
GO
PRINT 'Inserted PV Level Configurations.';

-- Seed PointsRedemptionConfigs
IF NOT EXISTS (SELECT 1 FROM PointsRedemptionConfigs WHERE Id = 1)
    INSERT INTO PointsRedemptionConfigs (Id, PointsPerRupee) VALUES (1, 10);
GO
PRINT 'Inserted Points Redemption Configuration.';
PRINT 'All seed data inserted.';

-- =============================================
-- SECTION 5: CREATE VIEWS
-- Views are created last, after all tables and data are in place.
-- =============================================

PRINT 'Creating views...';
GO
CREATE VIEW vw_SellerOrderItems AS
SELECT
    oi.OrderItemId, oi.OrderId, oi.ProductId, p.ProductName, p.ImageUrl AS ProductImage,
    oi.Quantity, oi.UnitPrice, oi.Quantity * oi.UnitPrice AS TotalPrice,
    oi.SellerId, oi.ExpectedDeliveryDate, oi.ActualDeliveryDate, oi.DeliveryStatus, oi.TrackingNumber, oi.DeliveryNotes, oi.LastUpdatedAt,
    o.OrderDate, o.Status AS OrderStatus, o.UserId AS CustomerId,
    c.Username AS CustomerName, c.Email AS CustomerEmail, c.PhoneNumber AS CustomerPhone, c.Address AS CustomerAddress, c.City AS CustomerCity, c.State AS CustomerState, c.PinCode AS CustomerPinCode,
    ps.SellerId AS ProductSellerId
FROM OrderItems oi
INNER JOIN Orders o ON oi.OrderId = o.OrderId
INNER JOIN Products p ON oi.ProductId = p.ProductId
INNER JOIN Users c ON o.UserId = c.UserId
LEFT JOIN ProductSellers ps ON p.ProductId = ps.ProductId;
GO
PRINT 'Created vw_SellerOrderItems view.';
GO

CREATE VIEW vw_UserReferralNetwork AS
SELECT u.UserId, u.Username, u.Email, u.ReferralCode, u.ReferralLevel, u.ReferredByUserId, ru.Username AS ReferredByUsername, u.JoinedViaReferral, u.CreatedAt,
    (SELECT COUNT(*) FROM Users WHERE ReferredByUserId = u.UserId) AS DirectReferralsCount,
    (SELECT COUNT(*) FROM ReferralTree WHERE AncestorUserId = u.UserId) AS TotalDownlineCount
FROM Users u
LEFT JOIN Users ru ON u.ReferredByUserId = ru.UserId
WHERE u.RoleId = (SELECT RoleId FROM Roles WHERE RoleName = 'Customer');
GO
PRINT 'Created vw_UserReferralNetwork view.';
PRINT 'All views created.';

PRINT '';
PRINT '=============================================';
PRINT 'ECommerceDB Production Deployment Complete';
PRINT '=============================================';
PRINT 'Default Admin: admin@yelooo.in / password';
PRINT 'IMPORTANT: Change admin password on first login!';
PRINT '=============================================';
GO
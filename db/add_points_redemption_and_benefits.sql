-- Points redemption config and threshold benefits
-- Run after add_pv_points_system.sql

-- 1. Add redemption columns to Orders
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'PointsRedeemed')
BEGIN
    ALTER TABLE Orders ADD PointsRedeemed DECIMAL(18, 2) NOT NULL DEFAULT 0;
    ALTER TABLE Orders ADD PointsDiscountAmount DECIMAL(18, 2) NOT NULL DEFAULT 0;
    ALTER TABLE Orders ADD BenefitDiscountAmount DECIMAL(18, 2) NOT NULL DEFAULT 0;
    PRINT 'Added PointsRedeemed, PointsDiscountAmount, BenefitDiscountAmount to Orders';
END
GO

-- 2. Points Redemption Config (points per rupee)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PointsRedemptionConfigs')
BEGIN
    CREATE TABLE PointsRedemptionConfigs (
        Id INT PRIMARY KEY DEFAULT 1,
        PointsPerRupee DECIMAL(10, 2) NOT NULL DEFAULT 10,
        IsActive BIT NOT NULL DEFAULT 1,
        CONSTRAINT CK_PointsRedemptionConfig_Id CHECK (Id = 1)
    );
    INSERT INTO PointsRedemptionConfigs (Id, PointsPerRupee) VALUES (1, 10);
    PRINT 'Created PointsRedemptionConfigs';
END
GO

-- 3. Points Benefits (threshold-based benefits from admin)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PointsBenefits')
BEGIN
    CREATE TABLE PointsBenefits (
        PointsBenefitId INT IDENTITY(1,1) PRIMARY KEY,
        PointsThreshold DECIMAL(18, 2) NOT NULL,
        BenefitType NVARCHAR(50) NOT NULL,
        BenefitValue DECIMAL(10, 2) NOT NULL,
        Description NVARCHAR(200) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        DisplayOrder INT NOT NULL DEFAULT 0
    );
    PRINT 'Created PointsBenefits table';
END
GO

-- =============================================
-- PV (Point Value) Points System for MLM
-- =============================================
-- This script creates the points distribution system
-- Points are distributed across 8 levels on successful purchase

USE [Yelooo];
GO

-- =============================================
-- 1. Create PV Level Configuration Table
-- =============================================
-- This table stores configurable PV percentages for each level
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PVLevelConfig')
BEGIN
    CREATE TABLE PVLevelConfig (
        LevelId INT PRIMARY KEY,
        LevelName NVARCHAR(50) NOT NULL,
        PVPercentage DECIMAL(5, 2) NOT NULL,  -- Percentage of PV to distribute
        Description NVARCHAR(200) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NULL
    );
    PRINT 'Created PVLevelConfig table';
END
GO

-- Insert default PV percentages for 8 levels
-- Total PV = 10% of transaction value
-- Level percentages add up to 90% (10% retained by platform)
IF NOT EXISTS (SELECT * FROM PVLevelConfig WHERE LevelId = 1)
BEGIN
    INSERT INTO PVLevelConfig (LevelId, LevelName, PVPercentage, Description) VALUES
    (1, 'Self (Purchaser)', 10.00, 'Customer who made the purchase'),
    (2, 'Direct Referrer', 40.00, 'Person who directly referred the purchaser'),
    (3, 'Level 3', 20.00, 'Second level upline'),
    (4, 'Level 4', 5.00, 'Third level upline'),
    (5, 'Level 5', 5.00, 'Fourth level upline'),
    (6, 'Level 6', 3.00, 'Fifth level upline'),
    (7, 'Level 7', 2.00, 'Sixth level upline'),
    (8, 'Level 8', 5.00, 'Seventh level upline');
    PRINT 'Inserted default PV level configurations';
END
GO

-- =============================================
-- 2. Create User Points Balance Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserPointsBalance')
BEGIN
    CREATE TABLE UserPointsBalance (
        BalanceId INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        TotalPointsEarned DECIMAL(18, 2) NOT NULL DEFAULT 0,
        TotalPointsRedeemed DECIMAL(18, 2) NOT NULL DEFAULT 0,
        CurrentBalance DECIMAL(18, 2) NOT NULL DEFAULT 0,
        LastUpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_UserPointsBalance_User FOREIGN KEY (UserId) REFERENCES Users(UserId),
        CONSTRAINT UQ_UserPointsBalance_User UNIQUE (UserId)
    );
    PRINT 'Created UserPointsBalance table';
END
GO

-- =============================================
-- 3. Create Points Transaction History Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PointsTransactions')
BEGIN
    CREATE TABLE PointsTransactions (
        TransactionId INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        OrderId INT NULL,  -- Reference to the order that triggered points
        SourceUserId INT NULL,  -- User whose purchase generated these points
        TransactionType NVARCHAR(50) NOT NULL,  -- 'EARNED_SELF', 'EARNED_REFERRAL', 'REDEEMED', 'EXPIRED', 'ADJUSTMENT'
        LevelId INT NULL,  -- Which level earned these points
        OrderAmount DECIMAL(18, 2) NULL,  -- Original order amount
        TotalPV DECIMAL(18, 2) NULL,  -- Total PV from order (10% of order)
        PointsAmount DECIMAL(18, 2) NOT NULL,  -- Points credited/debited
        BalanceAfter DECIMAL(18, 2) NOT NULL,  -- Balance after this transaction
        Description NVARCHAR(500) NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_PointsTransactions_User FOREIGN KEY (UserId) REFERENCES Users(UserId),
        CONSTRAINT FK_PointsTransactions_Order FOREIGN KEY (OrderId) REFERENCES Orders(OrderId),
        CONSTRAINT FK_PointsTransactions_SourceUser FOREIGN KEY (SourceUserId) REFERENCES Users(UserId)
    );
    
    CREATE INDEX IX_PointsTransactions_UserId ON PointsTransactions(UserId);
    CREATE INDEX IX_PointsTransactions_OrderId ON PointsTransactions(OrderId);
    CREATE INDEX IX_PointsTransactions_CreatedAt ON PointsTransactions(CreatedAt);
    
    PRINT 'Created PointsTransactions table';
END
GO

-- =============================================
-- 4. Create Points Summary View for Reporting
-- =============================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_UserPointsSummary')
    DROP VIEW vw_UserPointsSummary;
GO

CREATE VIEW vw_UserPointsSummary AS
SELECT 
    u.UserId,
    u.Username,
    u.Email,
    u.FirstName,
    u.LastName,
    ISNULL(pb.TotalPointsEarned, 0) AS TotalPointsEarned,
    ISNULL(pb.TotalPointsRedeemed, 0) AS TotalPointsRedeemed,
    ISNULL(pb.CurrentBalance, 0) AS CurrentBalance,
    pb.LastUpdatedAt,
    (SELECT COUNT(*) FROM PointsTransactions pt WHERE pt.UserId = u.UserId AND pt.TransactionType LIKE 'EARNED%') AS TotalEarnTransactions,
    (SELECT ISNULL(SUM(pt.PointsAmount), 0) FROM PointsTransactions pt WHERE pt.UserId = u.UserId AND pt.TransactionType = 'EARNED_SELF') AS PointsFromOwnPurchases,
    (SELECT ISNULL(SUM(pt.PointsAmount), 0) FROM PointsTransactions pt WHERE pt.UserId = u.UserId AND pt.TransactionType = 'EARNED_REFERRAL') AS PointsFromReferrals
FROM Users u
LEFT JOIN UserPointsBalance pb ON u.UserId = pb.UserId
WHERE u.RoleId = 3;  -- Customers only
GO

PRINT 'Created vw_UserPointsSummary view';
GO

-- =============================================
-- 5. Create Stored Procedure for Points Distribution
-- =============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_DistributeOrderPoints')
    DROP PROCEDURE sp_DistributeOrderPoints;
GO

CREATE PROCEDURE sp_DistributeOrderPoints
    @OrderId INT,
    @CustomerId INT,
    @OrderAmount DECIMAL(18, 2)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Calculate total PV (10% of order amount)
    DECLARE @TotalPV DECIMAL(18, 2) = @OrderAmount * 0.10;
    
    -- Temporary table to hold users who will receive points
    DECLARE @PointsDistribution TABLE (
        UserId INT,
        LevelId INT,
        PVPercentage DECIMAL(5, 2),
        PointsToCredit DECIMAL(18, 2)
    );
    
    -- Level 1: Self (the customer who made the purchase)
    INSERT INTO @PointsDistribution (UserId, LevelId, PVPercentage, PointsToCredit)
    SELECT @CustomerId, 1, PVPercentage, @TotalPV * (PVPercentage / 100)
    FROM PVLevelConfig WHERE LevelId = 1 AND IsActive = 1;
    
    -- Levels 2-8: Upline chain
    DECLARE @CurrentUserId INT = @CustomerId;
    DECLARE @CurrentLevel INT = 2;
    DECLARE @ReferrerId INT;
    
    WHILE @CurrentLevel <= 8
    BEGIN
        -- Get the referrer of current user
        SELECT @ReferrerId = ReferredByUserId FROM Users WHERE UserId = @CurrentUserId;
        
        -- If no referrer, stop
        IF @ReferrerId IS NULL
            BREAK;
        
        -- Add to distribution
        INSERT INTO @PointsDistribution (UserId, LevelId, PVPercentage, PointsToCredit)
        SELECT @ReferrerId, @CurrentLevel, PVPercentage, @TotalPV * (PVPercentage / 100)
        FROM PVLevelConfig WHERE LevelId = @CurrentLevel AND IsActive = 1;
        
        -- Move up the chain
        SET @CurrentUserId = @ReferrerId;
        SET @CurrentLevel = @CurrentLevel + 1;
    END
    
    -- Now distribute points to each user
    DECLARE @UserId INT, @LevelId INT, @Points DECIMAL(18, 2), @NewBalance DECIMAL(18, 2);
    DECLARE @TransactionType NVARCHAR(50);
    
    DECLARE points_cursor CURSOR FOR
    SELECT UserId, LevelId, PointsToCredit FROM @PointsDistribution WHERE PointsToCredit > 0;
    
    OPEN points_cursor;
    FETCH NEXT FROM points_cursor INTO @UserId, @LevelId, @Points;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Ensure user has a balance record
        IF NOT EXISTS (SELECT 1 FROM UserPointsBalance WHERE UserId = @UserId)
        BEGIN
            INSERT INTO UserPointsBalance (UserId, TotalPointsEarned, TotalPointsRedeemed, CurrentBalance)
            VALUES (@UserId, 0, 0, 0);
        END
        
        -- Update balance
        UPDATE UserPointsBalance
        SET TotalPointsEarned = TotalPointsEarned + @Points,
            CurrentBalance = CurrentBalance + @Points,
            LastUpdatedAt = GETDATE()
        WHERE UserId = @UserId;
        
        -- Get new balance
        SELECT @NewBalance = CurrentBalance FROM UserPointsBalance WHERE UserId = @UserId;
        
        -- Determine transaction type
        SET @TransactionType = CASE WHEN @LevelId = 1 THEN 'EARNED_SELF' ELSE 'EARNED_REFERRAL' END;
        
        -- Record transaction
        INSERT INTO PointsTransactions (UserId, OrderId, SourceUserId, TransactionType, LevelId, OrderAmount, TotalPV, PointsAmount, BalanceAfter, Description)
        VALUES (
            @UserId, 
            @OrderId, 
            @CustomerId,
            @TransactionType,
            @LevelId,
            @OrderAmount,
            @TotalPV,
            @Points,
            @NewBalance,
            CASE 
                WHEN @LevelId = 1 THEN 'Points earned from own purchase'
                ELSE 'Points earned from Level ' + CAST(@LevelId - 1 AS NVARCHAR) + ' referral purchase'
            END
        );
        
        FETCH NEXT FROM points_cursor INTO @UserId, @LevelId, @Points;
    END
    
    CLOSE points_cursor;
    DEALLOCATE points_cursor;
    
    -- Return distribution summary
    SELECT 
        pd.UserId,
        u.Username,
        pd.LevelId,
        lc.LevelName,
        pd.PVPercentage,
        pd.PointsToCredit AS PointsCredited
    FROM @PointsDistribution pd
    JOIN Users u ON pd.UserId = u.UserId
    JOIN PVLevelConfig lc ON pd.LevelId = lc.LevelId
    WHERE pd.PointsToCredit > 0
    ORDER BY pd.LevelId;
END
GO

PRINT 'Created sp_DistributeOrderPoints stored procedure';
GO

-- =============================================
-- 6. Initialize balance records for existing customers
-- =============================================
INSERT INTO UserPointsBalance (UserId, TotalPointsEarned, TotalPointsRedeemed, CurrentBalance)
SELECT UserId, 0, 0, 0
FROM Users
WHERE RoleId = 3
AND UserId NOT IN (SELECT UserId FROM UserPointsBalance);

PRINT 'Initialized points balance for existing customers';
GO

PRINT '';
PRINT '=============================================';
PRINT 'PV Points System setup completed successfully!';
PRINT '=============================================';
PRINT '';
PRINT 'PV Distribution Configuration:';
PRINT '  - Total PV = 10% of order amount';
PRINT '  - Level 1 (Self): 10% of PV';
PRINT '  - Level 2 (Referrer): 40% of PV';
PRINT '  - Level 3: 20% of PV';
PRINT '  - Level 4: 5% of PV';
PRINT '  - Level 5: 5% of PV';
PRINT '  - Level 6: 3% of PV';
PRINT '  - Level 7: 2% of PV';
PRINT '  - Level 8: 5% of PV';
PRINT '';
GO

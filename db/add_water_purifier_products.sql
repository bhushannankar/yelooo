-- =====================================================
-- Database Script: Water Purifier Products
-- Description: Adds tertiary/quaternary category columns and water purifier products
-- =====================================================

USE ECommerceDB;
GO

-- =====================================================
-- Step 1: Add TertiaryCategoryId and QuaternaryCategoryId to Products table
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'TertiaryCategoryId')
BEGIN
    ALTER TABLE Products ADD TertiaryCategoryId INT NULL;
    ALTER TABLE Products ADD CONSTRAINT FK_Products_TertiaryCategories 
        FOREIGN KEY (TertiaryCategoryId) REFERENCES TertiaryCategories(TertiaryCategoryId);
    PRINT 'Added TertiaryCategoryId column to Products table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'QuaternaryCategoryId')
BEGIN
    ALTER TABLE Products ADD QuaternaryCategoryId INT NULL;
    ALTER TABLE Products ADD CONSTRAINT FK_Products_QuaternaryCategories 
        FOREIGN KEY (QuaternaryCategoryId) REFERENCES QuaternaryCategories(QuaternaryCategoryId);
    PRINT 'Added QuaternaryCategoryId column to Products table';
END
GO

-- =====================================================
-- Step 2: Get Category IDs
-- =====================================================

DECLARE @WaterPurifierSubCategoryId INT;
DECLARE @DomesticTertiaryId INT;
DECLARE @CommercialTertiaryId INT;
DECLARE @IndustrialTertiaryId INT;
DECLARE @PremiumQuaternaryId INT;
DECLARE @RegularQuaternaryId INT;

SELECT @WaterPurifierSubCategoryId = SubCategoryId FROM SubCategories WHERE SubCategoryName = 'Water Purifier';
SELECT @DomesticTertiaryId = TertiaryCategoryId FROM TertiaryCategories WHERE TertiaryCategoryName = 'Domestic';
SELECT @CommercialTertiaryId = TertiaryCategoryId FROM TertiaryCategories WHERE TertiaryCategoryName = 'Commercial';
SELECT @IndustrialTertiaryId = TertiaryCategoryId FROM TertiaryCategories WHERE TertiaryCategoryName = 'Industrial';
SELECT @PremiumQuaternaryId = QuaternaryCategoryId FROM QuaternaryCategories WHERE QuaternaryCategoryName = 'Premium';
SELECT @RegularQuaternaryId = QuaternaryCategoryId FROM QuaternaryCategories WHERE QuaternaryCategoryName = 'Regular';

PRINT 'Water Purifier SubCategoryId: ' + CAST(ISNULL(@WaterPurifierSubCategoryId, 0) AS VARCHAR);
PRINT 'Domestic TertiaryId: ' + CAST(ISNULL(@DomesticTertiaryId, 0) AS VARCHAR);
PRINT 'Commercial TertiaryId: ' + CAST(ISNULL(@CommercialTertiaryId, 0) AS VARCHAR);
PRINT 'Industrial TertiaryId: ' + CAST(ISNULL(@IndustrialTertiaryId, 0) AS VARCHAR);
PRINT 'Premium QuaternaryId: ' + CAST(ISNULL(@PremiumQuaternaryId, 0) AS VARCHAR);
PRINT 'Regular QuaternaryId: ' + CAST(ISNULL(@RegularQuaternaryId, 0) AS VARCHAR);

-- =====================================================
-- Step 3: Insert Premium Domestic Water Purifiers
-- =====================================================

IF @WaterPurifierSubCategoryId IS NOT NULL AND @DomesticTertiaryId IS NOT NULL AND @PremiumQuaternaryId IS NOT NULL
BEGIN
    -- Premium Domestic Product 1
    IF NOT EXISTS (SELECT 1 FROM Products WHERE ProductName = 'AquaPure Pro 9000 RO+UV+UF')
    BEGIN
        INSERT INTO Products (ProductName, Description, Price, ImageUrl, Stock, SubCategoryId, TertiaryCategoryId, QuaternaryCategoryId, BrandName, ShortDescription)
        VALUES (
            'AquaPure Pro 9000 RO+UV+UF',
            'Advanced 9-stage purification with RO+UV+UF technology. Features smart TDS controller, mineral cartridge, and 10L storage tank. Ideal for homes with TDS up to 2000 ppm. Energy efficient with auto shut-off feature.',
            24999.00,
            '/images/products/water-purifier-premium-1.jpg',
            50,
            @WaterPurifierSubCategoryId,
            @DomesticTertiaryId,
            @PremiumQuaternaryId,
            'AquaPure',
            'Premium 9-stage RO+UV+UF water purifier with mineral boost'
        );
        PRINT 'Inserted: AquaPure Pro 9000 RO+UV+UF';
    END

    -- Premium Domestic Product 2
    IF NOT EXISTS (SELECT 1 FROM Products WHERE ProductName = 'Kent Supreme Plus 2024')
    BEGIN
        INSERT INTO Products (ProductName, Description, Price, ImageUrl, Stock, SubCategoryId, TertiaryCategoryId, QuaternaryCategoryId, BrandName, ShortDescription)
        VALUES (
            'Kent Supreme Plus 2024',
            'Zero water wastage technology with digital display. Multiple purification process with RO+UV+UF+TDS Control. 8L storage capacity with high purification rate of 20L/hour. Wall-mountable design with filter change alert.',
            32999.00,
            '/images/products/water-purifier-premium-2.jpg',
            35,
            @WaterPurifierSubCategoryId,
            @DomesticTertiaryId,
            @PremiumQuaternaryId,
            'Kent',
            'Zero wastage RO+UV+UF purifier with digital display'
        );
        PRINT 'Inserted: Kent Supreme Plus 2024';
    END

    -- Premium Domestic Product 3
    IF NOT EXISTS (SELECT 1 FROM Products WHERE ProductName = 'Livpure Zinger Copper Hot')
    BEGIN
        INSERT INTO Products (ProductName, Description, Price, ImageUrl, Stock, SubCategoryId, TertiaryCategoryId, QuaternaryCategoryId, BrandName, ShortDescription)
        VALUES (
            'Livpure Zinger Copper Hot',
            'Copper infusion technology for added health benefits. Hot and normal water dispenser with 7-stage purification. RO+UV+UF with mineralizer. 8.5L tank with stainless steel storage. Smart LED indicators.',
            28500.00,
            '/images/products/water-purifier-premium-3.jpg',
            40,
            @WaterPurifierSubCategoryId,
            @DomesticTertiaryId,
            @PremiumQuaternaryId,
            'Livpure',
            'Copper + Hot water RO purifier with 7-stage filtration'
        );
        PRINT 'Inserted: Livpure Zinger Copper Hot';
    END
END

-- =====================================================
-- Step 4: Insert Regular Domestic Water Purifiers
-- =====================================================

IF @WaterPurifierSubCategoryId IS NOT NULL AND @DomesticTertiaryId IS NOT NULL AND @RegularQuaternaryId IS NOT NULL
BEGIN
    -- Regular Domestic Product 1
    IF NOT EXISTS (SELECT 1 FROM Products WHERE ProductName = 'Aquaguard Aura 7L')
    BEGIN
        INSERT INTO Products (ProductName, Description, Price, ImageUrl, Stock, SubCategoryId, TertiaryCategoryId, QuaternaryCategoryId, BrandName, ShortDescription)
        VALUES (
            'Aquaguard Aura 7L',
            'RO+UV+MTDS purification technology. 7-liter storage tank suitable for family of 4-5. Active copper technology for immunity boost. Energy saving mode with auto shut-off. Wall mountable.',
            12999.00,
            '/images/products/water-purifier-regular-1.jpg',
            100,
            @WaterPurifierSubCategoryId,
            @DomesticTertiaryId,
            @RegularQuaternaryId,
            'Aquaguard',
            'Essential RO+UV water purifier for daily use'
        );
        PRINT 'Inserted: Aquaguard Aura 7L';
    END

    -- Regular Domestic Product 2
    IF NOT EXISTS (SELECT 1 FROM Products WHERE ProductName = 'Pureit Eco Water Saver')
    BEGIN
        INSERT INTO Products (ProductName, Description, Price, ImageUrl, Stock, SubCategoryId, TertiaryCategoryId, QuaternaryCategoryId, BrandName, ShortDescription)
        VALUES (
            'Pureit Eco Water Saver',
            'Eco recovery technology saves up to 80 glasses of water daily. RO+UV+MF purification. 10L storage capacity. Suitable for TDS up to 2000 ppm. Compact design with smartsense indicators.',
            10499.00,
            '/images/products/water-purifier-regular-2.jpg',
            120,
            @WaterPurifierSubCategoryId,
            @DomesticTertiaryId,
            @RegularQuaternaryId,
            'Pureit',
            'Eco-friendly RO purifier with water saving technology'
        );
        PRINT 'Inserted: Pureit Eco Water Saver';
    END

    -- Regular Domestic Product 3
    IF NOT EXISTS (SELECT 1 FROM Products WHERE ProductName = 'Blue Star Aristo RO+UV')
    BEGIN
        INSERT INTO Products (ProductName, Description, Price, ImageUrl, Stock, SubCategoryId, TertiaryCategoryId, QuaternaryCategoryId, BrandName, ShortDescription)
        VALUES (
            'Blue Star Aristo RO+UV',
            '6-stage purification with Aqua Taste Booster. 7L storage with child lock feature. Double layered RO+UV protection. Suitable for borewell and tanker water. Easy maintenance design.',
            9999.00,
            '/images/products/water-purifier-regular-3.jpg',
            80,
            @WaterPurifierSubCategoryId,
            @DomesticTertiaryId,
            @RegularQuaternaryId,
            'Blue Star',
            'Affordable 6-stage RO+UV purifier with child lock'
        );
        PRINT 'Inserted: Blue Star Aristo RO+UV';
    END
END

-- =====================================================
-- Step 5: Insert Commercial Water Purifiers
-- =====================================================

IF @WaterPurifierSubCategoryId IS NOT NULL AND @CommercialTertiaryId IS NOT NULL
BEGIN
    -- Commercial Product 1
    IF NOT EXISTS (SELECT 1 FROM Products WHERE ProductName = 'Aquafresh Commercial 50 LPH')
    BEGIN
        INSERT INTO Products (ProductName, Description, Price, ImageUrl, Stock, SubCategoryId, TertiaryCategoryId, QuaternaryCategoryId, BrandName, ShortDescription)
        VALUES (
            'Aquafresh Commercial 50 LPH',
            '50 liters per hour capacity ideal for offices and small businesses. 5-stage RO purification with UV sterilization. Stainless steel storage tank of 50L. Auto flush system for membrane protection. Low maintenance design.',
            45000.00,
            '/images/products/water-purifier-commercial-1.jpg',
            25,
            @WaterPurifierSubCategoryId,
            @CommercialTertiaryId,
            NULL,
            'Aquafresh',
            '50 LPH commercial RO system for offices'
        );
        PRINT 'Inserted: Aquafresh Commercial 50 LPH';
    END

    -- Commercial Product 2
    IF NOT EXISTS (SELECT 1 FROM Products WHERE ProductName = 'Kent Commercial 100 LPH')
    BEGIN
        INSERT INTO Products (ProductName, Description, Price, ImageUrl, Stock, SubCategoryId, TertiaryCategoryId, QuaternaryCategoryId, BrandName, ShortDescription)
        VALUES (
            'Kent Commercial 100 LPH',
            '100 liters per hour high capacity for restaurants and hotels. Advanced RO+UV+UF purification. 100L SS storage tank included. Digital TDS display and auto-flush. AMC support available.',
            75000.00,
            '/images/products/water-purifier-commercial-2.jpg',
            15,
            @WaterPurifierSubCategoryId,
            @CommercialTertiaryId,
            NULL,
            'Kent',
            '100 LPH heavy-duty commercial water purifier'
        );
        PRINT 'Inserted: Kent Commercial 100 LPH';
    END

    -- Commercial Product 3
    IF NOT EXISTS (SELECT 1 FROM Products WHERE ProductName = 'Livpure Commercial Touch 200')
    BEGIN
        INSERT INTO Products (ProductName, Description, Price, ImageUrl, Stock, SubCategoryId, TertiaryCategoryId, QuaternaryCategoryId, BrandName, ShortDescription)
        VALUES (
            'Livpure Commercial Touch 200',
            '200 LPH capacity for large commercial establishments. Touch panel with real-time monitoring. Multi-stage RO with antiscalant dosing. 200L storage with automatic level control. Remote monitoring capability.',
            125000.00,
            '/images/products/water-purifier-commercial-3.jpg',
            10,
            @WaterPurifierSubCategoryId,
            @CommercialTertiaryId,
            NULL,
            'Livpure',
            '200 LPH touch-enabled commercial purification system'
        );
        PRINT 'Inserted: Livpure Commercial Touch 200';
    END
END

-- =====================================================
-- Step 6: Insert Industrial Water Purifiers
-- =====================================================

IF @WaterPurifierSubCategoryId IS NOT NULL AND @IndustrialTertiaryId IS NOT NULL
BEGIN
    -- Industrial Product 1
    IF NOT EXISTS (SELECT 1 FROM Products WHERE ProductName = 'AquaTech Industrial 500 LPH')
    BEGIN
        INSERT INTO Products (ProductName, Description, Price, ImageUrl, Stock, SubCategoryId, TertiaryCategoryId, QuaternaryCategoryId, BrandName, ShortDescription)
        VALUES (
            'AquaTech Industrial 500 LPH',
            '500 liters per hour industrial grade RO plant. Multi-stage filtration with sediment, carbon, and RO membranes. FRP pressure vessels with SS frame. Automatic operation with PLC control. Suitable for manufacturing units.',
            250000.00,
            '/images/products/water-purifier-industrial-1.jpg',
            8,
            @WaterPurifierSubCategoryId,
            @IndustrialTertiaryId,
            NULL,
            'AquaTech',
            '500 LPH industrial RO plant with PLC control'
        );
        PRINT 'Inserted: AquaTech Industrial 500 LPH';
    END

    -- Industrial Product 2
    IF NOT EXISTS (SELECT 1 FROM Products WHERE ProductName = 'HydroMax Industrial 1000 LPH')
    BEGIN
        INSERT INTO Products (ProductName, Description, Price, ImageUrl, Stock, SubCategoryId, TertiaryCategoryId, QuaternaryCategoryId, BrandName, ShortDescription)
        VALUES (
            'HydroMax Industrial 1000 LPH',
            '1000 LPH high-capacity industrial water treatment system. Pre-treatment with multimedia filter and activated carbon. High rejection RO membranes with CIP system. SCADA compatible for remote monitoring. Energy efficient design.',
            450000.00,
            '/images/products/water-purifier-industrial-2.jpg',
            5,
            @WaterPurifierSubCategoryId,
            @IndustrialTertiaryId,
            NULL,
            'HydroMax',
            '1000 LPH industrial water treatment plant'
        );
        PRINT 'Inserted: HydroMax Industrial 1000 LPH';
    END

    -- Industrial Product 3
    IF NOT EXISTS (SELECT 1 FROM Products WHERE ProductName = 'PureFlow Industrial 2000 LPH')
    BEGIN
        INSERT INTO Products (ProductName, Description, Price, ImageUrl, Stock, SubCategoryId, TertiaryCategoryId, QuaternaryCategoryId, BrandName, ShortDescription)
        VALUES (
            'PureFlow Industrial 2000 LPH',
            '2000 LPH mega capacity for large industries. Complete water treatment solution with softener and RO. Automatic backwash and regeneration. Real-time quality monitoring with data logging. 24/7 technical support included.',
            750000.00,
            '/images/products/water-purifier-industrial-3.jpg',
            3,
            @WaterPurifierSubCategoryId,
            @IndustrialTertiaryId,
            NULL,
            'PureFlow',
            '2000 LPH complete industrial water treatment solution'
        );
        PRINT 'Inserted: PureFlow Industrial 2000 LPH';
    END
END

-- =====================================================
-- Step 7: Verify the data
-- =====================================================

PRINT '';
PRINT '========== Water Purifier Products Summary ==========';

SELECT 
    p.ProductId,
    p.ProductName,
    p.BrandName,
    p.Price,
    p.Stock,
    s.SubCategoryName,
    t.TertiaryCategoryName,
    q.QuaternaryCategoryName
FROM Products p
INNER JOIN SubCategories s ON p.SubCategoryId = s.SubCategoryId
LEFT JOIN TertiaryCategories t ON p.TertiaryCategoryId = t.TertiaryCategoryId
LEFT JOIN QuaternaryCategories q ON p.QuaternaryCategoryId = q.QuaternaryCategoryId
WHERE s.SubCategoryName = 'Water Purifier'
ORDER BY t.TertiaryCategoryName, q.QuaternaryCategoryName, p.ProductName;

GO

PRINT '';
PRINT 'Script completed successfully!';

-- Seed Dummy Products with Images
-- Run this script after the base schema and variant tables are created
-- Images use Unsplash free stock photos (direct URLs)

USE ECommerceDB;
GO

-- =============================================
-- CLEAR EXISTING DATA (Optional - uncomment if needed)
-- =============================================
-- DELETE FROM ProductImages;
-- DELETE FROM ProductSpecifications;
-- DELETE FROM ProductVariants;
-- DELETE FROM Products WHERE ProductId > 5;

-- =============================================
-- CATEGORY 1: HOME APPLIANCES
-- =============================================

-- SubCategory 1: Electronics
INSERT INTO Products (ProductName, Description, Price, ImageUrl, Stock, SubCategoryId, BrandName, ShortDescription)
VALUES 
('Samsung 55" 4K Smart TV', 'Experience stunning 4K Ultra HD resolution with Samsung Crystal UHD technology. Smart TV features include voice control, streaming apps, and screen mirroring.', 699.99, 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500', 25, 1, 'Samsung', 'Crystal UHD 4K Smart TV with HDR'),

('Sony Wireless Headphones', 'Premium noise-cancelling wireless headphones with 30-hour battery life. Features adaptive sound control and speak-to-chat technology.', 349.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', 50, 1, 'Sony', 'WH-1000XM4 Noise Cancelling Headphones'),

('Apple MacBook Air M2', 'Supercharged by the M2 chip. 13.6-inch Liquid Retina display, 8GB RAM, 256GB SSD. Up to 18 hours battery life.', 1199.00, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500', 15, 1, 'Apple', 'M2 Chip, 13.6" Liquid Retina Display'),

('JBL Bluetooth Speaker', 'Portable waterproof speaker with powerful JBL Original Pro Sound. 12 hours of playtime. IP67 waterproof and dustproof.', 129.99, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500', 75, 1, 'JBL', 'Flip 6 Portable Waterproof Speaker'),

('Canon EOS Camera', 'Professional DSLR camera with 24.1 Megapixel CMOS sensor. Built-in WiFi and Bluetooth. 4K video recording.', 849.00, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500', 20, 1, 'Canon', 'EOS Rebel T8i DSLR Camera');

-- SubCategory 2: Household
INSERT INTO Products (ProductName, Description, Price, ImageUrl, Stock, SubCategoryId, BrandName, ShortDescription)
VALUES 
('Dyson V15 Vacuum', 'Cordless vacuum with laser dust detection. Intelligently adapts suction power. Up to 60 minutes runtime.', 749.99, 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500', 30, 2, 'Dyson', 'Cordless Vacuum with Laser Detection'),

('Instant Pot Duo', '7-in-1 electric pressure cooker. Pressure cook, slow cook, rice cooker, steamer, sauté, yogurt maker, and warmer.', 89.99, 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=500', 60, 2, 'Instant Pot', '7-in-1 Electric Pressure Cooker 6Qt'),

('Ninja Air Fryer', 'Extra large capacity air fryer with 4 cooking functions. Air fry, roast, reheat, and dehydrate with up to 75% less fat.', 119.99, 'https://images.unsplash.com/photo-1626509653291-18d9a934b9db?w=500', 45, 2, 'Ninja', 'AF101 4Qt Air Fryer'),

('KitchenAid Stand Mixer', 'Iconic tilt-head stand mixer with 10 speeds. 5-quart stainless steel bowl. Perfect for baking and cooking.', 449.99, 'https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?w=500', 20, 2, 'KitchenAid', 'Artisan Series 5Qt Stand Mixer'),

('Philips Air Purifier', 'HEPA air purifier for rooms up to 800 sq ft. Removes 99.97% of allergens, dust, and pollutants. Smart sensor display.', 299.99, 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500', 35, 2, 'Philips', 'Series 2000 Air Purifier');

-- =============================================
-- CATEGORY 2: CLOTHES
-- =============================================

-- SubCategory 3: Men's Wear
INSERT INTO Products (ProductName, Description, Price, ImageUrl, Stock, SubCategoryId, BrandName, ShortDescription)
VALUES 
('Levi''s 501 Original Jeans', 'The original blue jean since 1873. Straight leg, button fly, sits at waist. 100% cotton denim.', 79.99, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500', 100, 3, 'Levi''s', 'Original Fit Button Fly Jeans'),

('Nike Dri-FIT T-Shirt', 'Lightweight training t-shirt with sweat-wicking technology. Breathable mesh fabric. Standard fit.', 35.00, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500', 150, 3, 'Nike', 'Dri-FIT Training T-Shirt'),

('Ralph Lauren Polo Shirt', 'Classic fit polo shirt with signature pony embroidery. Soft cotton mesh. Ribbed collar and armbands.', 98.50, 'https://images.unsplash.com/photo-1625910513413-5fc45d0096b5?w=500', 80, 3, 'Ralph Lauren', 'Classic Fit Mesh Polo'),

('Tommy Hilfiger Blazer', 'Modern fit blazer with two-button closure. Notch lapel, chest pocket, flap pockets. Perfect for business casual.', 225.00, 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500', 40, 3, 'Tommy Hilfiger', 'Modern Fit Sport Coat'),

('Adidas Track Pants', 'Iconic 3-stripes track pants. Elastic waist with drawcord. Side pockets with zip closure.', 65.00, 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500', 120, 3, 'Adidas', 'Originals 3-Stripes Track Pants');

-- SubCategory 4: Women's Wear
INSERT INTO Products (ProductName, Description, Price, ImageUrl, Stock, SubCategoryId, BrandName, ShortDescription)
VALUES 
('Zara Floral Maxi Dress', 'Flowing maxi dress with beautiful floral print. V-neckline, short sleeves, tiered skirt. Perfect for summer.', 69.90, 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500', 60, 4, 'Zara', 'Floral Print Flowing Maxi Dress'),

('H&M Ribbed Knit Sweater', 'Soft ribbed knit sweater with round neckline. Relaxed fit, long sleeves. Available in multiple colors.', 34.99, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500', 90, 4, 'H&M', 'Relaxed Fit Ribbed Sweater'),

('Mango Tailored Blazer', 'Structured blazer with peak lapels. Double-breasted button closure. Fully lined. Office to evening wear.', 119.99, 'https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=500', 45, 4, 'Mango', 'Double-Breasted Tailored Blazer'),

('Free People Bohemian Top', 'Embroidered peasant blouse with tie neckline. Bell sleeves, relaxed fit. Boho-chic style.', 88.00, 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=500', 55, 4, 'Free People', 'Embroidered Peasant Blouse'),

('Lululemon Yoga Leggings', 'High-rise yoga leggings with buttery-soft fabric. Four-way stretch, sweat-wicking. Hidden waistband pocket.', 98.00, 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=500', 85, 4, 'Lululemon', 'Align High-Rise Yoga Pants');

-- SubCategory 5: Kid's Wear
INSERT INTO Products (ProductName, Description, Price, ImageUrl, Stock, SubCategoryId, BrandName, ShortDescription)
VALUES 
('Carter''s Dinosaur Pajamas', 'Cozy cotton pajama set with fun dinosaur print. Snug fit, flame resistant. Sizes 2T-5T.', 24.00, 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500', 100, 5, 'Carter''s', '2-Piece Cotton Pajama Set'),

('Gap Kids Hoodie', 'Soft fleece hoodie with kangaroo pocket. Logo graphic on front. Machine washable.', 44.95, 'https://images.unsplash.com/photo-1503944168849-8bf86875bbd8?w=500', 75, 5, 'Gap Kids', 'Logo Fleece Pullover Hoodie'),

('OshKosh Overalls', 'Classic denim overalls with adjustable straps. Multiple pockets. Durable and comfortable.', 38.00, 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=500', 60, 5, 'OshKosh', 'Classic Denim Overalls'),

('Mini Boden Party Dress', 'Sparkly tulle party dress with sequin bodice. Perfect for special occasions. Sizes 2-12 years.', 65.00, 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=500', 40, 5, 'Mini Boden', 'Sparkle Tulle Party Dress'),

('Nike Kids Sneakers', 'Lightweight running shoes for active kids. Cushioned sole, breathable mesh upper. Easy slip-on design.', 55.00, 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=500', 90, 5, 'Nike', 'Revolution 6 Kids Running Shoes');

-- SubCategory 6: Footwear
INSERT INTO Products (ProductName, Description, Price, ImageUrl, Stock, SubCategoryId, BrandName, ShortDescription)
VALUES 
('Nike Air Max 270', 'Lifestyle sneaker with visible Air unit for all-day comfort. Mesh upper, rubber outsole. Multiple colorways.', 150.00, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', 80, 6, 'Nike', 'Air Max 270 Lifestyle Shoes'),

('Adidas Ultraboost', 'Premium running shoes with responsive Boost cushioning. Primeknit upper, Continental rubber outsole.', 180.00, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500', 65, 6, 'Adidas', 'Ultraboost 22 Running Shoes'),

('Timberland Premium Boots', 'Iconic waterproof boots with premium leather. Padded collar, rubber lug outsole. Built to last.', 198.00, 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=500', 50, 6, 'Timberland', '6-Inch Premium Waterproof Boots'),

('Steve Madden Heels', 'Classic pointed-toe stiletto heels. Faux leather upper, cushioned insole. 4-inch heel height.', 89.95, 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500', 55, 6, 'Steve Madden', 'Pointed Toe Stiletto Pumps'),

('Birkenstock Arizona', 'Classic two-strap sandal with contoured cork footbed. Adjustable buckles. Made in Germany.', 135.00, 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=500', 70, 6, 'Birkenstock', 'Arizona Classic Sandals');

-- SubCategory 7: Luggage & Bags
INSERT INTO Products (ProductName, Description, Price, ImageUrl, Stock, SubCategoryId, BrandName, ShortDescription)
VALUES 
('Samsonite Carry-On', 'Hardside spinner carry-on with TSA lock. Expandable, lightweight polycarbonate shell. 360-degree wheels.', 179.99, 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=500', 40, 7, 'Samsonite', 'Omni PC Hardside 20" Spinner'),

('Herschel Backpack', 'Classic backpack with signature striped fabric liner. Padded laptop sleeve, front storage pocket.', 74.99, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', 85, 7, 'Herschel', 'Classic Backpack XL'),

('Tumi Laptop Bag', 'Professional laptop briefcase with ballistic nylon exterior. Padded compartments, multiple pockets.', 395.00, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500', 25, 7, 'Tumi', 'Alpha 3 Slim Deluxe Portfolio'),

('Longchamp Le Pliage', 'Iconic foldable tote bag with leather trim. Water-resistant nylon, zip closure. Perfect for travel.', 145.00, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500', 60, 7, 'Longchamp', 'Le Pliage Original Large Tote'),

('Away Checked Luggage', 'Large checked suitcase with durable polycarbonate shell. Interior compression system, TSA lock.', 295.00, 'https://images.unsplash.com/photo-1581553680321-4fffae59fccd?w=500', 30, 7, 'Away', 'The Large Checked Suitcase');

-- =============================================
-- CATEGORY 3: GROCERY
-- =============================================

-- SubCategory 8: Food & Grocery
INSERT INTO Products (ProductName, Description, Price, ImageUrl, Stock, SubCategoryId, BrandName, ShortDescription)
VALUES 
('Organic Extra Virgin Olive Oil', 'Cold-pressed extra virgin olive oil from Italian olives. Rich flavor, perfect for cooking and dressings.', 18.99, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500', 100, 8, 'Colavita', '750ml Premium Italian Olive Oil'),

('Manuka Honey', 'Raw Manuka honey from New Zealand with UMF 15+ rating. Natural antibacterial properties.', 45.00, 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500', 50, 8, 'Comvita', 'UMF 15+ Manuka Honey 250g'),

('Organic Quinoa', 'Pre-washed organic white quinoa. High in protein and fiber. Gluten-free superfood.', 8.99, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500', 150, 8, 'Bob''s Red Mill', 'Organic White Quinoa 24oz'),

('Almond Butter', 'Creamy almond butter made from dry-roasted almonds. No added sugar, oil, or salt. Keto-friendly.', 12.99, 'https://images.unsplash.com/photo-1612187715738-18f7d9b66093?w=500', 80, 8, 'Justin''s', 'Classic Almond Butter 16oz'),

('Dark Chocolate Bar', '72% cacao dark chocolate bar. Fair trade certified, organic cocoa. Rich and smooth taste.', 4.99, 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=500', 200, 8, 'Green & Black''s', 'Organic Dark Chocolate 85g');

-- SubCategory 9: Health Care
INSERT INTO Products (ProductName, Description, Price, ImageUrl, Stock, SubCategoryId, BrandName, ShortDescription)
VALUES 
('Vitamin D3 Supplements', 'High-potency Vitamin D3 5000 IU softgels. Supports bone health and immune function. 360 count.', 24.99, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500', 120, 9, 'Nature Made', 'Vitamin D3 5000 IU Softgels'),

('Omega-3 Fish Oil', 'Triple strength fish oil with EPA and DHA. Supports heart and brain health. Burp-free formula.', 29.99, 'https://images.unsplash.com/photo-1577174881658-0f30ed549adc?w=500', 90, 9, 'Nordic Naturals', 'Ultimate Omega 120 Softgels'),

('Probiotic Capsules', '50 billion CFU probiotic with 12 strains. Supports digestive and immune health. Shelf-stable.', 34.99, 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=500', 75, 9, 'Garden of Life', 'Dr. Formulated Probiotics'),

('First Aid Kit', 'Complete first aid kit with 299 pieces. Includes bandages, antiseptic, medications, and emergency tools.', 39.99, 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=500', 60, 9, 'Johnson & Johnson', 'All-Purpose First Aid Kit'),

('Blood Pressure Monitor', 'Digital blood pressure monitor with large display. Irregular heartbeat detection. Memory for 2 users.', 49.99, 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=500', 40, 9, 'Omron', 'Platinum Blood Pressure Monitor');

-- SubCategory 10: Personal Care
INSERT INTO Products (ProductName, Description, Price, ImageUrl, Stock, SubCategoryId, BrandName, ShortDescription)
VALUES 
('CeraVe Moisturizing Cream', 'Rich moisturizing cream with ceramides and hyaluronic acid. For dry to very dry skin. Fragrance-free.', 16.99, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500', 100, 10, 'CeraVe', 'Moisturizing Cream 19oz'),

('Olaplex Hair Treatment', 'Bond repair treatment that restores damaged hair. Professional salon quality. All hair types.', 28.00, 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500', 70, 10, 'Olaplex', 'No.3 Hair Perfector 100ml'),

('Oral-B Electric Toothbrush', 'Rechargeable electric toothbrush with pressure sensor. 3D cleaning action. 2-minute timer.', 79.99, 'https://images.unsplash.com/photo-1559467278-020c6d845946?w=500', 55, 10, 'Oral-B', 'Pro 1000 Electric Toothbrush'),

('La Roche-Posay Sunscreen', 'Lightweight sunscreen with SPF 60. Water resistant, oil-free formula. Suitable for sensitive skin.', 33.50, 'https://images.unsplash.com/photo-1556227702-d1e4e7b5c232?w=500', 85, 10, 'La Roche-Posay', 'Anthelios SPF 60 Sunscreen'),

('Dove Body Wash', 'Nourishing body wash with moisturizing cream. Gentle formula for soft, smooth skin. 22oz pump bottle.', 8.99, 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=500', 150, 10, 'Dove', 'Deep Moisture Body Wash');

GO

-- =============================================
-- ADD PRODUCT IMAGES (Multiple images per product)
-- =============================================
-- Get the IDs of newly inserted products and add additional images

DECLARE @ProductId INT;

-- Add multiple images for some featured products
-- Samsung TV
SELECT @ProductId = ProductId FROM Products WHERE ProductName = 'Samsung 55" 4K Smart TV';
IF @ProductId IS NOT NULL
BEGIN
    INSERT INTO ProductImages (ProductId, ImageUrl, IsMain, DisplayOrder) VALUES
    (@ProductId, 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500', 1, 0),
    (@ProductId, 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=500', 0, 1),
    (@ProductId, 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500', 0, 2);
END

-- Nike Air Max
SELECT @ProductId = ProductId FROM Products WHERE ProductName = 'Nike Air Max 270';
IF @ProductId IS NOT NULL
BEGIN
    INSERT INTO ProductImages (ProductId, ImageUrl, IsMain, DisplayOrder) VALUES
    (@ProductId, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', 1, 0),
    (@ProductId, 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=500', 0, 1),
    (@ProductId, 'https://images.unsplash.com/photo-1491553895911-0055uj?w=500', 0, 2);
END

-- Levi's Jeans
SELECT @ProductId = ProductId FROM Products WHERE ProductName = 'Levi''s 501 Original Jeans';
IF @ProductId IS NOT NULL
BEGIN
    INSERT INTO ProductImages (ProductId, ImageUrl, IsMain, DisplayOrder) VALUES
    (@ProductId, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500', 1, 0),
    (@ProductId, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500', 0, 1),
    (@ProductId, 'https://images.unsplash.com/photo-1475178626620-a4d074967452?w=500', 0, 2);
END

-- Zara Dress
SELECT @ProductId = ProductId FROM Products WHERE ProductName = 'Zara Floral Maxi Dress';
IF @ProductId IS NOT NULL
BEGIN
    INSERT INTO ProductImages (ProductId, ImageUrl, IsMain, DisplayOrder) VALUES
    (@ProductId, 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500', 1, 0),
    (@ProductId, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500', 0, 1),
    (@ProductId, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500', 0, 2);
END

GO

-- =============================================
-- ADD PRODUCT SPECIFICATIONS
-- =============================================

DECLARE @ProdId INT;

-- Samsung TV Specifications
SELECT @ProdId = ProductId FROM Products WHERE ProductName = 'Samsung 55" 4K Smart TV';
IF @ProdId IS NOT NULL
BEGIN
    INSERT INTO ProductSpecifications (ProductId, AttributeName, AttributeValue, DisplayOrder) VALUES
    (@ProdId, 'Screen Size', '55 inches', 0),
    (@ProdId, 'Resolution', '4K Ultra HD (3840 x 2160)', 1),
    (@ProdId, 'Display Type', 'Crystal UHD', 2),
    (@ProdId, 'Smart Platform', 'Tizen OS', 3),
    (@ProdId, 'Connectivity', 'WiFi, Bluetooth, HDMI x3, USB x2', 4),
    (@ProdId, 'Warranty', '2 Years', 5);
END

-- MacBook Air Specifications
SELECT @ProdId = ProductId FROM Products WHERE ProductName = 'Apple MacBook Air M2';
IF @ProdId IS NOT NULL
BEGIN
    INSERT INTO ProductSpecifications (ProductId, AttributeName, AttributeValue, DisplayOrder) VALUES
    (@ProdId, 'Processor', 'Apple M2 Chip', 0),
    (@ProdId, 'Memory', '8GB Unified Memory', 1),
    (@ProdId, 'Storage', '256GB SSD', 2),
    (@ProdId, 'Display', '13.6" Liquid Retina', 3),
    (@ProdId, 'Battery Life', 'Up to 18 hours', 4),
    (@ProdId, 'Weight', '2.7 pounds', 5);
END

-- Levi's Jeans Specifications
SELECT @ProdId = ProductId FROM Products WHERE ProductName = 'Levi''s 501 Original Jeans';
IF @ProdId IS NOT NULL
BEGIN
    INSERT INTO ProductSpecifications (ProductId, AttributeName, AttributeValue, DisplayOrder) VALUES
    (@ProdId, 'Material', '100% Cotton Denim', 0),
    (@ProdId, 'Fit', 'Original Straight Leg', 1),
    (@ProdId, 'Rise', 'Mid Rise', 2),
    (@ProdId, 'Closure', 'Button Fly', 3),
    (@ProdId, 'Care', 'Machine Wash Cold', 4);
END

GO

PRINT 'Dummy products with images and specifications inserted successfully!';
PRINT 'Total products added: 50';
PRINT 'Categories covered: Home Appliances, Clothes, Grocery';
PRINT 'All subcategories populated with 5 products each';

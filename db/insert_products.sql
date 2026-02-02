-- Created by GitHub Copilot in SSMS - review carefully before executing
SET NOCOUNT ON;

BEGIN TRANSACTION;

INSERT INTO dbo.Products (ProductName, Description, Price, ImageUrl, Stock, SubCategoryId)
VALUES
(N'Samsung 55" Smart 4K LED TV', N'55-inch 4K UHD Smart TV with HDR10+', 699.99, NULL, 25, 1),
(N'JBL Bluetooth Soundbar 2.1', N'Wireless soundbar with powered subwoofer', 149.99, NULL, 50, 1),
(N'IFB 20L Convection Microwave', N'20L convection microwave with grill and reheating', 129.99, NULL, 30, 2),
(N'Lee Men''s Cotton Casual Shirt - Blue', N'100% cotton casual slim-fit shirt', 29.99, NULL, 200, 3),
(N'Zoe Women''s Rayon Floral Dress', N'Floral print rayon dress for summers', 39.99, NULL, 150, 4),
(N'Kiddo 3-Pack Cotton T-Shirts', N'Pack of 3 soft cotton tees for kids', 19.99, NULL, 300, 5),
(N'Nike Running Shoes - Size 10', N'Lightweight breathable running shoes', 59.99, NULL, 120, 6),
(N'WildTrail 40L Travel Backpack', N'Durable 40L water-resistant travel backpack', 49.99, NULL, 80, 7),
(N'GoldenFields Organic Basmati Rice 5kg', N'Premium organic basmati rice - 5kg', 24.99, NULL, 100, 8),
(N'HealthPlus Vitamin C 500mg - 60 Tablets', N'Immune support supplement, 60 tablets', 14.99, NULL, 200, 9),
(N'HerbalCare Shampoo 400ml', N'Nourishing herbal shampoo, 400ml', 9.99, NULL, 180, 10);

COMMIT TRANSACTION;
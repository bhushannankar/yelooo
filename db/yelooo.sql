
CREATE DATABASE ECommerceDB;
GO

USE ECommerceDB;
GO

CREATE TABLE Categories (
    CategoryId INT PRIMARY KEY IDENTITY(1,1),
    CategoryName NVARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE SubCategories (
    SubCategoryId INT PRIMARY KEY IDENTITY(1,1),
    SubCategoryName NVARCHAR(100) NOT NULL,
    CategoryId INT NOT NULL,
    FOREIGN KEY (CategoryId) REFERENCES Categories(CategoryId)
);

CREATE TABLE Products (
    ProductId INT PRIMARY KEY IDENTITY(1,1),
    ProductName NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX),
    Price DECIMAL(10, 2) NOT NULL,
    ImageUrl NVARCHAR(MAX),
    Stock INT NOT NULL,
    SubCategoryId INT NOT NULL,
    FOREIGN KEY (SubCategoryId) REFERENCES SubCategories(SubCategoryId)
);

CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(100) NOT NULL UNIQUE,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Orders (
    OrderId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    OrderDate DATETIME DEFAULT GETDATE(),
    TotalAmount DECIMAL(10, 2) NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

CREATE TABLE OrderItems (
    OrderItemId INT PRIMARY KEY IDENTITY(1,1),
    OrderId INT NOT NULL,
    ProductId INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (OrderId) REFERENCES Orders(OrderId),
    FOREIGN KEY (ProductId) REFERENCES Products(ProductId)
);

-- Initial Data for Categories and SubCategories based on rcmworld.com example
INSERT INTO Categories (CategoryName) VALUES
('Home appliances'),
('Clothes'),
('Grocery');

INSERT INTO SubCategories (SubCategoryName, CategoryId) VALUES
-- Home appliances
('Electronics', (SELECT CategoryId FROM Categories WHERE CategoryName = 'Home appliances')),
('Household', (SELECT CategoryId FROM Categories WHERE CategoryName = 'Home appliances')),

-- Clothes
('Men''s Wear', (SELECT CategoryId FROM Categories WHERE CategoryName = 'Clothes')),
('Women''s Wear', (SELECT CategoryId FROM Categories WHERE CategoryName = 'Clothes')),
('Kid''s Wear', (SELECT CategoryId FROM Categories WHERE CategoryName = 'Clothes')),
('Footwear', (SELECT CategoryId FROM Categories WHERE CategoryName = 'Clothes')),
('Luggage & Bags', (SELECT CategoryId FROM Categories WHERE CategoryName = 'Clothes')),

-- Grocery
('Food & Grocery', (SELECT CategoryId FROM Categories WHERE CategoryName = 'Grocery')),
('Health Care', (SELECT CategoryId FROM Categories WHERE CategoryName = 'Grocery')),
('Personal Care', (SELECT CategoryId FROM Categories WHERE CategoryName = 'Grocery'))
;

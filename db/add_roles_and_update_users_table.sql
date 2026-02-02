USE ECommerceDB;
GO

-- Create Roles Table
CREATE TABLE Roles (
    RoleId INT PRIMARY KEY IDENTITY(1,1),
    RoleName NVARCHAR(50) NOT NULL UNIQUE
);

-- Insert Default Roles
INSERT INTO Roles (RoleName) VALUES
('Admin'),
('Seller'),
('Customer');

-- Add RoleId to Users table
ALTER TABLE Users
ADD RoleId INT NULL;
GO

-- Set a default role for existing users (e.g., Customer)
-- This assumes 'Customer' role will have RoleId 3 after insertion
UPDATE Users
SET RoleId = (SELECT RoleId FROM Roles WHERE RoleName = 'Customer')
WHERE RoleId IS NULL;
GO

-- Make RoleId NOT NULL after setting default values
ALTER TABLE Users
ALTER COLUMN RoleId INT NOT NULL;
GO

-- Add Foreign Key Constraint
ALTER TABLE Users
ADD CONSTRAINT FK_Users_Roles
FOREIGN KEY (RoleId) REFERENCES Roles(RoleId);
GO

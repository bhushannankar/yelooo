-- =============================================
-- Drop UNIQUE constraint on Users.Email (if it exists)
-- Run this once on an existing ECommerceDB if you already
-- deployed with the old schema and want to allow duplicate emails.
-- User unique identifier is ReferralCode (User Id), not Email.
-- =============================================

USE ECommerceDB;
GO

DECLARE @ConstraintName NVARCHAR(200);
SELECT @ConstraintName = kc.name
FROM sys.key_constraints kc
INNER JOIN sys.index_columns ic ON ic.object_id = kc.parent_object_id AND ic.index_id = kc.unique_index_id
INNER JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
WHERE kc.parent_object_id = OBJECT_ID('dbo.Users')
  AND kc.type = 'UQ'
  AND c.name = 'Email';

IF @ConstraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE dbo.Users DROP CONSTRAINT ' + @ConstraintName);
    PRINT 'Dropped unique constraint on Users.Email: ' + @ConstraintName;
END
ELSE
    PRINT 'No unique constraint on Users.Email found. Nothing to drop.';
GO

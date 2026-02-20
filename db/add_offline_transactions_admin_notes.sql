-- Add AdminNotes column to OfflineTransactions if missing (fixes "Invalid column name 'AdminNotes'" on submit-as-seller/submit-as-customer).
-- Run this against the database that has OfflineTransactions but was created without AdminNotes.

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('OfflineTransactions') AND name = 'AdminNotes'
)
BEGIN
    ALTER TABLE OfflineTransactions ADD AdminNotes NVARCHAR(500) NULL;
    PRINT 'Added AdminNotes to OfflineTransactions';
END
ELSE
BEGIN
    PRINT 'AdminNotes already exists on OfflineTransactions';
END
GO

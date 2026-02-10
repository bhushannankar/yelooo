# ECommerceDB Production Deployment

## Script: `prod_ECommerceDB_full.sql`

Single production-ready script that creates the **ECommerceDB** database with full schema and seed data.

### Features
- **Idempotent**: Safe to run multiple times (uses `IF NOT EXISTS` throughout)
- **Complete schema**: All tables, indexes, foreign keys from the Yelooo e-commerce app
- **Seed data**: Categories, subcategories, payment methods, delivery statuses, base products, default users
- **Target**: SQL Server 2016+

### How to Run

**Option 1: SQL Server Management Studio (SSMS)**
1. Open SSMS and connect to your SQL Server instance
2. Open `prod_ECommerceDB_full.sql`
3. Execute (F5)

**Option 2: sqlcmd**
```bash
sqlcmd -S your_server -U your_user -P your_password -i prod_ECommerceDB_full.sql
```

**Option 3: Azure Data Studio / VS Code**
- Open the file and run against your connection

### Default Credentials

| User | Email | Password | Role |
|------|-------|----------|------|
| admin | admin@yelooo.in | password | Admin |
| yelooo | company@yelooo.in | (internal - no login) | Customer |

**Important**: Change the admin password immediately after first login in production (use Forgot Password or update via Profile).

### Connection String

Update your app's connection string for production:
```
Server=your_prod_server;Database=ECommerceDB;User Id=your_user;Password=your_password;TrustServerCertificate=True;MultipleActiveResultSets=true
```

### Optional: Additional Product Data

The script includes base products (5 items). For more products:
- Run `seed_dummy_products.sql` after this script for sample catalog data
- Or use the Admin UI to add products

### Tables Created

- **Core**: Categories, SubCategories, Products, Users, Orders, OrderItems
- **Commerce**: CartItems, ProductSellers, PaymentMethods, Reviews
- **Product details**: Colors, Sizes, ProductVariants, ProductImages, ProductSpecifications
- **User profile**: UserBankDetails, KycDocuments, KycStatusHistory
- **MLM/Referral**: ReferralInvitations, ReferralTree
- **Points**: PVLevelConfig, UserPointsBalance, PointsTransactions, PointsRedemptionConfigs, PointsBenefits
- **Delivery**: DeliveryStatuses, DeliveryStatusHistory
- **Transactions**: OfflineTransactions, SellerCommissions, SellerCommissionPayments
- **Categories**: TertiaryCategories, QuaternaryCategories

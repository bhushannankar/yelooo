using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using ECommerceApi.Models;

namespace ECommerceApi.Data
{
    public class ApplicationDbContext : DbContext
    {
        private readonly IConfiguration? _configuration;

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, IConfiguration configuration) : base(options)
        {
            _configuration = configuration;
        }

        public DbSet<Category> Categories { get; set; }
        public DbSet<SubCategory> SubCategories { get; set; }
        public DbSet<TertiaryCategory> TertiaryCategories { get; set; }
        public DbSet<QuaternaryCategory> QuaternaryCategories { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<PaymentMethod> PaymentMethods { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Color> Colors { get; set; }
        public DbSet<Size> Sizes { get; set; }
        public DbSet<ProductVariant> ProductVariants { get; set; }
        public DbSet<ProductImage> ProductImages { get; set; }
        public DbSet<ProductSpecification> ProductSpecifications { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<ProductSeller> ProductSellers { get; set; }
        public DbSet<SellerSubCategory> SellerSubCategories { get; set; }
        public DbSet<SellerTertiaryCategory> SellerTertiaryCategories { get; set; }
        public DbSet<SellerQuaternaryCategory> SellerQuaternaryCategories { get; set; }
        public DbSet<UserBankDetail> UserBankDetails { get; set; }
        public DbSet<KycDocument> KycDocuments { get; set; }
        public DbSet<KycStatusHistory> KycStatusHistory { get; set; }
        public DbSet<ReferralInvitation> ReferralInvitations { get; set; }
        public DbSet<ReferralTree> ReferralTrees { get; set; }
        public DbSet<DeliveryStatusHistory> DeliveryStatusHistory { get; set; }
        public DbSet<PVLevelConfig> PVLevelConfigs { get; set; }
        public DbSet<UserPointsBalance> UserPointsBalances { get; set; }
        public DbSet<PointsTransaction> PointsTransactions { get; set; }
        public DbSet<SellerCommission> SellerCommissions { get; set; }
        public DbSet<SellerCommissionPayment> SellerCommissionPayments { get; set; }
        public DbSet<OfflineTransaction> OfflineTransactions { get; set; }
        public DbSet<PointsRedemptionConfig> PointsRedemptionConfigs { get; set; }
        public DbSet<PointsBenefit> PointsBenefits { get; set; }
        public DbSet<DeliveryStatus> DeliveryStatuses { get; set; }
        public DbSet<CategorySlideImage> CategorySlideImages { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // When connecting to a remote/legacy DB that lacks CreatedAt/UpdatedAt on some tables,
            // set Schema:IgnoreOptionalTimestampColumns to true in appsettings.json.
            // User.CreatedAt is always mapped so the Users table CreatedAt column is retrieved.
            var ignoreTimestamps = _configuration?.GetValue<bool>("Schema:IgnoreOptionalTimestampColumns") ?? false;
            if (ignoreTimestamps)
            {
                modelBuilder.Entity<UserBankDetail>().Ignore(b => b.CreatedAt).Ignore(b => b.UpdatedAt);
                modelBuilder.Entity<KycDocument>().Ignore(k => k.CreatedAt).Ignore(k => k.UpdatedAt);
            }

            // CartItem - unique constraint on UserId + ProductId
            modelBuilder.Entity<CartItem>()
                .HasIndex(c => new { c.UserId, c.ProductId })
                .IsUnique();

            // ProductSeller - unique constraint on ProductId + SellerId
            modelBuilder.Entity<ProductSeller>()
                .HasIndex(ps => new { ps.ProductId, ps.SellerId })
                .IsUnique();

            // SellerSubCategory - unique constraint on SellerId + SubCategoryId
            modelBuilder.Entity<SellerSubCategory>()
                .HasIndex(ss => new { ss.SellerId, ss.SubCategoryId })
                .IsUnique();
            // SellerTertiaryCategory - unique constraint on SellerId + TertiaryCategoryId
            modelBuilder.Entity<SellerTertiaryCategory>()
                .HasIndex(st => new { st.SellerId, st.TertiaryCategoryId })
                .IsUnique();
            // SellerQuaternaryCategory - unique constraint on SellerId + QuaternaryCategoryId
            modelBuilder.Entity<SellerQuaternaryCategory>()
                .HasIndex(sq => new { sq.SellerId, sq.QuaternaryCategoryId })
                .IsUnique();

            // KycDocument - configure multiple relationships to User
            modelBuilder.Entity<KycDocument>()
                .HasOne(k => k.User)
                .WithMany(u => u.KycDocuments)
                .HasForeignKey(k => k.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<KycDocument>()
                .HasOne(k => k.ReviewedByUser)
                .WithMany()
                .HasForeignKey(k => k.ReviewedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // KycStatusHistory - configure relationship to User
            modelBuilder.Entity<KycStatusHistory>()
                .HasOne(h => h.ChangedByUser)
                .WithMany()
                .HasForeignKey(h => h.ChangedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // User self-referencing relationship for MLM
            modelBuilder.Entity<User>()
                .HasOne(u => u.ReferredByUser)
                .WithMany(u => u.DirectReferrals)
                .HasForeignKey(u => u.ReferredByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // ReferralTree - map to correct table name
            modelBuilder.Entity<ReferralTree>().ToTable("ReferralTree");
            
            // ReferralTree relationships
            modelBuilder.Entity<ReferralTree>()
                .HasOne(rt => rt.AncestorUser)
                .WithMany()
                .HasForeignKey(rt => rt.AncestorUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ReferralTree>()
                .HasOne(rt => rt.DescendantUser)
                .WithMany()
                .HasForeignKey(rt => rt.DescendantUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ReferralTree>()
                .HasOne(rt => rt.LegRootUser)
                .WithMany()
                .HasForeignKey(rt => rt.LegRootUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ReferralTree>()
                .HasIndex(rt => new { rt.AncestorUserId, rt.DescendantUserId })
                .IsUnique();

            // ReferralInvitation - map to correct table name
            modelBuilder.Entity<ReferralInvitation>().ToTable("ReferralInvitations");
            
            // ReferralInvitation relationships
            modelBuilder.Entity<ReferralInvitation>()
                .HasOne(ri => ri.InvitedByUser)
                .WithMany()
                .HasForeignKey(ri => ri.InvitedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ReferralInvitation>()
                .HasOne(ri => ri.AcceptedByUser)
                .WithMany()
                .HasForeignKey(ri => ri.AcceptedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // PVLevelConfig - map to correct table name
            modelBuilder.Entity<PVLevelConfig>().ToTable("PVLevelConfig");

            // UserPointsBalance - map to correct table name
            modelBuilder.Entity<UserPointsBalance>().ToTable("UserPointsBalance");
            modelBuilder.Entity<UserPointsBalance>()
                .HasIndex(upb => upb.UserId)
                .IsUnique();

            // PointsTransactions - map to correct table name
            modelBuilder.Entity<PointsTransaction>().ToTable("PointsTransactions");

            // PointsTransaction relationships
            modelBuilder.Entity<PointsTransaction>()
                .HasOne(pt => pt.User)
                .WithMany()
                .HasForeignKey(pt => pt.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PointsTransaction>()
                .HasOne(pt => pt.SourceUser)
                .WithMany()
                .HasForeignKey(pt => pt.SourceUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PointsTransaction>()
                .HasOne(pt => pt.Order)
                .WithMany()
                .HasForeignKey(pt => pt.OrderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PointsTransaction>()
                .HasOne(pt => pt.OfflineTransaction)
                .WithMany()
                .HasForeignKey(pt => pt.OfflineTransactionId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Role>().HasData(
                new Role { RoleId = 1, RoleName = "Admin" },
                new Role { RoleId = 2, RoleName = "Seller" },
                new Role { RoleId = 3, RoleName = "Customer" }
            );

            modelBuilder.Entity<Category>().HasData(
                new Category { CategoryId = 1, CategoryName = "Home appliances" },
                new Category { CategoryId = 2, CategoryName = "Clothes" },
                new Category { CategoryId = 3, CategoryName = "Grocery" }
            );

            modelBuilder.Entity<SubCategory>().HasData(
                new SubCategory { SubCategoryId = 1, SubCategoryName = "Electronics", CategoryId = 1 },
                new SubCategory { SubCategoryId = 2, SubCategoryName = "Household", CategoryId = 1 },
                new SubCategory { SubCategoryId = 3, SubCategoryName = "Men's Wear", CategoryId = 2 },
                new SubCategory { SubCategoryId = 4, SubCategoryName = "Women's Wear", CategoryId = 2 },
                new SubCategory { SubCategoryId = 5, SubCategoryName = "Kid's Wear", CategoryId = 2 },
                new SubCategory { SubCategoryId = 6, SubCategoryName = "Footwear", CategoryId = 2 },
                new SubCategory { SubCategoryId = 7, SubCategoryName = "Luggage & Bags", CategoryId = 2 },
                new SubCategory { SubCategoryId = 8, SubCategoryName = "Food & Grocery", CategoryId = 3 },
                new SubCategory { SubCategoryId = 9, SubCategoryName = "Health Care", CategoryId = 3 },
                new SubCategory { SubCategoryId = 10, SubCategoryName = "Personal Care", CategoryId = 3 }
            );

            modelBuilder.Entity<Product>().HasData(
                new Product { ProductId = 1, ProductName = "Smart TV 55 inch", Description = "4K UHD Smart TV", Price = 599.99m, ImageUrl = "", Stock = 50, SubCategoryId = 1, IsDeleted = false },
                new Product { ProductId = 2, ProductName = "Washing Machine", Description = "Front Load 8kg", Price = 450.00m, ImageUrl = "", Stock = 30, SubCategoryId = 2, IsDeleted = false },
                new Product { ProductId = 3, ProductName = "Men's Jeans", Description = "Blue Slim Fit Denim", Price = 49.99m, ImageUrl = "", Stock = 100, SubCategoryId = 3, IsDeleted = false },
                new Product { ProductId = 4, ProductName = "Women's Dress", Description = "Summer Floral Dress", Price = 35.50m, ImageUrl = "", Stock = 75, SubCategoryId = 4, IsDeleted = false },
                new Product { ProductId = 5, ProductName = "Organic Apples", Description = "Fresh organic apples (1kg)", Price = 3.20m, ImageUrl = "", Stock = 200, SubCategoryId = 8, IsDeleted = false }
            );
        }
    }
}

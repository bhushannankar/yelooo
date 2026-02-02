using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerceApi.Data;
using ECommerceApi.Models;
using System.Security.Claims;

namespace ECommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PointsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PointsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int? GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId))
            {
                return userId;
            }
            return null;
        }

        /// <summary>
        /// Get current user's points balance and summary
        /// </summary>
        [HttpGet("my-balance")]
        public async Task<ActionResult<object>> GetMyBalance()
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized();

            var balance = await _context.UserPointsBalances
                .FirstOrDefaultAsync(b => b.UserId == userId);

            if (balance == null)
            {
                // Create initial balance record
                balance = new UserPointsBalance
                {
                    UserId = userId.Value,
                    TotalPointsEarned = 0,
                    TotalPointsRedeemed = 0,
                    CurrentBalance = 0
                };
                _context.UserPointsBalances.Add(balance);
                await _context.SaveChangesAsync();
            }

            // Get additional stats
            var selfEarnings = await _context.PointsTransactions
                .Where(pt => pt.UserId == userId && pt.TransactionType == "EARNED_SELF")
                .SumAsync(pt => (decimal?)pt.PointsAmount) ?? 0;

            var referralEarnings = await _context.PointsTransactions
                .Where(pt => pt.UserId == userId && pt.TransactionType == "EARNED_REFERRAL")
                .SumAsync(pt => (decimal?)pt.PointsAmount) ?? 0;

            var totalTransactions = await _context.PointsTransactions
                .Where(pt => pt.UserId == userId)
                .CountAsync();

            return Ok(new
            {
                currentBalance = balance.CurrentBalance,
                totalPointsEarned = balance.TotalPointsEarned,
                totalPointsRedeemed = balance.TotalPointsRedeemed,
                pointsFromOwnPurchases = selfEarnings,
                pointsFromReferrals = referralEarnings,
                totalTransactions = totalTransactions,
                lastUpdated = balance.LastUpdatedAt
            });
        }

        /// <summary>
        /// Get current user's points transaction history
        /// </summary>
        [HttpGet("my-transactions")]
        public async Task<ActionResult<object>> GetMyTransactions(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? type = null)
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized();

            var query = _context.PointsTransactions
                .Where(pt => pt.UserId == userId);

            if (!string.IsNullOrEmpty(type))
            {
                query = query.Where(pt => pt.TransactionType == type);
            }

            var totalCount = await query.CountAsync();

            var transactions = await query
                .OrderByDescending(pt => pt.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(pt => new
                {
                    transactionId = pt.TransactionId,
                    transactionType = pt.TransactionType,
                    levelId = pt.LevelId,
                    orderId = pt.OrderId,
                    orderAmount = pt.OrderAmount,
                    totalPV = pt.TotalPV,
                    pointsAmount = pt.PointsAmount,
                    balanceAfter = pt.BalanceAfter,
                    description = pt.Description,
                    createdAt = pt.CreatedAt,
                    sourceUserName = pt.SourceUser != null ? pt.SourceUser.Username : null
                })
                .ToListAsync();

            return Ok(new
            {
                transactions,
                pagination = new
                {
                    currentPage = page,
                    pageSize,
                    totalCount,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                }
            });
        }

        /// <summary>
        /// Get level-wise earnings breakdown
        /// </summary>
        [HttpGet("my-level-earnings")]
        public async Task<ActionResult<object>> GetMyLevelEarnings()
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized();

            var levelEarnings = await _context.PointsTransactions
                .Where(pt => pt.UserId == userId && pt.LevelId != null)
                .GroupBy(pt => pt.LevelId)
                .Select(g => new
                {
                    levelId = g.Key,
                    totalPoints = g.Sum(pt => pt.PointsAmount),
                    transactionCount = g.Count()
                })
                .OrderBy(l => l.levelId)
                .ToListAsync();

            // Get level names
            var levelConfigs = await _context.PVLevelConfigs
                .Where(lc => lc.IsActive)
                .ToDictionaryAsync(lc => lc.LevelId, lc => lc.LevelName);

            var result = levelEarnings.Select(le => new
            {
                le.levelId,
                levelName = levelConfigs.ContainsKey(le.levelId ?? 0) ? levelConfigs[le.levelId ?? 0] : $"Level {le.levelId}",
                le.totalPoints,
                le.transactionCount
            });

            return Ok(result);
        }

        /// <summary>
        /// Get PV level configuration (public)
        /// </summary>
        [HttpGet("level-config")]
        [AllowAnonymous]
        public async Task<ActionResult<object>> GetLevelConfig()
        {
            var configs = await _context.PVLevelConfigs
                .Where(c => c.IsActive)
                .OrderBy(c => c.LevelId)
                .Select(c => new
                {
                    levelId = c.LevelId,
                    levelName = c.LevelName,
                    pvPercentage = c.PVPercentage,
                    description = c.Description
                })
                .ToListAsync();

            return Ok(new
            {
                pvPercentageOfOrder = 10.0m,  // 10% of order value becomes PV
                levels = configs
            });
        }

        /// <summary>
        /// Admin: Get all users' points summary
        /// </summary>
        [HttpGet("admin/all-users")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<object>> GetAllUsersPoints(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? search = null,
            [FromQuery] string? sortBy = "totalEarned",
            [FromQuery] string? sortOrder = "desc")
        {
            var query = _context.Users
                .Where(u => u.RoleId == 3)  // Customers only
                .Select(u => new
                {
                    userId = u.UserId,
                    username = u.Username,
                    email = u.Email,
                    firstName = u.FirstName,
                    lastName = u.LastName,
                    balance = _context.UserPointsBalances
                        .Where(b => b.UserId == u.UserId)
                        .Select(b => new
                        {
                            totalEarned = b.TotalPointsEarned,
                            totalRedeemed = b.TotalPointsRedeemed,
                            currentBalance = b.CurrentBalance,
                            lastUpdated = b.LastUpdatedAt
                        })
                        .FirstOrDefault(),
                    selfEarnings = _context.PointsTransactions
                        .Where(pt => pt.UserId == u.UserId && pt.TransactionType == "EARNED_SELF")
                        .Sum(pt => (decimal?)pt.PointsAmount) ?? 0,
                    referralEarnings = _context.PointsTransactions
                        .Where(pt => pt.UserId == u.UserId && pt.TransactionType == "EARNED_REFERRAL")
                        .Sum(pt => (decimal?)pt.PointsAmount) ?? 0
                });

            if (!string.IsNullOrEmpty(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(u => 
                    (u.username != null && u.username.ToLower().Contains(searchLower)) ||
                    (u.email != null && u.email.ToLower().Contains(searchLower)) ||
                    (u.firstName != null && u.firstName.ToLower().Contains(searchLower)) ||
                    (u.lastName != null && u.lastName.ToLower().Contains(searchLower)));
            }

            var totalCount = await query.CountAsync();

            // Apply sorting
            var sortedQuery = sortBy?.ToLower() switch
            {
                "username" => sortOrder == "asc" ? query.OrderBy(u => u.username) : query.OrderByDescending(u => u.username),
                "selfearn" => sortOrder == "asc" ? query.OrderBy(u => u.selfEarnings) : query.OrderByDescending(u => u.selfEarnings),
                "referralearn" => sortOrder == "asc" ? query.OrderBy(u => u.referralEarnings) : query.OrderByDescending(u => u.referralEarnings),
                "balance" => sortOrder == "asc" ? query.OrderBy(u => u.balance!.currentBalance) : query.OrderByDescending(u => u.balance!.currentBalance),
                _ => sortOrder == "asc" ? query.OrderBy(u => u.balance!.totalEarned) : query.OrderByDescending(u => u.balance!.totalEarned)
            };

            var users = await sortedQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Calculate totals
            var totals = new
            {
                totalPointsDistributed = await _context.UserPointsBalances.SumAsync(b => (decimal?)b.TotalPointsEarned) ?? 0,
                totalPointsRedeemed = await _context.UserPointsBalances.SumAsync(b => (decimal?)b.TotalPointsRedeemed) ?? 0,
                totalCurrentBalance = await _context.UserPointsBalances.SumAsync(b => (decimal?)b.CurrentBalance) ?? 0,
                totalUsers = totalCount
            };

            return Ok(new
            {
                users,
                totals,
                pagination = new
                {
                    currentPage = page,
                    pageSize,
                    totalCount,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                }
            });
        }

        /// <summary>
        /// Admin: Get specific user's points details
        /// </summary>
        [HttpGet("admin/user/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<object>> GetUserPointsDetail(int userId)
        {
            var user = await _context.Users
                .Where(u => u.UserId == userId)
                .Select(u => new
                {
                    userId = u.UserId,
                    username = u.Username,
                    email = u.Email,
                    firstName = u.FirstName,
                    lastName = u.LastName
                })
                .FirstOrDefaultAsync();

            if (user == null)
                return NotFound("User not found");

            var balance = await _context.UserPointsBalances
                .FirstOrDefaultAsync(b => b.UserId == userId);

            var transactions = await _context.PointsTransactions
                .Where(pt => pt.UserId == userId)
                .OrderByDescending(pt => pt.CreatedAt)
                .Take(50)
                .Select(pt => new
                {
                    transactionId = pt.TransactionId,
                    transactionType = pt.TransactionType,
                    levelId = pt.LevelId,
                    orderId = pt.OrderId,
                    orderAmount = pt.OrderAmount,
                    totalPV = pt.TotalPV,
                    pointsAmount = pt.PointsAmount,
                    balanceAfter = pt.BalanceAfter,
                    description = pt.Description,
                    createdAt = pt.CreatedAt,
                    sourceUserName = pt.SourceUser != null ? pt.SourceUser.Username : null
                })
                .ToListAsync();

            var levelEarnings = await _context.PointsTransactions
                .Where(pt => pt.UserId == userId && pt.LevelId != null)
                .GroupBy(pt => pt.LevelId)
                .Select(g => new
                {
                    levelId = g.Key,
                    totalPoints = g.Sum(pt => pt.PointsAmount),
                    transactionCount = g.Count()
                })
                .OrderBy(l => l.levelId)
                .ToListAsync();

            return Ok(new
            {
                user,
                balance = balance != null ? new
                {
                    totalPointsEarned = balance.TotalPointsEarned,
                    totalPointsRedeemed = balance.TotalPointsRedeemed,
                    currentBalance = balance.CurrentBalance,
                    lastUpdated = balance.LastUpdatedAt
                } : null,
                levelEarnings,
                recentTransactions = transactions
            });
        }

        /// <summary>
        /// Admin: Update PV level configuration
        /// </summary>
        [HttpPut("admin/level-config/{levelId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> UpdateLevelConfig(int levelId, [FromBody] UpdateLevelConfigDto dto)
        {
            var config = await _context.PVLevelConfigs.FindAsync(levelId);
            if (config == null)
                return NotFound("Level configuration not found");

            if (dto.PVPercentage.HasValue)
                config.PVPercentage = dto.PVPercentage.Value;
            if (dto.LevelName != null)
                config.LevelName = dto.LevelName;
            if (dto.Description != null)
                config.Description = dto.Description;
            if (dto.IsActive.HasValue)
                config.IsActive = dto.IsActive.Value;

            config.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Level configuration updated successfully" });
        }

        /// <summary>
        /// Distribute points for an order (called after successful payment)
        /// </summary>
        [NonAction]
        public async Task DistributeOrderPoints(int orderId, int customerId, decimal orderAmount)
        {
            // Calculate total PV (10% of order amount)
            decimal totalPV = orderAmount * 0.10m;

            // Get level configurations
            var levelConfigs = await _context.PVLevelConfigs
                .Where(c => c.IsActive)
                .OrderBy(c => c.LevelId)
                .ToListAsync();

            if (!levelConfigs.Any())
                return;

            // Build upline chain
            var uplineChain = new List<(int UserId, int Level)>();
            uplineChain.Add((customerId, 1));  // Level 1 is self

            int currentUserId = customerId;
            for (int level = 2; level <= 8; level++)
            {
                var referrerId = await _context.Users
                    .Where(u => u.UserId == currentUserId)
                    .Select(u => u.ReferredByUserId)
                    .FirstOrDefaultAsync();

                if (referrerId == null)
                    break;

                uplineChain.Add((referrerId.Value, level));
                currentUserId = referrerId.Value;
            }

            // Distribute points to each user in the chain
            foreach (var (userId, level) in uplineChain)
            {
                var levelConfig = levelConfigs.FirstOrDefault(c => c.LevelId == level);
                if (levelConfig == null)
                    continue;

                decimal pointsToCredit = totalPV * (levelConfig.PVPercentage / 100m);
                if (pointsToCredit <= 0)
                    continue;

                // Ensure user has a balance record
                var balance = await _context.UserPointsBalances
                    .FirstOrDefaultAsync(b => b.UserId == userId);

                if (balance == null)
                {
                    balance = new UserPointsBalance
                    {
                        UserId = userId,
                        TotalPointsEarned = 0,
                        TotalPointsRedeemed = 0,
                        CurrentBalance = 0
                    };
                    _context.UserPointsBalances.Add(balance);
                    await _context.SaveChangesAsync();
                }

                // Update balance
                balance.TotalPointsEarned += pointsToCredit;
                balance.CurrentBalance += pointsToCredit;
                balance.LastUpdatedAt = DateTime.Now;

                // Record transaction
                var transaction = new PointsTransaction
                {
                    UserId = userId,
                    OrderId = orderId,
                    SourceUserId = customerId,
                    TransactionType = level == 1 ? "EARNED_SELF" : "EARNED_REFERRAL",
                    LevelId = level,
                    OrderAmount = orderAmount,
                    TotalPV = totalPV,
                    PointsAmount = pointsToCredit,
                    BalanceAfter = balance.CurrentBalance,
                    Description = level == 1 
                        ? "Points earned from own purchase" 
                        : $"Points earned from Level {level - 1} referral purchase"
                };
                _context.PointsTransactions.Add(transaction);
            }

            await _context.SaveChangesAsync();
        }
    }

    public class UpdateLevelConfigDto
    {
        public string? LevelName { get; set; }
        public decimal? PVPercentage { get; set; }
        public string? Description { get; set; }
        public bool? IsActive { get; set; }
    }
}

using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using ECommerceApi.Data;

namespace ECommerceApi.Services;

/// <summary>
/// Customer: YA + 6 digits (e.g. YA456781). Seller: YSA + 5 digits (e.g. YSA96734), then YSB, YSC, etc.
/// </summary>
public class ReferralCodeService : IReferralCodeService
{
    private static readonly Regex CodePattern = new(@"^Y([A-Z])(\d{6})$", RegexOptions.Compiled);
    private static readonly Regex SellerCodePattern = new(@"^YS([A-Z])(\d{5})$", RegexOptions.Compiled);
    private static readonly Random _random = new();
    private const int MaxAttemptsPerLetter = 500;

    private readonly ApplicationDbContext _context;

    public ReferralCodeService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<string> GetNextReferralCodeAsync()
    {
        var candidates = await _context.Users
            .Where(u => u.ReferralCode != null && u.ReferralCode.StartsWith("Y"))
            .Select(u => u.ReferralCode!)
            .ToListAsync();
        var existingSet = candidates.Where(c => CodePattern.IsMatch(c)).ToHashSet();

        char letter = 'A';
        var parsed = candidates
            .Select(ParseCode)
            .Where(t => t.HasValue)
            .Select(t => t!.Value)
            .ToList();
        if (parsed.Count > 0)
        {
            var maxLetter = parsed.MaxBy(t => t.Letter).Letter;
            letter = maxLetter;
        }

        for (int attempt = 0; attempt < MaxAttemptsPerLetter; attempt++)
        {
            int num = _random.Next(0, 1_000_000);
            string code = $"Y{letter}{num:D6}";
            if (!existingSet.Contains(code))
                return code;
        }

        // Current letter series too crowded; move to next letter
        for (char nextLetter = (char)(letter + 1); nextLetter <= 'Z'; nextLetter++)
        {
            for (int attempt = 0; attempt < MaxAttemptsPerLetter; attempt++)
            {
                int num = _random.Next(0, 1_000_000);
                string code = $"Y{nextLetter}{num:D6}";
                if (!existingSet.Contains(code))
                    return code;
            }
        }

        throw new InvalidOperationException("Referral code series exhausted (YZ999999).");
    }

    public async Task<string> GetNextSellerCodeAsync()
    {
        var candidates = await _context.Users
            .Where(u => u.ReferralCode != null && u.ReferralCode.StartsWith("YS"))
            .Select(u => u.ReferralCode!)
            .ToListAsync();
        var existingSet = candidates.Where(c => SellerCodePattern.IsMatch(c)).ToHashSet();

        char letter = 'A';
        var parsed = candidates
            .Select(ParseSellerCode)
            .Where(t => t.HasValue)
            .Select(t => t!.Value)
            .ToList();
        if (parsed.Count > 0)
            letter = parsed.MaxBy(t => t.Letter).Letter;

        for (int attempt = 0; attempt < MaxAttemptsPerLetter; attempt++)
        {
            int num = _random.Next(0, 100_000);
            string code = $"YS{letter}{num:D5}";
            if (!existingSet.Contains(code))
                return code;
        }

        for (char nextLetter = (char)(letter + 1); nextLetter <= 'Z'; nextLetter++)
        {
            for (int attempt = 0; attempt < MaxAttemptsPerLetter; attempt++)
            {
                int num = _random.Next(0, 100_000);
                string code = $"YS{nextLetter}{num:D5}";
                if (!existingSet.Contains(code))
                    return code;
            }
        }

        throw new InvalidOperationException("Seller code series exhausted (YSZ99999).");
    }

    private static (char Letter, int Number)? ParseSellerCode(string code)
    {
        var m = SellerCodePattern.Match(code);
        if (!m.Success || m.Groups.Count < 3) return null;
        var letter = m.Groups[1].Value[0];
        if (!int.TryParse(m.Groups[2].Value, out var num)) return null;
        return (letter, num);
    }

    private static (char Letter, int Number)? ParseCode(string code)
    {
        var m = CodePattern.Match(code);
        if (!m.Success || m.Groups.Count < 3) return null;
        var letter = m.Groups[1].Value[0];
        if (!int.TryParse(m.Groups[2].Value, out var num)) return null;
        return (letter, num);
    }
}

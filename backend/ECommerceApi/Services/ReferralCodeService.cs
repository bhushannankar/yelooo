using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using ECommerceApi.Data;

namespace ECommerceApi.Services;

/// <summary>
/// Generates referral codes in format: YA + 6 digits (YA000001, YA000002, ... YA999999),
/// then YB000001 through YB999999, then YC, YD, and so on.
/// </summary>
public class ReferralCodeService : IReferralCodeService
{
    private static readonly Regex CodePattern = new(@"^Y([A-Z])(\d{6})$", RegexOptions.Compiled);
    private readonly ApplicationDbContext _context;

    public ReferralCodeService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<string> GetNextReferralCodeAsync()
    {
        var existingCodes = await _context.Users
            .Where(u => u.ReferralCode != null && CodePattern.IsMatch(u.ReferralCode))
            .Select(u => u.ReferralCode!)
            .ToListAsync();

        char nextLetter = 'A';
        int nextNumber = 1;

        var parsed = existingCodes
            .Select(ParseCode)
            .Where(t => t.HasValue)
            .Select(t => t!.Value)
            .ToList();

        if (parsed.Count > 0)
        {
            var max = parsed.MaxBy(t => (t.Letter, t.Number));
            if (max.Number < 999999)
            {
                nextLetter = max.Letter;
                nextNumber = max.Number + 1;
            }
            else
            {
                nextLetter = (char)(max.Letter + 1);
                if (nextLetter > 'Z')
                    throw new InvalidOperationException("Referral code series exhausted (YZ999999).");
                nextNumber = 1;
            }
        }

        return $"Y{nextLetter}{nextNumber:D6}";
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

namespace ChequeApi.Services;

/// <summary>
/// Converts an amount to words using the INDIAN numbering system (Thousand, Lakh, Crore).
/// 125000.50  ->  "One Lakh Twenty Five Thousand and Fifty Paise Only"
/// (No "Rupees" at the start: the word is already printed on the cheque leaf.)
/// </summary>
public static class AmountInWords
{
    private static readonly string[] Ones =
    {
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen"
    };

    private static readonly string[] Tens =
    {
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    };

    public static string Convert(decimal amount)
    {
        if (amount < 0) throw new ArgumentOutOfRangeException(nameof(amount), "Amount cannot be negative.");

        amount = Math.Round(amount, 2, MidpointRounding.AwayFromZero);
        long rupees = (long)Math.Floor(amount);
        int paise = (int)((amount - rupees) * 100);

        string rupeeWords = rupees == 0 ? "Zero" : NumberToWords(rupees);
        string result = rupeeWords;

        if (paise > 0)
            result += " and " + TwoDigits(paise) + " Paise";

        return result + " Only";
    }

    /// <summary>Indian grouping: crore (1,00,00,000) / lakh (1,00,000) / thousand / hundred.</summary>
    private static string NumberToWords(long n)
    {
        if (n == 0) return "";

        var parts = new List<string>();

        long crore = n / 10_000_000;
        long rest = n % 10_000_000;

        if (crore > 0) parts.Add(NumberToWords(crore) + " Crore"); // handles 100+ crore too

        int lakh = (int)(rest / 100_000);
        int thousand = (int)(rest % 100_000 / 1000);
        int hundred = (int)(rest % 1000 / 100);
        int lastTwo = (int)(rest % 100);

        if (lakh > 0) parts.Add(TwoDigits(lakh) + " Lakh");
        if (thousand > 0) parts.Add(TwoDigits(thousand) + " Thousand");
        if (hundred > 0) parts.Add(Ones[hundred] + " Hundred");
        if (lastTwo > 0) parts.Add(TwoDigits(lastTwo));

        return string.Join(" ", parts);
    }

    private static string TwoDigits(int n)
    {
        if (n < 20) return Ones[n];
        return Tens[n / 10] + (n % 10 > 0 ? " " + Ones[n % 10] : "");
    }
}

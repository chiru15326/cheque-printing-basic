using System.ComponentModel.DataAnnotations;

namespace ChequeApi.Dtos;

// ---------- Auth ----------
public class RegisterRequest
{
    [Required, StringLength(100, MinimumLength = 2)]
    public string FullName { get; set; } = "";

    [Required, EmailAddress, StringLength(150)]
    public string Email { get; set; } = "";

    [Required, StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters.")]
    public string Password { get; set; } = "";
}

public class LoginRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = "";

    [Required]
    public string Password { get; set; } = "";
}

public record AuthResponse(string Token, int UserId, string FullName, string Email, DateTime ExpiresAt);

// ---------- Banks & layout ----------
public record BankDto(int BankId, string BankName, double ChequeWidthMm, double ChequeHeightMm,
                      double OffsetXMm, double OffsetYMm, List<LayoutFieldDto> Fields);

public record LayoutFieldDto(int Id, string FieldName, string Label, double XMm, double YMm,
                             double WidthMm, double FontSizePt, double LineHeightMm, double IndentMm);

public class UpdateBankLayoutRequest
{
    [Range(50, 400)] public double ChequeWidthMm { get; set; }
    [Range(30, 200)] public double ChequeHeightMm { get; set; }
    [Range(-50, 50)] public double OffsetXMm { get; set; }
    [Range(-50, 50)] public double OffsetYMm { get; set; }
    public List<LayoutFieldDto> Fields { get; set; } = new();
}

// ---------- Cheques ----------
public class CreateChequeRequest
{
    [Required] public int BankId { get; set; }

    [StringLength(20)] public string? ChequeNo { get; set; }

    [Required] public DateTime ChequeDate { get; set; }

    [Required(ErrorMessage = "Payee name is required."), StringLength(150)]
    public string PayeeName { get; set; } = "";

    [Range(typeof(decimal), "0.01", "999999999999.99", ErrorMessage = "Enter an amount greater than 0.")]
    public decimal Amount { get; set; }

    public bool IsAccountPayee { get; set; }
}

public record ChequeDto(int Id, int BankId, string BankName, string? ChequeNo, DateTime ChequeDate,
                        string PayeeName, decimal Amount, string AmountInWords, bool IsAccountPayee,
                        string PrintedByName, DateTime PrintedOn);

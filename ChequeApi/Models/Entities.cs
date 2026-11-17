namespace ChequeApi.Models;

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";       // stored in lower case
    public string PasswordHash { get; set; } = "";
    public DateTime CreatedOn { get; set; }
}

public class Bank
{
    public int BankId { get; set; }
    public string BankName { get; set; } = "";

    // Physical cheque size (CTS-2010 cheques are about 202 x 92 mm)
    public double ChequeWidthMm { get; set; } = 202;
    public double ChequeHeightMm { get; set; } = 92;

    // Shifts the whole print if your printer feeds the cheque slightly off
    public double OffsetXMm { get; set; }
    public double OffsetYMm { get; set; }

    public List<ChequeLayout> Layouts { get; set; } = new();
}

/// <summary>Position of one printed field on a bank's cheque, measured in mm from the top-left corner.</summary>
public class ChequeLayout
{
    public int Id { get; set; }
    public int BankId { get; set; }
    public Bank? Bank { get; set; }

    /// <summary>Date | Payee | AmountWords | Amount | AcPayee</summary>
    public string FieldName { get; set; } = "";
    public string Label { get; set; } = "";

    public double XMm { get; set; }
    public double YMm { get; set; }

    /// <summary>Width of the field. For Date this is the width of ONE digit box.</summary>
    public double WidthMm { get; set; }
    public double FontSizePt { get; set; } = 11;
    public double LineHeightMm { get; set; } = 7;

    /// <summary>First-line indent (used for amount in words: line 1 starts after "Rupees").</summary>
    public double IndentMm { get; set; }
}

public class ChequePrint
{
    public int Id { get; set; }

    public int BankId { get; set; }
    public Bank? Bank { get; set; }

    public string? ChequeNo { get; set; }
    public DateTime ChequeDate { get; set; }
    public string PayeeName { get; set; } = "";
    public decimal Amount { get; set; }
    public string AmountInWords { get; set; } = "";
    public bool IsAccountPayee { get; set; }

    public int PrintedBy { get; set; }
    public User? PrintedByUser { get; set; }
    public DateTime PrintedOn { get; set; }

    public bool IsDeleted { get; set; }
    public DateTime? DeletedOn { get; set; }
    public int? DeletedBy { get; set; }
}

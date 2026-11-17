using ChequeApi.Models;
using Microsoft.EntityFrameworkCore;

namespace ChequeApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Bank> Banks => Set<Bank>();
    public DbSet<ChequeLayout> ChequeLayouts => Set<ChequeLayout>();
    public DbSet<ChequePrint> ChequePrints => Set<ChequePrint>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.FullName).HasMaxLength(100);
            e.Property(u => u.Email).HasMaxLength(150);
        });

        mb.Entity<Bank>(e =>
        {
            e.HasKey(b => b.BankId);
            e.Property(b => b.BankName).HasMaxLength(100);
            e.HasMany(b => b.Layouts).WithOne(l => l.Bank!).HasForeignKey(l => l.BankId);
        });

        mb.Entity<ChequeLayout>(e =>
        {
            e.HasIndex(l => new { l.BankId, l.FieldName }).IsUnique();
            e.Property(l => l.FieldName).HasMaxLength(30);
            e.Property(l => l.Label).HasMaxLength(50);
        });

        mb.Entity<ChequePrint>(e =>
        {
            e.Property(c => c.PayeeName).HasMaxLength(150);
            e.Property(c => c.ChequeNo).HasMaxLength(20);
            e.Property(c => c.AmountInWords).HasMaxLength(500);
            e.HasOne(c => c.Bank).WithMany().HasForeignKey(c => c.BankId);
            e.HasOne(c => c.PrintedByUser).WithMany().HasForeignKey(c => c.PrintedBy);
            e.HasIndex(c => c.PrintedOn);
            e.HasIndex(c => c.ChequeDate);

            // Soft delete: deleted cheques are hidden from every query automatically
            e.HasQueryFilter(c => !c.IsDeleted);
        });

        // ---------- Seed data ----------
        // Anonymous objects: seed data must not carry navigation properties (Layouts)
        mb.Entity<Bank>().HasData(
            new { BankId = 1, BankName = "Union Bank", ChequeWidthMm = 202.0, ChequeHeightMm = 92.0, OffsetXMm = 0.0, OffsetYMm = 0.0 },
            new { BankId = 2, BankName = "ICICI Bank", ChequeWidthMm = 202.0, ChequeHeightMm = 92.0, OffsetXMm = 0.0, OffsetYMm = 0.0 });

        // Starting positions for a standard CTS-2010 cheque.
        // Measure YOUR cheque leaves and fine-tune them on the "Adjust Print Positions" page.
        var layouts = new List<ChequeLayout>();
        int id = 1;
        foreach (var bankId in new[] { 1, 2 })
        {
            layouts.Add(new ChequeLayout { Id = id++, BankId = bankId, FieldName = "Date",        Label = "Date (DDMMYYYY boxes)", XMm = 154, YMm = 8,  WidthMm = 4.6, FontSizePt = 12, LineHeightMm = 5 });
            layouts.Add(new ChequeLayout { Id = id++, BankId = bankId, FieldName = "Payee",       Label = "Pay (payee name)",      XMm = 20,  YMm = 20, WidthMm = 150, FontSizePt = 12, LineHeightMm = 6 });
            layouts.Add(new ChequeLayout { Id = id++, BankId = bankId, FieldName = "AmountWords", Label = "Rupees (in words)",     XMm = 10,  YMm = 28, WidthMm = 140, FontSizePt = 11, LineHeightMm = 7, IndentMm = 22 });
            layouts.Add(new ChequeLayout { Id = id++, BankId = bankId, FieldName = "Amount",      Label = "Amount (₹ box)",        XMm = 158, YMm = 33, WidthMm = 40,  FontSizePt = 13, LineHeightMm = 6 });
            layouts.Add(new ChequeLayout { Id = id++, BankId = bankId, FieldName = "AcPayee",     Label = "A/C Payee lines",       XMm = 6,   YMm = 10, WidthMm = 28,  FontSizePt = 9,  LineHeightMm = 5 });
        }
        mb.Entity<ChequeLayout>().HasData(layouts);
    }
}

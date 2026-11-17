using ChequeApi.Data;
using ChequeApi.Dtos;
using ChequeApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChequeApi.Controllers;

[ApiController]
[Authorize]
[Route("api/banks")]
public class BanksController : ControllerBase
{
    private readonly AppDbContext _db;

    public BanksController(AppDbContext db) => _db = db;

    /// <summary>All banks (used for the Cheque Printing sub-menu and report filter).</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var banks = await _db.Banks
            .OrderBy(b => b.BankId)
            .Select(b => new { b.BankId, b.BankName })
            .ToListAsync();
        return Ok(banks);
    }

    /// <summary>One bank with its cheque size, printer offset and field positions.</summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<BankDto>> Get(int id)
    {
        var bank = await _db.Banks.Include(b => b.Layouts).FirstOrDefaultAsync(b => b.BankId == id);
        if (bank == null) return NotFound(new { message = "Bank not found." });
        return Ok(ToDto(bank));
    }

    /// <summary>Save calibration changes from the "Adjust Print Positions" page.</summary>
    [HttpPut("{id:int}/layout")]
    public async Task<ActionResult<BankDto>> UpdateLayout(int id, UpdateBankLayoutRequest req)
    {
        var bank = await _db.Banks.Include(b => b.Layouts).FirstOrDefaultAsync(b => b.BankId == id);
        if (bank == null) return NotFound(new { message = "Bank not found." });

        bank.ChequeWidthMm = req.ChequeWidthMm;
        bank.ChequeHeightMm = req.ChequeHeightMm;
        bank.OffsetXMm = req.OffsetXMm;
        bank.OffsetYMm = req.OffsetYMm;

        foreach (var f in req.Fields)
        {
            var field = bank.Layouts.FirstOrDefault(l => l.Id == f.Id);
            if (field == null) continue;

            field.XMm = Clamp(f.XMm, 0, 400);
            field.YMm = Clamp(f.YMm, 0, 200);
            field.WidthMm = Clamp(f.WidthMm, 1, 400);
            field.FontSizePt = Clamp(f.FontSizePt, 5, 30);
            field.LineHeightMm = Clamp(f.LineHeightMm, 2, 20);
            field.IndentMm = Clamp(f.IndentMm, 0, 200);
        }

        await _db.SaveChangesAsync();
        return Ok(ToDto(bank));
    }

    private static double Clamp(double v, double min, double max) => Math.Min(max, Math.Max(min, v));

    private static BankDto ToDto(Bank b) => new(
        b.BankId, b.BankName, b.ChequeWidthMm, b.ChequeHeightMm, b.OffsetXMm, b.OffsetYMm,
        b.Layouts.OrderBy(l => l.Id)
            .Select(l => new LayoutFieldDto(l.Id, l.FieldName, l.Label, l.XMm, l.YMm,
                                            l.WidthMm, l.FontSizePt, l.LineHeightMm, l.IndentMm))
            .ToList());
}

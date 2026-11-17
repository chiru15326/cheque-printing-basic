using ChequeApi.Data;
using ChequeApi.Dtos;
using ChequeApi.Models;
using ChequeApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChequeApi.Controllers;

[ApiController]
[Authorize]
[Route("api/cheques")]
public class ChequesController : ControllerBase
{
    private readonly AppDbContext _db;

    public ChequesController(AppDbContext db) => _db = db;

    private int CurrentUserId => int.Parse(User.FindFirst("uid")!.Value);

    /// <summary>Live preview of the amount in words while the user types.</summary>
    [HttpGet("amount-in-words")]
    public IActionResult GetAmountInWords([FromQuery] decimal amount)
    {
        if (amount <= 0 || amount > 999_999_999_999.99m)
            return Ok(new { words = "" });

        return Ok(new { words = AmountInWords.Convert(amount) });
    }

    /// <summary>Save a cheque record. The React page prints it right after this succeeds.</summary>
    [HttpPost]
    public async Task<ActionResult<ChequeDto>> Create(CreateChequeRequest req)
    {
        var bank = await _db.Banks.FindAsync(req.BankId);
        if (bank == null) return BadRequest(new { message = "Invalid bank." });

        var userId = CurrentUserId;
        var cheque = new ChequePrint
        {
            BankId = req.BankId,
            ChequeNo = string.IsNullOrWhiteSpace(req.ChequeNo) ? null : req.ChequeNo.Trim(),
            ChequeDate = req.ChequeDate.Date,
            PayeeName = req.PayeeName.Trim(),
            Amount = Math.Round(req.Amount, 2, MidpointRounding.AwayFromZero),
            AmountInWords = AmountInWords.Convert(req.Amount),
            IsAccountPayee = req.IsAccountPayee,
            PrintedBy = userId,
            PrintedOn = DateTime.Now
        };

        _db.ChequePrints.Add(cheque);
        await _db.SaveChangesAsync();

        var userName = await _db.Users.Where(u => u.Id == userId).Select(u => u.FullName).FirstAsync();

        return Ok(new ChequeDto(cheque.Id, bank.BankId, bank.BankName, cheque.ChequeNo, cheque.ChequeDate,
            cheque.PayeeName, cheque.Amount, cheque.AmountInWords, cheque.IsAccountPayee,
            userName, cheque.PrintedOn));
    }

    /// <summary>
    /// Report. from/to are inclusive dates. dateField = "printed" (default) or "cheque".
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<ChequeDto>>> List(
        [FromQuery(Name = "from")] DateTime? fromDate, [FromQuery(Name = "to")] DateTime? toDate,
        [FromQuery] int? bankId, [FromQuery] string dateField = "printed")
    {
        var query = _db.ChequePrints.AsNoTracking().AsQueryable();
        bool byChequeDate = string.Equals(dateField, "cheque", StringComparison.OrdinalIgnoreCase);

        if (fromDate.HasValue)
        {
            var f = fromDate.Value.Date;
            query = byChequeDate ? query.Where(c => c.ChequeDate >= f) : query.Where(c => c.PrintedOn >= f);
        }
        if (toDate.HasValue)
        {
            var t = toDate.Value.Date.AddDays(1); // include the whole "to" day
            query = byChequeDate ? query.Where(c => c.ChequeDate < t) : query.Where(c => c.PrintedOn < t);
        }
        if (bankId.HasValue)
            query = query.Where(c => c.BankId == bankId.Value);

        var list = await query
            .OrderByDescending(c => c.PrintedOn)
            .Select(c => new ChequeDto(c.Id, c.BankId, c.Bank!.BankName, c.ChequeNo, c.ChequeDate,
                c.PayeeName, c.Amount, c.AmountInWords, c.IsAccountPayee,
                c.PrintedByUser!.FullName, c.PrintedOn))
            .ToListAsync();

        return Ok(list);
    }

    /// <summary>Soft delete - the row stays in the database for audit but disappears from reports.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var cheque = await _db.ChequePrints.FirstOrDefaultAsync(c => c.Id == id);
        if (cheque == null) return NotFound(new { message = "Record not found." });

        cheque.IsDeleted = true;
        cheque.DeletedOn = DateTime.Now;
        cheque.DeletedBy = CurrentUserId;
        await _db.SaveChangesAsync();

        return NoContent();
    }
}

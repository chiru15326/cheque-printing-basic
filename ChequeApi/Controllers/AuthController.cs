using ChequeApi.Data;
using ChequeApi.Dtos;
using ChequeApi.Models;
using ChequeApi.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChequeApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    // PasswordHasher comes with ASP.NET Core (PBKDF2 + salt) - no extra package needed
    private static readonly PasswordHasher<User> Hasher = new();

    private readonly AppDbContext _db;
    private readonly TokenService _tokens;

    public AuthController(AppDbContext db, TokenService tokens)
    {
        _db = db;
        _tokens = tokens;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();

        if (await _db.Users.AnyAsync(u => u.Email == email))
            return Conflict(new { message = "An account with this email already exists." });

        var user = new User
        {
            FullName = req.FullName.Trim(),
            Email = email,
            CreatedOn = DateTime.Now
        };
        user.PasswordHash = Hasher.HashPassword(user, req.Password);

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Ok(_tokens.CreateAuthResponse(user));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user == null ||
            Hasher.VerifyHashedPassword(user, user.PasswordHash, req.Password) == PasswordVerificationResult.Failed)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        return Ok(_tokens.CreateAuthResponse(user));
    }
}

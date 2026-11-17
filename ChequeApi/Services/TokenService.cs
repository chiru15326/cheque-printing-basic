using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ChequeApi.Dtos;
using ChequeApi.Models;
using Microsoft.IdentityModel.Tokens;

namespace ChequeApi.Services;

public class TokenService
{
    private readonly IConfiguration _config;

    public TokenService(IConfiguration config) => _config = config;

    public AuthResponse CreateAuthResponse(User user)
    {
        var jwt = _config.GetSection("Jwt");
        var hours = jwt.GetValue("ExpiryHours", 12);
        var expires = DateTime.UtcNow.AddHours(hours);

        var claims = new[]
        {
            new Claim("uid", user.Id.ToString()),
            new Claim("name", user.FullName),
            new Claim("email", user.Email)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));
        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        var tokenText = new JwtSecurityTokenHandler().WriteToken(token);
        return new AuthResponse(tokenText, user.Id, user.FullName, user.Email, expires);
    }
}

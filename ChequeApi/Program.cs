using System.Text;
using ChequeApi.Data;
using ChequeApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Lets the app run as a Windows Service. Does nothing when you run it normally (F5 / dotnet run).
builder.Host.UseWindowsService(o => o.ServiceName = "ChequeApp");

// ---------- Database (SQLite file next to the EXE) ----------
// A Windows Service starts in C:\Windows\System32, so never use a relative path here.
var dbPath = Path.Combine(AppContext.BaseDirectory, "ChequeDb.db");
builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlite($"Data Source={dbPath}"));

// ---------- JWT authentication ----------
var jwt = builder.Configuration.GetSection("Jwt");
var jwtKey = jwt["Key"] ?? "";
if (jwtKey.Length < 32)
    throw new InvalidOperationException("Jwt:Key in appsettings.json must be at least 32 characters.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.MapInboundClaims = false; // keep claim names exactly as we wrote them ("uid", "name")
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwt["Audience"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
            NameClaimType = "name"
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddScoped<TokenService>();
builder.Services.AddControllers();

var app = builder.Build();

// ---------- Create / update the database on startup ----------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (db.Database.GetMigrations().Any())
        db.Database.Migrate();      // if you later add EF migrations
    else
        db.Database.EnsureCreated(); // first version: create tables + seed data directly
}

// ---------- Serve React (wwwroot) + API from the same port ----------
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Unknown /api/... URLs should return 404, not the React page
app.MapFallback("/api/{**rest}", () => Results.NotFound(new { message = "API endpoint not found." }));

// Any other URL (e.g. /reports refreshed in the browser) -> React handles the route
app.MapFallbackToFile("index.html");

app.Run();

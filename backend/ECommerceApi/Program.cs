using ECommerceApi.Data;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve;
    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register Email Service
builder.Services.AddScoped<ECommerceApi.Services.IEmailService, ECommerceApi.Services.EmailService>();

// Configure JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"]!,
            ValidAudience = builder.Configuration["Jwt:Audience"]!,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(
        policy =>
        {
            policy.WithOrigins("http://localhost:3000") // React app's default development port
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Launch Swagger in browser when the app has started (only in Development)
app.Lifetime.ApplicationStarted.Register(() =>
{
    if (!app.Environment.IsDevelopment()) return;

    try
    {
        // Try to get an actual bound address (Kestrel / IISExpress)
        var server = app.Services.GetService(typeof(IServer)) as IServer;
        var addressesFeature = server?.Features.Get<IServerAddressesFeature>();
        var baseUrl = addressesFeature?.Addresses?.FirstOrDefault()
                      ?? app.Urls.FirstOrDefault()
                      ?? builder.Configuration["ASPNETCORE_URLS"]
                      ?? "https://localhost:5001";

        var swaggerUrl = baseUrl.TrimEnd('/') + "/swagger";
        Process.Start(new ProcessStartInfo { FileName = swaggerUrl, UseShellExecute = true });
    }
    catch
    {
        // swallow ? opening the browser is a convenience only
    }
});

app.UseHttpsRedirection();

// Enable serving static files from wwwroot (for uploaded images)
app.UseStaticFiles();

app.UseRouting();
app.UseCors(); // Enable CORS middleware - must be after UseRouting
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
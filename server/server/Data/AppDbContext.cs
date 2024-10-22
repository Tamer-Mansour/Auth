using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using server.Entities;

namespace server.Data;

public class AppDbContext : IdentityDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.Entity<IdentityRole>().HasData(
            new IdentityRole { Id = "1", Name = "Admin", NormalizedName = "ADMIN" }
        );
        var hasher = new PasswordHasher<User>();
        builder.Entity<User>().HasData(
            new User
            {
                Id = "1",
                UserName = "admin",
                NormalizedUserName = "ADMIN",
                Email = "admin@example.com",
                NormalizedEmail = "ADMIN@EXAMPLE.COM",
                PasswordHash = hasher.HashPassword(null, "Admin@123"),
                EmailConfirmed = true
            });
    }
}
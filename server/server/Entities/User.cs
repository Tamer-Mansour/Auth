using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace server.Entities;

public class User: IdentityUser
{
    public string? FullName { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime RefreshTokenExpiaryTime { get; set; }
}
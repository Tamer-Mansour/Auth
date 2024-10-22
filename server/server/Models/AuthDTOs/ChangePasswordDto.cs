namespace server.Models.AuthDTOs;

using System.ComponentModel.DataAnnotations;

public class ChangePasswordDto
{
    [Required] [EmailAddress] public string Email { get; set; } = string.Empty;

    [Required] public string CurrentPassword { get; set; } = string.Empty;

    [Required] public string NewPasseord { get; set; } = string.Empty;
}
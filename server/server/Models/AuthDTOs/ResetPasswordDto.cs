﻿namespace server.Models.AuthDTOs;

using System.ComponentModel.DataAnnotations;

public class ResetPasswordDto
{
    [Required] [EmailAddress] public string? Email { get; set; } = string.Empty;
    [Required] public string? Token { get; set; } = string.Empty;
    [Required] [MinLength(8)] public string? NewPassword { get; set; } = string.Empty;
}
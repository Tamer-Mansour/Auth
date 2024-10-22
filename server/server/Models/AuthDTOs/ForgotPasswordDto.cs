﻿namespace server.Models.AuthDTOs;

using System.ComponentModel.DataAnnotations;

public class ForgotPasswordDto
{
    [Required] [EmailAddress] public string Email { get; set; } = string.Empty;
}
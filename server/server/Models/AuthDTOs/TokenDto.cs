﻿namespace server.Models.AuthDTOs;

public class TokenDto
{
    public string RefreshToken { get; set; } = null!;
    public string Token { get; set; } = null!;
    public string Email { get; set; } = null!;
}
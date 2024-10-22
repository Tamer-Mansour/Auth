﻿namespace server.Models.AuthDTOs;

public class UserDetailDto
{
    public string? Id { get; set; }
    public string? FullName { get; set; }

    public string? Email { get; set; }
    public string[]? Roles { get; set; }
    public string? PhoneNumber { get; set; }

    public string? TowFactorEnabled { get; set; }
    public string? PhoneNumberConfirmed { get; set; }
    public int? AccessFailedCount { get; set; }
}
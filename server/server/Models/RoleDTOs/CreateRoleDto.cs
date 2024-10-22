namespace server.Models.RoleDTOs;

using System.ComponentModel.DataAnnotations;

public class CreateRoleDto
{
    [Required(ErrorMessage = "Role name is required")]
    public string? RoleName { get; set; }
}
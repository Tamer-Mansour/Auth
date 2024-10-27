namespace server.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using server.Models.RoleDTOs;
using server.Entities;

[Authorize(Roles = "Admin")]
[Route("api/[controller]")]
[ApiController]
public class RoleController : ControllerBase
{
    public readonly RoleManager<IdentityRole> _roleManager;
    public readonly UserManager<User> _userManager;

    public RoleController(RoleManager<IdentityRole> roleManager, UserManager<User> userManager)
    {
        _roleManager = roleManager;
        _userManager = userManager;
    }

    [HttpPost]
    public async Task<ActionResult> CreateRole([FromBody] CreateRoleDto createRoleDto)
    {
        if (string.IsNullOrEmpty(createRoleDto.RoleName))
        {
            return BadRequest("Role name is required");
        }

        var roleExist = await _roleManager.RoleExistsAsync(createRoleDto.RoleName);
        if (roleExist)
        {
            return BadRequest("Role Already Exist");
        }

        var roleResult = await _roleManager.CreateAsync(new IdentityRole(createRoleDto.RoleName));
        if (roleResult.Succeeded)
        {
            return Ok(new { message = "Role created successfully" });
        }

        return BadRequest("Role creation faild");
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<RoleResponseDto>>> GetAllRoles()
    {
        var roles = _roleManager.Roles.ToList();
        var roleDtos = new List<RoleResponseDto>();

        foreach (var role in roles)
        {
            var usersInRole = await _userManager.GetUsersInRoleAsync(role.Name);
            roleDtos.Add(new RoleResponseDto
            {
                id = role.Id,
                Name = role.Name,
                TotalUser = usersInRole.Count
            });
        }

        return Ok(roleDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RoleResponseDto>> GetRoleById(string id)
    {
        var role = await _roleManager.FindByIdAsync(id);
        if (role == null)
        {
            return NotFound();
        }

        var usersInRole = await _userManager.GetUsersInRoleAsync(role.Name);
        var roleDto = new RoleResponseDto
        {
            id = role.Id,
            Name = role.Name,
            TotalUser = usersInRole.Count
        };

        return Ok(roleDto);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateRole(string id, [FromBody] UpdateRoleDto updateRoleDto)
    {
        if (string.IsNullOrEmpty(updateRoleDto.RoleName))
        {
            return BadRequest("Role name is required");
        }

        var role = await _roleManager.FindByIdAsync(id);
        if (role == null)
        {
            return NotFound();
        }

        role.Name = updateRoleDto.RoleName;
        var roleResult = await _roleManager.UpdateAsync(role);

        if (roleResult.Succeeded)
        {
            return Ok(new { message = "Role updated successfully" });
        }

        return BadRequest("Role update failed");
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteRole(string id)
    {
        var role = await _roleManager.FindByIdAsync(id);
        if (role == null)
        {
            return NotFound();
        }

        var roleResult = await _roleManager.DeleteAsync(role);
        if (roleResult.Succeeded)
        {
            return Ok(new { message = "Role deleted successfully" });
        }

        return BadRequest("Role deletion failed");
    }

    [HttpPost("assign")]
    public async Task<IActionResult> AssignRole([FromBody] RoleAssignDto roleAssignDto)
    {
        var user = await _userManager.FindByIdAsync(roleAssignDto.UserId);
        if (user is null)
        {
            return NotFound("User not found");
        }

        var role = await _roleManager.FindByIdAsync(roleAssignDto.RoleId);
        if (role is null)
        {
            return NotFound("Role not found");
        }

        var result = await _userManager.AddToRoleAsync(user, role.Name!);
        if (result.Succeeded)
        {
            return Ok(new { message = "Role assigned successfully" });
        }

        var error = result.Errors.FirstOrDefault();
        return BadRequest(error!.Description);
    }
    
}
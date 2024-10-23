using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using server.Entities;
using server.Models.AuthDTOs;
using RestSharp;


namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IConfiguration _configuration;

    public UserController(UserManager<User> userManager, RoleManager<IdentityRole> roleManager,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _configuration = configuration;
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto registerDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var user = new User
        {
            Email = registerDto.Email,
            FullName = registerDto.FullName,
            UserName = registerDto.Email,
        };

        var result = await _userManager.CreateAsync(user, registerDto.Password);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        if (registerDto.Roles is null)
        {
            await _userManager.AddToRoleAsync(user, "User");
        }
        else
        {
            foreach (var role in registerDto.Roles)
            {
                await _userManager.AddToRoleAsync(user, role);
            }
        }

        return Ok(new AuthResponseDto
        {
            IsSuccess = true,
            Message = "Account Created Successfully"
        });
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto loginDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var user = await _userManager.FindByEmailAsync(loginDto.Email);
        if (user is null)
        {
            return Unauthorized(new AuthResponseDto
            {
                IsSuccess = false,
                Message = "User not found with this email"
            });
        }

        var result = await _userManager.CheckPasswordAsync(user, loginDto.Password);
        if (!result)
        {
            return Unauthorized(new AuthResponseDto
            {
                IsSuccess = false,
                Message = "Invalid Password"
            });
        }

        var token = GenerateToken(user);
        var refreshToken = GenerateRefreshToken();
        _ = int
            .TryParse(_configuration.GetSection("JWTSetting")
                .GetSection("RefreshTokenValidityIn")
                .Value!, out int RefreshTokenValidityIn);

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiaryTime = DateTime.UtcNow.AddMinutes(RefreshTokenValidityIn);
        await _userManager.UpdateAsync(user);


        return Ok(new AuthResponseDto
        {
            Token = token,
            IsSuccess = true,
            Message = "Login Success",
            RefreshToken = refreshToken
        });
    }

    [AllowAnonymous]
    [HttpPost("refresh-token")]
    public async Task<ActionResult<AuthResponseDto>> RefreshToken(TokenDto tokenDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var principal = GetPrincipalFormExpiredToken(tokenDto.Token);
        var user = await _userManager.FindByEmailAsync(tokenDto.Email);

        if (principal is null || user is null || user.RefreshToken != tokenDto.RefreshToken ||
            user.RefreshTokenExpiaryTime <= DateTime.UtcNow)
            return BadRequest(new AuthResponseDto
            {
                IsSuccess = false,
                Message = "Invalid client request"
            });
        var newJwtToken = GenerateToken(user);
        var newRefreshToken = GenerateRefreshToken();

        _ = int
            .TryParse(_configuration.GetSection("JWTSetting")
                .GetSection("RefreshTokenValidityIn")
                .Value!, out int RefreshTokenValidityIn);
        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiaryTime = DateTime.UtcNow.AddMinutes(RefreshTokenValidityIn);

        await _userManager.UpdateAsync(user);

        return Ok(new AuthResponseDto
        {
            IsSuccess = true,
            Token = newJwtToken,
            RefreshToken = newRefreshToken,
            Message = "Refreshed token successfully"
        });
    }

    private ClaimsPrincipal? GetPrincipalFormExpiredToken(string token)
    {
        var tokenParamerters = new TokenValidationParameters()
        {
            ValidateAudience = false,
            ValidateIssuer = false,
            ValidateIssuerSigningKey = false,

            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8
                .GetBytes(_configuration
                    .GetSection("JWTSetting")
                    .GetSection("securityKey").Value!)),

            ValidateLifetime = false,
        };
        var tokenHandler = new JwtSecurityTokenHandler();
        var principal = tokenHandler.ValidateToken(token, tokenParamerters, out SecurityToken securityToken);
        if (securityToken is not JwtSecurityToken jwtSecurityToken ||
            !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256,
                StringComparison.InvariantCultureIgnoreCase))
            throw new SecurityTokenException("Invalid token");
        return principal;
    }


    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private string GenerateToken(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_configuration.GetSection("JWTSetting").GetSection("securityKey").Value!);
        var roles = _userManager.GetRolesAsync(user).Result;

        List<Claim> claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? ""),
            new Claim(JwtRegisteredClaimNames.Name, user.FullName ?? ""),
            new Claim(JwtRegisteredClaimNames.NameId, user.Id ?? ""),
            new Claim(JwtRegisteredClaimNames.Aud, _configuration.GetSection("JWTSetting")
                .GetSection("ValidAudience").Value!),
            new Claim(JwtRegisteredClaimNames.Iss, _configuration.GetSection("JWTSetting")
                .GetSection("ValidIssuer").Value!)
        };
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddSeconds(1800),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    [Authorize]
    [HttpGet("Detail")]
    public async Task<ActionResult<UserDetailDto>> GetUserDetail()
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(currentUserId);
        if (user == null)
        {
            return NotFound(new AuthResponseDto
            {
                IsSuccess = false,
                Message = "User Not Found",
            });
        }

        return Ok(new UserDetailDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Roles = [.. await _userManager.GetRolesAsync(user)],
            PhoneNumber = user.PhoneNumber,
            //PhoneNumberConfirmed = user.PhoneNumberConfirmed,
            AccessFailedCount = user.AccessFailedCount,
        });
    }

    [Authorize]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDetailDto>>> GetUsers()
    {
        var users = await _userManager.Users.ToListAsync();

        var userDetails = new List<UserDetailDto>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);

            userDetails.Add(new UserDetailDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Roles = roles.ToArray()
            });
        }

        return Ok(userDetails);
    }

    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<ActionResult<AuthResponseDto>> ResetPassword(ResetPasswordDto resetPasswordDto)
    {
        var user = await _userManager.FindByEmailAsync(resetPasswordDto.Email);
        //resetPasswordDto.Token = WebUtility.UrlDecode(resetPasswordDto.Token);
        if (user == null)
        {
            return BadRequest(new AuthResponseDto
            {
                IsSuccess = false,
                Message = "No user found with this email"
            });
        }

        var result = await _userManager.ResetPasswordAsync(user, resetPasswordDto.Token, resetPasswordDto.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(new AuthResponseDto
            {
                IsSuccess = false,
                Message = result.Errors.FirstOrDefault().Description
            });
        }

        return Ok(new AuthResponseDto
        {
            IsSuccess = true,
            Message = "Password reset successfully"
        });
    }

    [Authorize]
    [HttpPut("edit/{userId}")]
    public async Task<ActionResult<AuthResponseDto>> EditProfile(string userId, EditProfileDto editProfileDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var isAdmin = User.IsInRole("admin");
        if (!isAdmin && currentUserId != userId)
        {
            return Forbid();
        }

        var user = await _userManager.FindByIdAsync(userId);

        if (user == null)
        {
            return NotFound(new AuthResponseDto
            {
                IsSuccess = false,
                Message = "User Not Found"
            });
        }

        user.FullName = editProfileDto.FullName ?? user.FullName;
        user.Email = editProfileDto.Email ?? user.Email;
        user.PhoneNumber = editProfileDto.PhoneNumber ?? user.PhoneNumber;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(new AuthResponseDto
            {
                IsSuccess = false,
                Message = "Error updating profile"
            });
        }

        return Ok(new AuthResponseDto
        {
            IsSuccess = true,
            Message = "Profile updated successfully"
        });
    }

    [Authorize(Roles = "admin")]
    [HttpDelete("{userId}")]
    public async Task<ActionResult<AuthResponseDto>> HardDeleteUser(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return NotFound(new AuthResponseDto
            {
                IsSuccess = false,
                Message = "User not found"
            });
        }

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(new AuthResponseDto
            {
                IsSuccess = false,
                Message = "Error deleting user"
            });
        }

        return Ok(new AuthResponseDto
        {
            IsSuccess = true,
            Message = "User deleted successfully"
        });
    }

    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<ActionResult> ForgotPassword(ForgotPasswordDto forgotPasswordDto)
    {
        var user = await _userManager.FindByEmailAsync(forgotPasswordDto.Email);
        if (user == null)
        {
            return Ok(new AuthResponseDto
            {
                IsSuccess = false,
                Message = "User does not exist with this email"
            });
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var restLink = $"http://localhost:4200/reset-password?email={user.Email}&token={WebUtility.UrlEncode(token)}";
        var client = new RestClient("https://send.api.mailtrap.io/api/send");

        var request = new RestRequest
        {
            Method = Method.Post,
            RequestFormat = DataFormat.Json,
        };

        request.AddHeader("Authorization", "Bearer 52ea89be09b582d9712e10b849fd5026");
        request.AddJsonBody(new
        {
            from = new { email = "mailtrap@demomailtrap.com" },
            to = new[] { new { email = user.Email } },
            template_uuid = "2f6e1217-a321-4de4-9c2f-2db09dfcace2",
            template_variables = new { user_email = user.Email, pass_reset_link = restLink }
        });
        var response = client.Execute(request);
        if (response.IsSuccessful)
        {
            return Ok(new AuthResponseDto
            {
                IsSuccess = true,
                Message = "Email send with password reset link. please check you email. "
            });
        }
        else
        {
            return BadRequest(new AuthResponseDto
            {
                IsSuccess = false,
                Message = response.Content.ToString()
            });
        }
    }

    [HttpPost("change-password")]
    public async Task<ActionResult> ChangePassword(ChangePasswordDto changePasswordDto)
    {
        var user = await _userManager.FindByEmailAsync(changePasswordDto.Email);
        if (user == null)
        {
            return BadRequest(new AuthResponseDto
            {
                IsSuccess = false,
                Message = "User does not exist with this email"
            });
        }

        var result =
            await _userManager.ChangePasswordAsync(user, changePasswordDto.CurrentPassword,
                changePasswordDto.NewPasseord);
        if (result.Succeeded)
        {
            return Ok(new AuthResponseDto
            {
                IsSuccess = true,
                Message = "Password changed successfully"
            });
        }

        return BadRequest(new AuthResponseDto
        {
            IsSuccess = false,
            Message = result.Errors.FirstOrDefault()!.Description
        });
    }
}
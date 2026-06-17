using Application.Dtos.User;
using Application.Interfaces;
using Domain.Settings;
using Infrastructure.Identity.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Infrastructure.Identity.Services
{
    public class UserAccountServiceForWebApi : BaseUserAccountService, IUserAccountServiceForWebApi
    {
        private readonly UserManager<UserAccount> userManager;
        private readonly SignInManager<UserAccount> signInManager;
        private readonly JwtSettings jwtSettings;
        public UserAccountServiceForWebApi(UserManager<UserAccount> userManager, SignInManager<UserAccount> signInManager, IEmailService emailService,
               IOptions<JwtSettings> jwtSettings) : base(userManager, emailService)
        {
            this.userManager = userManager;
            this.signInManager = signInManager;
            this.jwtSettings = jwtSettings.Value;
        }
        public async Task<LoginResponseForApiDto?> AuthenticateAsync(LoginDto loginDto)
        {

            var user = await userManager.FindByEmailAsync(loginDto.Email);


            if (user == null) return null;


            if (!user.EmailConfirmed)
            {

                throw new InvalidOperationException("ACCOUNT_NOT_CONFIRMED");
            }


            var result = await signInManager.PasswordSignInAsync(user.UserName ?? "", loginDto.Password, false, true);

            if (!result.Succeeded)
            {
                if (result.IsLockedOut)
                {
                    throw new InvalidOperationException("ACCOUNT_LOCKED");
                }

                return null; 
            }

        
            var roles = await userManager.GetRolesAsync(user);
            var userRole = roles.FirstOrDefault() ?? "Cliente"; 

         
            JwtSecurityToken jwtSecurityToken = await GenerateJwtToken(user);
            string tokenString = new JwtSecurityTokenHandler().WriteToken(jwtSecurityToken);

           
            return new LoginResponseForApiDto
            {
                AccessToken = tokenString,
                TokenType = "Bearer",
                ExpiresIn = 3600, // 1 hora
                User = new UserSessionDto
                {
                    Id = user.Id,
                    Name = user.Name,
                    Email = user.Email ?? string.Empty,
                    Role = userRole
                }
            };
        }


        //public override async Task<RegisterResponseDto> RegisterUserAsync(SaveUserDto saveDto, string? origin, bool? isApi = false)
        //{
        //    return await base.RegisterUserAsync(saveDto, null, isApi);
        //}

        //public override async Task<EditResponseDto> EditUser(SaveUserDto saveDto, string? origin, bool? isCreated = false, bool? isApi = false)
        //{
        //    return await base.EditUser(saveDto, null, isCreated, isApi);
        //}

        public override async Task<UserResponseDto> ForgotPasswordAsync(ForgotPasswordRequestDto request)
        {
            return await base.ForgotPasswordAsync(request);
        }

        #region "private methods"

        private async Task<JwtSecurityToken> GenerateJwtToken(UserAccount user)
        {
            var userClaims = await userManager.GetClaimsAsync(user);
            var roles = await userManager.GetRolesAsync(user);

            var rolesClaims = new List<Claim>();
            foreach (var role in roles)
            {
                rolesClaims.Add(new Claim("roles", role));
            }
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub,user.UserName ?? ""),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? ""),
                new Claim("uid",user.Id ?? "")
            }.Union(userClaims).Union(rolesClaims);

            var symmetricSecurityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey));
            var signingCredentials = new SigningCredentials(symmetricSecurityKey, SecurityAlgorithms.HmacSha256);

            var jwtSecurityToken = new JwtSecurityToken(
                issuer: jwtSettings.Issuer,
                audience: jwtSettings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(jwtSettings.DurationInMinutes),
                signingCredentials: signingCredentials
            );

            return jwtSecurityToken;
        }

        #endregion

    }
}

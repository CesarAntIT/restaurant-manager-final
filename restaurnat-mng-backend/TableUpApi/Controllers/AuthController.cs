using Application.Dtos.User;
using Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace TableUpApi.Controllers
{
    [SwaggerTag("Endpoints for user authentication, registration, and account recovery")]
    [Route("api/auth")]
    [ApiController] 
    public class AuthController : ControllerBase 
    {
        private readonly IUserAccountServiceForWebApi userAccountService;

        public AuthController(IUserAccountServiceForWebApi userAccountService)
        {
            this.userAccountService = userAccountService;
        }

        [HttpPost("login")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(LoginDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(
            Summary = "Authenticate user",
            Description = "Validates user credentials and returns an authentication token with user information"
        )]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            return Ok(await userAccountService.AuthenticateAsync(dto));
        }

        [HttpPost("confirm-account")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(
            Summary = "Confirm user account",
            Description = "Validates and confirms a user's account using a token"
        )]
        public async Task<IActionResult> Confirm([FromBody] ConfirmRequestDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            var result = await userAccountService.ConfirmAccountAsync(dto.UserId, dto.Token);

            if (result == null || result.HasError)
                return BadRequest(result?.Message);

            return Ok(result.Message);
        }

        [HttpPost("forgot-password")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(
            Summary = "Generate password reset token",
            Description = "Generates a secure token for password recovery and sends it via email"
        )]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordApiRequestDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            var result = await userAccountService.ForgotPasswordAsync(
                        new ForgotPasswordRequestDto { UserName = dto.UserName });

            if (result == null || result.HasError)
                return BadRequest(result?.Errors);

            return NoContent();
        }

        [HttpPost("change-password")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(
            Summary = "Reset user password",
            Description = "Resets the user's password using the provided reset token"
        )]
        public async Task<IActionResult> ChangePassword([FromBody] ResetPasswordRequestDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            var result = await userAccountService.ResetPasswordAsync(dto);

            if (result == null || result.HasError)
                return BadRequest(result?.Errors);

            return NoContent();
        }
    }
}
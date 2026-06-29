using Application.Dtos.User;
using Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Win32;
using Org.BouncyCastle.Pqc.Crypto.Lms;
using Swashbuckle.AspNetCore.Annotations;
using System.Data;
using System.Security.Claims;
using System.Security.Principal;

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
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Summary = "Inicio de Sesion", Description = "Permite autenticar un usuario mediante email y contrasena.")]
        public async Task<IActionResult> Login([FromBody] LoginApiRequestDto dto)
        {
            var traceId = $"00-login-{Guid.NewGuid()}";

            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    error = new
                    {
                        code = "VALIDATION_ERROR",
                        message = "La solicitud contiene datos invalidos.",
                        traceId = traceId
                    }
                });
            }

            try
            {
                // Se mapea al DTO que espera tu servicio existente
                var loginDto = new LoginDto
                {
                    Email = dto.Email,
                    Password = dto.Password
                };

                var result = await userAccountService.AuthenticateAsync(loginDto);

                // Si las credenciales fallan o el servicio devuelve que tiene error
                if (result == null || result.HasError)
                {
                    return StatusCode(StatusCodes.Status401Unauthorized, new
                    {
                        success = false,
                        error = new
                        {
                            code = "INVALID_CREDENTIALS",
                            message = "Credenciales invalidas.",
                            traceId = traceId
                        }
                    });
                }

                string displayRole = result.User.Role switch
                {
                    "Client" => "Cliente",
                    "Owner" => "Dueño",
                    "Admin" => "Admin",
                    _ => result.User.Role
                };

                return Ok(new
                {
                    success = true,
                    message = "Autentication exitosa.",
                    data = new
                    {
                        accessToken = result.AccessToken,
                        tokenType = "Bearer",
                        expiresIn = result.ExpiresIn,
                        user = new
                        {
                            id = result.User.Id,
                            name = result.User.Name,
                            email = result.User.Email,
                            role = displayRole
                        }
                    }
                });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error = new
                    {
                        code = "INTERNAL_SERVER_ERROR",
                        message = "Ocurrio un error inesperado al procesar la solicitud.",
                        traceId = traceId
                    }
                });
            }
        }

        [HttpPost("register")]
        [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(RegisterResponseDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Summary = "Registro de Usuario", Description = "Permite registrar usuarios en la plataforma utilizando Microsoft Identity.")]
        public async Task<IActionResult> Register([FromBody] SaveUserDto dto)
        {
            var traceId = $"00-register-{Guid.NewGuid()}";

            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    error = new { code = "VALIDATION_ERROR", message = "La solicitud contiene datos invalidos.", traceId = traceId }
                });
            }

            try
            {
                var result = await userAccountService.RegisterUser(dto, null, true);

                return StatusCode(StatusCodes.Status201Created, new
                {
                    success = true,
                    message = "Usuario registrado correctamente.",
                    data = result
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    error = new { code = "VALIDATION_ERROR", message = ex.Message.Replace("IDENTITY_ERROR: ", ""), traceId = traceId }
                });
            }
        }

        [HttpPost("password/forgot")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Summary = "Recuperacion de Contrasena", Description = "Permite iniciar el proceso de recuperacion de contrasena usando Email o Username.")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordApiRequestDto dto)
        {
            var traceId = $"00-forgot-password-{Guid.NewGuid()}";

            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    error = new { code = "VALIDATION_ERROR", message = "La solicitud contiene datos invalidos.", traceId = traceId }
                });
            }

            try
            {
                // Pasamos el Identifier en lugar del Email fijo
                var result = await userAccountService.ForgotPasswordAsync(
                    new ForgotPasswordRequestDto { UserName = dto.Identifier });

                if (result != null && result.HasError)
                {
                    return BadRequest(new
                    {
                        success = false,
                        error = new { code = "VALIDATION_ERROR", message = string.Join(" ", result.Errors), traceId = traceId }
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Si la cuenta existe, se generara un proceso de recuperacion de contrasena.",
                    data = new { processed = true }
                });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error = new { code = "INTERNAL_SERVER_ERROR", message = "Ocurrio un error inesperado al procesar la solicitud.", traceId = traceId }
                });
            }
        }


        [HttpPost("password/reset")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Summary = "Restablecimiento de Contrasena", Description = "Permite establecer una nueva contrasena utilizando un token emitido por Microsoft Identity.")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto dto)
        {
            var traceId = $"00-reset-password-{Guid.NewGuid()}";

            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    error = new
                    {
                        code = "VALIDATION_ERROR",
                        message = "La solicitud contiene datos invalidos.",
                        traceId = traceId
                    }
                });
            }

            try
            {
                var result = await userAccountService.ResetPasswordAsync(dto);

                if (result == null || result.HasError)
                {
                    var errorMessage = result != null && result.Errors.Count > 0
                        ? string.Join(" ", result.Errors)
                        : "La solicitud contiene datos invalidos.";

                    return BadRequest(new
                    {
                        success = false,
                        error = new
                        {
                            code = "VALIDATION_ERROR",
                            message = errorMessage,
                            traceId = traceId
                        }
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Contrasena restablecida correctamente.",
                    data = new { updated = true }
                });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error = new
                    {
                        code = "INTERNAL_SERVER_ERROR",
                        message = "Ocurrio un error inesperado al procesar la solicitud.",
                        traceId = traceId
                    }
                });
            }
        }

        [HttpGet("me")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Summary = "Consultar perfil Autenticado", Description = "Permite consultar los datos básicos del usuario autenticado. Email y Rol son datos de auditoría y no deben modificarse desde el endpoint de perfil.")]
        public async Task<IActionResult> GetProfile()
        {
            var traceId = $"00-profile-{Guid.NewGuid()}";

            try
            {
                var userId = User.FindFirst("uid")?.Value
                             ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new
                    {
                        success = false,
                        error = new { code = "UNAUTHORIZED", message = "Token JWT ausente, invalido o expirado.", traceId = traceId }
                    });
                }


                var profile = await userAccountService.GetUserProfileByIdAsync(userId);

                if (profile == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        error = new { code = "NOT_FOUND", message = "El recurso solicitado no fue encontrado.", traceId = traceId }
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Perfil obtenido correctamente.",
                    data = profile
                });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error = new { code = "INTERNAL_SERVER_ERROR", message = "Ocurrio un error inesperado al procesar la solicitud.", traceId = traceId }
                });
            }
        }

        [HttpPut("me/profile")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Summary = "Actualizacion de perfil (Solo Nombre y Contraseña)", Description = "Permite al usuario actualizar Name y Password. Username, Email y Rol permanecen bloqueados por auditoria.")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequestDto dto)
        {
            var traceId = $"00-update-profile-{Guid.NewGuid()}";

            // Regla de auditoria extendida: Bloquear si envian Username, Email o Role
            if (!string.IsNullOrEmpty(dto.Username) || !string.IsNullOrEmpty(dto.Email) || !string.IsNullOrEmpty(dto.Role) || !ModelState.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    error = new { code = "VALIDATION_ERROR", message = "La solicitud contiene datos invalidos.", traceId = traceId }
                });
            }

            try
            {
                var userId = User.FindFirst("uid")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new
                    {
                        success = false,
                        error = new { code = "UNAUTHORIZED", message = "Token JWT ausente, invalido o expirado.", traceId = traceId }
                    });
                }

                var result = await userAccountService.UpdateUserProfileAsync(userId, dto);
                if (result == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        error = new { code = "VALIDATION_ERROR", message = "La solicitud contiene datos invalidos o la contrasena no cumple con las politicas.", traceId = traceId }
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Perfil actualizado correctamente.",
                    data = result
                });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error = new { code = "INTERNAL_SERVER_ERROR", message = "Ocurrio un error inesperado al procesar la solicitud.", traceId = traceId }
                });
            }
        }

    }
}
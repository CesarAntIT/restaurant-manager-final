using Swashbuckle.AspNetCore.Annotations;
using System.ComponentModel.DataAnnotations;

namespace Application.Dtos.User
{
    public class ForgotPasswordApiRequestDto
    {
        [Required(ErrorMessage = "El campo Email es requerido.")]
        [EmailAddress(ErrorMessage = "El formato del correo electrónico no es válido.")]
        [SwaggerParameter(Description = "El correo electrónico de la cuenta que solicita restablecer la contraseña.")]
        public required string Email { get; set; }
    }
}

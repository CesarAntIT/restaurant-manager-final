using Swashbuckle.AspNetCore.Annotations;
using System.ComponentModel.DataAnnotations;

namespace Application.Dtos.User
{
    public class ForgotPasswordApiRequestDto
    {
        [Required(ErrorMessage = "El campo correo electrónico o nombre de usuario es requerido.")]
        [SwaggerParameter(Description = "El correo electrónico o el nombre de usuario de la cuenta que solicita restablecer la contraseña.")]
        public required string Identifier { get; set; }
    }
}

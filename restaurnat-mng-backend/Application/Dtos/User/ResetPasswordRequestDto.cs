using System.ComponentModel.DataAnnotations;

namespace Application.Dtos.User
{
    public class ResetPasswordRequestDto
    {
        [Required(ErrorMessage = "El campo Email es requerido.")]
        [EmailAddress(ErrorMessage = "El formato del correo electrónico no es válido.")]
        public required string Email { get; set; }

        [Required(ErrorMessage = "El token de recuperación es requerido.")]
        public required string Token { get; set; }

        [Required(ErrorMessage = "La nueva contraseña es requerida.")]
        public required string Password { get; set; }

        [Required(ErrorMessage = "Debe confirmar la nueva contraseña.")]
        [Compare("Password", ErrorMessage = "La contraseña y la confirmación no coinciden.")]
        public required string ConfirmPassword { get; set; }
    }
}

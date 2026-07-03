using System.ComponentModel.DataAnnotations;

namespace Application.Dtos.User
{
    public class SaveUserDto
    {
        [Required(ErrorMessage = "El campo Name es requerido.")]
        [StringLength(120, ErrorMessage = "El nombre no puede exceder los 120 caracteres.")]
        public required string Name { get; set; }

        [Required(ErrorMessage = "El campo Username es requerido.")]
        [StringLength(50, ErrorMessage = "El nombre de usuario no puede exceder los 50 caracteres.")]
        public required string Username { get; set; }

        [Required(ErrorMessage = "El campo Email es requerido.")]
        [EmailAddress(ErrorMessage = "El formato del correo electrónico no es válido.")]
        public required string Email { get; set; }

        [Required(ErrorMessage = "La contraseña es requerida.")]
        [MinLength(8, ErrorMessage = "La contraseña debe tener mínimo 8 caracteres.")]
        // Nota: Identity valida por defecto las mayúsculas/números, pero dejamos el DTO limpio
        public required string Password { get; set; }

        [Required(ErrorMessage = "Debe confirmar la contraseña.")]
        [Compare("Password", ErrorMessage = "La contraseña y la confirmación no coinciden.")]
        public required string ConfirmPassword { get; set; }

        [Required(ErrorMessage = "El campo Role es requerido.")]
        [RegularExpression("^(Cliente|Dueño|Admin)$", ErrorMessage = "El rol especificado no es válido. Valores permitidos: Cliente, Dueño, Admin.")]
        public required string Role { get; set; }
    }
}

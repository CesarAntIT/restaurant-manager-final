using System.ComponentModel.DataAnnotations;

namespace Application.Dtos.User
{
    public class LoginDto
    {
        [Required(ErrorMessage = "El campo Email es requerido.")]
        [EmailAddress(ErrorMessage = "El formato del correo electrónico no es válido.")]
        public required string Email { get; set; }

        [Required(ErrorMessage = "El campo Password es requerido y no puede estar vacío.")]
        public required string Password { get; set; }
    }

    public class LoginApiRequestDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }



    namespace Application.Dtos.User
    {
        public class LoginApiRequestDto
        {
            [Required]
            [EmailAddress]
            public string Email { get; set; } = string.Empty;

            [Required]
            public string Password { get; set; } = string.Empty;
        }
    }

}

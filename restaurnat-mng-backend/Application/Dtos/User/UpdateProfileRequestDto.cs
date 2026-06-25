using System.ComponentModel.DataAnnotations;

namespace Application.Dtos.User
{
    public class UpdateProfileRequestDto
    {
        [Required]
        [MaxLength(120)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;

        [Required]
        [Compare("Password")]
        public string ConfirmPassword { get; set; } = string.Empty;

        public string? Username { get; set; } 
        public string? Email { get; set; }
        public string? Role { get; set; }
    }
}
using Domain.Common.Enums;
using System.ComponentModel.DataAnnotations;

public class UpdateMenuDto
{
    [Required(ErrorMessage = "El nombre del menú es requerido.")]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    public MenuStatus Status { get; set; }
}
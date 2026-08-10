using System.ComponentModel.DataAnnotations;

public class CreateMenuDto
{
    [Required(ErrorMessage = "El restaurante es requerido.")]
    public int RestaurantId { get; set; }

    [Required(ErrorMessage = "El nombre del menú es requerido.")]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }
}
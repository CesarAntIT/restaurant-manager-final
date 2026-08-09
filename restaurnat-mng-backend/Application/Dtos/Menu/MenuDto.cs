using Domain.Common.Enums;

public class MenuDto
{
    public int Id { get; set; }

    public int RestaurantId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public MenuStatus Status { get; set; }
}
using Domain.Common.Enums;

namespace Application.Dtos.Restaurant;

public class UpdateRestaurantDto
{
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public RestaurantStatus Status { get; set; }
}
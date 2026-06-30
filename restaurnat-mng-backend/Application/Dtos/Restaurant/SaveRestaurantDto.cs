using Microsoft.AspNetCore.Http;

namespace Application.Dtos.Restaurant;

public class SaveRestaurantDto
{
    public string OwnerId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }

    public List<IFormFile> Images { get; set; } = [];
}
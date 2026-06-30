using Domain.Common.Enums;
using Microsoft.AspNetCore.Http;

namespace Application.Dtos.Restaurant
{
    public class RestaurantDto
    {
        public int Id { get; set; }
        public string OwnerId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public RestaurantStatus Status { get; set; }
        public string Address { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public DateTime CreatedAt { get; set; }

        public List<String> Images { get; set; } = new();
    }

}
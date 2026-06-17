using Domain.Common.Enums;

namespace Domain.Entities
{
    public class Review
    {
        public required int Id { get; set; }
        public required string UserId { get; set; }
        public required int RestaurantId { get; set; } // FK
        public required int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // nav property
        public Restaurant? Restaurant { get; set; }
    }
}
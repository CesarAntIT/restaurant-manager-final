using Domain.Common.Enums;

namespace Domain.Entities
{
    public class Restaurant
    {
        public required int Id { get; set; }
        public required string OwnerId { get; set; } // fk
        public required string Name { get; set; }
        public required string Category { get; set; }
        public RestaurantStatus Status { get; set; }
        public required string Address { get; set; }
        public string? PhoneNumber { get; set; }

        public decimal PromedioRating { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Table> Tables { get; set; } = new List<Table>();
        public ICollection<Menu> Menus { get; set; } = new List<Menu>();

        public ICollection<Ingredient> Ingredients { get; set; } = new List<Ingredient>();

        public ICollection<Review> Reviews { get; set; } = new List<Review>();

        public ICollection<WorkDay> WorkDays { get; set; } = new List<WorkDay>();

        public ICollection<RestaurantImage> RestaurantImages { get; set; } = new List<RestaurantImage>();
    }

}

using Domain.Common.Enums;

namespace Domain.Entities
{
    public class Restaurant
    {
        public required int Id { get; set; }
        public required string OwnerId { get; set; } // FK a Users
        public required string Name { get; set; }
        public required string Category { get; set; }
        public RestaurantStatus Status { get; set; }
        public required string Address { get; set; }
        public string? PhoneNumber { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Table> Tables { get; set; } = new List<Table>();
        public ICollection<Menu> Menus { get; set; } = new List<Menu>();
    }

}

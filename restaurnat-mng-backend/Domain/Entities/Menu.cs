using Domain.Common.Enums;

namespace Domain.Entities
{
    public class Menu
    {
        public required int Id { get; set; }
        public required int RestaurantId { get; set; } //fk
        public required string Name { get; set; }
        public string? Description { get; set; }
        public MenuStatus Status { get; set; }

        //nav property
        public ICollection<MenuDish> MenuDishes { get; set; } = new List<MenuDish>();

        public Restaurant? Restaurant { get; set; }
    }
}
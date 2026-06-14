using Domain.Common.Enums;

namespace Domain.Entities
{
    public class Menu
    {
        public required int Id { get; set; }
        public required int RestaurantId { get; set; } //fk
        public required string Name { get; set; }
        public string? Description { get; set; }
        public required decimal Price { get; set; }
        public MenuStatus Status { get; set; }

         //nav property
        public ICollection<DishIngredient> DishIngredients { get; set; } = new List<DishIngredient>();
    }
}
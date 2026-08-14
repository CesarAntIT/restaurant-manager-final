namespace Domain.Entities
{
    public class Ingredient
    {
        public required int Id { get; set; }
        public required int RestaurantId { get; set; }
        public required string Name { get; set; }
        public required decimal InitialQuantity { get; set; }
        public required decimal Quantity { get; set; }
        public required decimal StockMinimo { get; set; }
        public required decimal Cost { get; set; }
        public required string WeightUnit { get; set; }

        public ICollection<DishIngredient> DishIngredients { get; set; } = new List<DishIngredient>();

        public Restaurant? Restaurant { get; set; }
    }
}
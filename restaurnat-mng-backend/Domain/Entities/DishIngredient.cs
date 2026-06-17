namespace Domain.Entities
{
    public class DishIngredient
    {
        public required int DishId { get; set; } //fk
        public required int IngredientId { get; set; } //fk
        public required decimal QuantityNeeded { get; set; }

        // nav property
        public Dish? Dish { get; set; }
        public Ingredient? Ingredient { get; set; }

    }
}
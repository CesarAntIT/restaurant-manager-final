namespace Domain.Entities
{
    public class DishIngredient
    {
        public required int MenuId { get; set; } //fk
        public required int IngredientId { get; set; } //fk
        public required decimal QuantityNeeded { get; set; }

        // nav property
        public Menu? Menu { get; set; }
        public Ingredient? Ingredient { get; set; }
    }
}
namespace Application.Dtos.Dish
{
    public class SaveDishDto
    {
        public required string Name { get; set; }
        public string? Description { get; set; }
        public required decimal Price { get; set; }
        public List<SaveDishIngredientDto> Ingredients { get; set; } = new();
    }

    public class SaveDishIngredientDto
    {
        public required int IngredientId { get; set; }
        public required decimal QuantityNeeded { get; set; }
    }
}
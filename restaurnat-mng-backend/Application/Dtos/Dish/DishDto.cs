namespace Application.Dtos.Dish
{
    public class DishDto
    {
        public int Id { get; set; }
        public int RestaurantId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public List<DishIngredientDto> Ingredients { get; set; } = new();
    }

    public class DishIngredientDto
    {
        public int IngredientId { get; set; }
        public string IngredientName { get; set; }
        public decimal QuantityNeeded { get; set; }
        public string WeightUnit { get; set; }
    }
}
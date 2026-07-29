namespace Application.Dtos.Ingredient
{
    public class UpdateIngredientDto
    {
        public required string Name { get; set; }
        public required decimal Quantity { get; set; }
        public required decimal StockMinimo { get; set; }
        public required decimal Cost { get; set; }
        public required string WeightUnit { get; set; }
    }
}
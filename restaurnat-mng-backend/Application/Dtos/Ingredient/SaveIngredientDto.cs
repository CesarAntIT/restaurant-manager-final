namespace Application.Dtos.Ingredient
{
    public class SaveIngredientDto
    {
        public required string Name { get; set; }
        public required decimal InitialQuantity { get; set; }
        public required decimal StockMinimo { get; set; }
        public required decimal Cost { get; set; }
        public required string WeightUnit { get; set; }
    }
}
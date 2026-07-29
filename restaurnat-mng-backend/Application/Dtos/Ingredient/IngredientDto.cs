namespace Application.Dtos.Ingredient
{
    public class IngredientDto
    {
        public int Id { get; set; }
        public int RestaurantId { get; set; }
        public string Name { get; set; }
        public decimal InitialQuantity { get; set; }
        public decimal Quantity { get; set; }
        public decimal StockMinimo { get; set; }
        public decimal Cost { get; set; }
        public string WeightUnit { get; set; }
    }
}
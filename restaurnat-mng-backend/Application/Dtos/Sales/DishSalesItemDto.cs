namespace Application.Dtos.Sales
{
    public class DishSalesItemDto
    {
        public int DishId { get; set; }
        public string DishName { get; set; } = string.Empty;
        public int QuantitySold { get; set; }
        public decimal Revenue { get; set; }
    }
}
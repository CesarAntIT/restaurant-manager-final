namespace Application.Dtos.Sales
{
    public class DailySalesSummaryDto
    {
        public int WorkDayId { get; set; }
        public int RestaurantId { get; set; }
        public DateTime Date { get; set; }
        public DateTime? TimeClose { get; set; }
        public decimal TotalRevenue { get; set; }
        public int TotalItemsSold { get; set; }
        public List<DishSalesItemDto> Dishes { get; set; } = new();
    }
}
namespace Application.Dtos.Sales
{
    public class HistoricalSalesSummaryDto
    {
        public int RestaurantId { get; set; }
        public DateTime From { get; set; }
        public DateTime To { get; set; }
        public decimal TotalRevenue { get; set; }
        public int TotalItemsSold { get; set; }
        public int WorkDaysCount { get; set; }
        public decimal AverageRevenuePerDay { get; set; }
        public List<DailySalesSummaryDto> DailyBreakdown { get; set; } = new();
        public List<DishSalesItemDto> TopDishes { get; set; } = new();
    }
}
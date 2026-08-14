using Application.Dtos.Sales;

namespace Application.Interfaces
{
    public interface ISalesService
    {
        Task<DailySalesSummaryDto?> GetDailySummaryAsync(int restaurantId, DateTime date);
        Task<HistoricalSalesSummaryDto> GetHistoricalSummaryAsync(int restaurantId, DateTime from, DateTime to);
    }
}
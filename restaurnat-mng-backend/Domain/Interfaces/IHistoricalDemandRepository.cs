using Domain.Entities;

namespace Domain.Interfaces
{
    public interface IHistoricalDemandRepository : IGenericRepository<HistoricalDemandEntry>
    {
        Task<List<HistoricalDemandEntry>> GetByRestaurantAndDateRangeAsync(int restaurantId, DateTime start, DateTime end);
        Task<List<HistoricalDemandEntry>> GetByRestaurantIdAsync(int restaurantId);
        Task<List<HistoricalDemandEntry>> AddRangeAsync(IEnumerable<HistoricalDemandEntry> entries);
    }
}
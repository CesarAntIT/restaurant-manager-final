using Domain.Entities;

namespace Domain.Interfaces
{
    public interface IWorkDayRepository : IGenericRepository<WorkDay>
    {
        Task<WorkDay?> GetActiveWorkDayAsync(int restaurantId);
        Task<List<WorkDay>> GetByRestaurantIdAsync(int restaurantId);
        Task<List<WorkDay>> GetByRestaurantAndDateRangeAsync(int restaurantId, DateTime from, DateTime to);
    }
}
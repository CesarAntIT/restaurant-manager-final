using Application.Dtos.Dish;
using Domain.Entities;

namespace Application.Interfaces
{
    public interface IWorkDayService
    {
        Task<bool> OpenWorkDayAsync(int restaurantId);
        Task<bool> CloseWorkDayAsync(int restaurantId);
        Task<bool> RegisterDishSaleAsync(int dishId, int quantity);
        Task<List<WorkDay>> GetWorkDayHistoryAsync(int restaurantId);
        Task<WorkDay?> GetActiveWorkDayAsync(int restaurantId);

    }
}
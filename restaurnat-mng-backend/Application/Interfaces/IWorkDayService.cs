using Application.Dtos.Dish;

namespace Application.Interfaces
{
    public interface IWorkDayService
    {

        Task<bool> OpenWorkDayAsync(int restaurantId);

        Task<bool> CloseWorkDayAsync(int restaurantId);

    }
}
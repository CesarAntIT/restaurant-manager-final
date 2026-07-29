using Application.Dtos.Dish;

namespace Application.Interfaces
{
    public interface IDishService
    {
        Task<DishDto?> GetByIdAsync(int id);
        Task<List<DishDto>> GetByRestaurantIdAsync(int restaurantId);
        Task<(DishDto? Dish, string? Error)> CreateAsync(int restaurantId, SaveDishDto dto);
        Task<(DishDto? Dish, string? Error)> UpdateAsync(int restaurantId, int id, UpdateDishDto dto);
        Task<bool> DeleteAsync(int restaurantId, int id);
    }
}
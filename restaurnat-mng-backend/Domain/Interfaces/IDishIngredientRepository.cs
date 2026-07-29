using Domain.Entities;

namespace Domain.Interfaces
{
    public interface IDishIngredientRepository : IGenericRepository<Dish>
    {
        Task<Dish?> GetByIdAsync(int id);
        Task<List<Dish>> GetByRestaurantIdAsync(int restaurantId);
        Task<Dish?> UpdateDishAsync(int id, Dish dish, List<DishIngredient> newIngredients);
        Task DeleteAsync(Dish dish);
    }
}
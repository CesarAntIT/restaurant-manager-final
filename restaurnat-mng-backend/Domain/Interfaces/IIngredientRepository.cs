using Domain.Entities;

namespace Domain.Interfaces
{
    public interface IIngredientRepository : IGenericRepository<Ingredient>
    {
        Task<Ingredient?> GetByIdAsync(int id);
        Task<List<Ingredient>> GetByRestaurantIdAsync(int restaurantId);
        Task<Ingredient?> UpdateIngredientAsync(int id, Ingredient ingredient);
        Task DeleteAsync(Ingredient ingredient);
    }
}
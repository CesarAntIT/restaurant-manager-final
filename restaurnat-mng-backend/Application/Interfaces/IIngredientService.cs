using Application.Dtos.Ingredient;

namespace Application.Interfaces
{
    public interface IIngredientService
    {
        Task<IngredientDto?> GetByIdAsync(int id);
        Task<List<IngredientDto>> GetByRestaurantIdAsync(int restaurantId);
        Task<IngredientDto?> CreateAsync(int restaurantId, SaveIngredientDto dto);
        Task<IngredientDto?> UpdateAsync(int restaurantId, int id, UpdateIngredientDto dto);
        Task<bool> DeleteAsync(int restaurantId, int id);
    }
}
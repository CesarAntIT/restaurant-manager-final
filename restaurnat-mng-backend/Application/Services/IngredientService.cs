using Application.Dtos.Ingredient;
using Application.Interfaces;
using Domain.Entities;
using Domain.Interfaces;

namespace Application.Services
{
    public class IngredientService : IIngredientService
    {
        private readonly IIngredientRepository ingredientRepository;
        private readonly IRestaurantRepository restaurantRepository;

        public IngredientService(IIngredientRepository ingredientRepository, IRestaurantRepository restaurantRepository)
        {
            this.ingredientRepository = ingredientRepository;
            this.restaurantRepository = restaurantRepository;
        }

        public async Task<IngredientDto?> GetByIdAsync(int id)
        {
            var ingredient = await ingredientRepository.GetByIdAsync(id);
            return ingredient == null ? null : MapToDto(ingredient);
        }

        public async Task<List<IngredientDto>> GetByRestaurantIdAsync(int restaurantId)
        {
            var ingredients = await ingredientRepository.GetByRestaurantIdAsync(restaurantId);
            return ingredients.Select(MapToDto).ToList();
        }

        public async Task<IngredientDto?> CreateAsync(int restaurantId, SaveIngredientDto dto)
        {
            var restaurant = await restaurantRepository.GetByIdAsync(restaurantId);
            if (restaurant == null) return null;

            var ingredient = new Ingredient
            {
                Id = 0,
                RestaurantId = restaurantId,
                Name = dto.Name,
                InitialQuantity = dto.InitialQuantity,
                Quantity = dto.InitialQuantity, // al crear, Quantity arranca igual a InitialQuantity
                StockMinimo = dto.StockMinimo,
                Cost = dto.Cost,
                WeightUnit = dto.WeightUnit
            };

            var created = await ingredientRepository.AddAsync(ingredient);
            return created == null ? null : MapToDto(created);
        }

        public async Task<IngredientDto?> UpdateAsync(int restaurantId, int id, UpdateIngredientDto dto)
        {
            var existing = await ingredientRepository.GetByIdAsync(id);
            if (existing == null || existing.RestaurantId != restaurantId) return null;

            var ingredient = new Ingredient
            {
                Id = existing.Id,
                RestaurantId = existing.RestaurantId,
                Name = dto.Name,
                InitialQuantity = existing.InitialQuantity,
                Quantity = dto.Quantity,
                StockMinimo = dto.StockMinimo,
                Cost = dto.Cost,
                WeightUnit = dto.WeightUnit
            };

            var updated = await ingredientRepository.UpdateIngredientAsync(id, ingredient);
            return updated == null ? null : MapToDto(updated);
        }

        public async Task<bool> DeleteAsync(int restaurantId, int id)
        {
            var existing = await ingredientRepository.GetByIdAsync(id);
            if (existing == null || existing.RestaurantId != restaurantId) return false;

            await ingredientRepository.DeleteAsync(existing);
            return true;
        }

        private static IngredientDto MapToDto(Ingredient i) => new()
        {
            Id = i.Id,
            RestaurantId = i.RestaurantId,
            Name = i.Name,
            InitialQuantity = i.InitialQuantity,
            Quantity = i.Quantity,
            StockMinimo = i.StockMinimo,
            Cost = i.Cost,
            WeightUnit = i.WeightUnit
        };
    }
}
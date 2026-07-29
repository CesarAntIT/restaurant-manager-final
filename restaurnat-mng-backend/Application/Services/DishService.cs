using Application.Dtos.Dish;
using Application.Interfaces;
using Domain.Entities;
using Domain.Interfaces;

namespace Application.Services
{
    public class DishService : IDishService
    {
        private readonly IDishIngredientRepository dishRepository;
        private readonly IRestaurantRepository restaurantRepository;
        private readonly IIngredientRepository ingredientRepository;

        public DishService(
            IDishIngredientRepository dishRepository,
            IRestaurantRepository restaurantRepository,
            IIngredientRepository ingredientRepository)
        {
            this.dishRepository = dishRepository;
            this.restaurantRepository = restaurantRepository;
            this.ingredientRepository = ingredientRepository;
        }

        public async Task<DishDto?> GetByIdAsync(int id)
        {
            var dish = await dishRepository.GetByIdAsync(id);
            return dish == null ? null : MapToDto(dish);
        }

        public async Task<List<DishDto>> GetByRestaurantIdAsync(int restaurantId)
        {
            var dishes = await dishRepository.GetByRestaurantIdAsync(restaurantId);
            return dishes.Select(MapToDto).ToList();
        }

        public async Task<(DishDto? Dish, string? Error)> CreateAsync(int restaurantId, SaveDishDto dto)
        {
            var restaurant = await restaurantRepository.GetByIdAsync(restaurantId);
            if (restaurant == null)
                return (null, "El restaurante no existe.");

            var validationError = await ValidateIngredientsAsync(restaurantId, dto.Ingredients);
            if (validationError != null)
                return (null, validationError);

            var dish = new Dish
            {
                Id = 0,
                RestaurantId = restaurantId,
                Name = dto.Name,
                Description = dto.Description ?? string.Empty,
                Price = dto.Price
            };

            foreach (var item in dto.Ingredients)
            {
                dish.DishIngredients.Add(new DishIngredient
                {
                    DishId = 0,
                    IngredientId = item.IngredientId,
                    QuantityNeeded = item.QuantityNeeded
                });
            }

            var created = await dishRepository.AddAsync(dish);
            if (created == null) return (null, "No se pudo crear el plato.");

            var full = await dishRepository.GetByIdAsync(created.Id);
            return (MapToDto(full!), null);
        }

        public async Task<(DishDto? Dish, string? Error)> UpdateAsync(int restaurantId, int id, UpdateDishDto dto)
        {
            var existing = await dishRepository.GetByIdAsync(id);
            if (existing == null || existing.RestaurantId != restaurantId)
                return (null, "El plato no existe.");

            var validationError = await ValidateIngredientsAsync(restaurantId, dto.Ingredients);
            if (validationError != null)
                return (null, validationError);

            var dish = new Dish
            {
                Id = existing.Id,
                RestaurantId = existing.RestaurantId,
                Name = dto.Name,
                Description = dto.Description ?? string.Empty,
                Price = dto.Price
            };

            var newIngredients = dto.Ingredients.Select(i => new DishIngredient
            {
                DishId = id,
                IngredientId = i.IngredientId,
                QuantityNeeded = i.QuantityNeeded
            }).ToList();

            var updated = await dishRepository.UpdateDishAsync(id, dish, newIngredients);
            return updated == null ? (null, "No se pudo actualizar el plato.") : (MapToDto(updated), null);
        }

        public async Task<bool> DeleteAsync(int restaurantId, int id)
        {
            var existing = await dishRepository.GetByIdAsync(id);
            if (existing == null || existing.RestaurantId != restaurantId) return false;

            await dishRepository.DeleteAsync(existing);
            return true;
        }

        private async Task<string?> ValidateIngredientsAsync(int restaurantId, List<SaveDishIngredientDto> ingredients)
        {
            foreach (var item in ingredients)
            {
                var ingredient = await ingredientRepository.GetByIdAsync(item.IngredientId);
                if (ingredient == null)
                    return $"El ingrediente con Id {item.IngredientId} no existe.";

                if (ingredient.RestaurantId != restaurantId)
                    return $"El ingrediente '{ingredient.Name}' no pertenece a este restaurante.";

                if (item.QuantityNeeded <= 0)
                    return $"La cantidad necesaria de '{ingredient.Name}' debe ser mayor a cero.";
            }

            return null;
        }

        private static DishDto MapToDto(Dish d) => new()
        {
            Id = d.Id,
            RestaurantId = d.RestaurantId,
            Name = d.Name,
            Description = d.Description,
            Price = d.Price,
            Ingredients = d.DishIngredients.Select(di => new DishIngredientDto
            {
                IngredientId = di.IngredientId,
                IngredientName = di.Ingredient?.Name ?? string.Empty,
                QuantityNeeded = di.QuantityNeeded,
                WeightUnit = di.Ingredient?.WeightUnit ?? string.Empty
            }).ToList()
        };
    }
}
using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class DishIngredientRepository : GenericRepository<Dish>, IDishIngredientRepository
    {
        public DishIngredientRepository(TableUpContextDB context) : base(context)
        {
        }

        public async Task<Dish?> GetByIdAsync(int id)
        {
            return await context.Dishes
                .Include(d => d.DishIngredients)
                    .ThenInclude(di => di.Ingredient)
                .FirstOrDefaultAsync(d => d.Id == id);
        }

        public async Task<List<Dish>> GetByRestaurantIdAsync(int restaurantId)
        {
            return await context.Dishes
                .Where(d => d.RestaurantId == restaurantId)
                .Include(d => d.DishIngredients)
                    .ThenInclude(di => di.Ingredient)
                .OrderBy(d => d.Name)
                .ToListAsync();
        }

        public async Task<Dish?> UpdateDishAsync(int id, Dish dish, List<DishIngredient> newIngredients)
        {
            var existing = await context.Dishes
                .Include(d => d.DishIngredients)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (existing == null) return null;

            existing.Name = dish.Name;
            existing.Description = dish.Description;
            existing.Price = dish.Price;

            context.DishIngredients.RemoveRange(existing.DishIngredients);
            foreach (var ingredient in newIngredients)
            {
                ingredient.DishId = id;
                await context.DishIngredients.AddAsync(ingredient);
            }

            await context.SaveChangesAsync();

            return await GetByIdAsync(id);
        }

        public async Task DeleteAsync(Dish dish)
        {
            context.Dishes.Remove(dish);
            await context.SaveChangesAsync();
        }
    }
}
using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class IngredientRepository : GenericRepository<Ingredient>, IIngredientRepository
    {
        public IngredientRepository(TableUpContextDB context) : base(context)
        {
        }

        public async Task<Ingredient?> GetByIdAsync(int id)
        {
            return await context.Ingredients
                .FirstOrDefaultAsync(i => i.Id == id);
        }

        public async Task<List<Ingredient>> GetByRestaurantIdAsync(int restaurantId)
        {
            return await context.Ingredients
                .Where(i => i.RestaurantId == restaurantId)
                .OrderBy(i => i.Name)
                .ToListAsync();
        }

        public async Task<Ingredient?> UpdateIngredientAsync(int id, Ingredient ingredient)
        {
            var existing = await context.Ingredients.FindAsync(id);
            if (existing == null) return null;

            existing.Name = ingredient.Name;
            existing.Quantity = ingredient.Quantity;
            existing.StockMinimo = ingredient.StockMinimo;
            existing.Cost = ingredient.Cost;
            existing.WeightUnit = ingredient.WeightUnit;

            await context.SaveChangesAsync();
            return existing;
        }

        public async Task DeleteAsync(Ingredient ingredient)
        {
            context.Ingredients.Remove(ingredient);
            await context.SaveChangesAsync();
        }
    }
}
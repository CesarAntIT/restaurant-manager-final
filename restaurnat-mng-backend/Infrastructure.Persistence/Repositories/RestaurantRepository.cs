using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class RestaurantRepository : GenericRepository<Restaurant>, IRestaurantRepository
    {
        public RestaurantRepository(TableUpContextDB context) : base(context)
        {
        }

        public async Task<Restaurant?> GetByIdAsync(int id)
        {
            return await context.Restaurants
                .Include(r => r.Tables)
                .Include(r => r.Menus)
                .Include(r => r.Ingredients)
                .Include(r => r.Reviews)
                .Include(r => r.WorkDays)
                .Include(r => r.RestaurantImages)
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<List<Restaurant>> GetAllAsync()
        {
            return await context.Restaurants
                .Include(r => r.Tables)
                .Include(r => r.Menus)
                .Include(r => r.Ingredients)
                .Include(r => r.Reviews)
                .Include(r => r.WorkDays)
                .Include(r => r.RestaurantImages)
                .ToListAsync();
        }

        public async Task<List<Restaurant>> GetByOwnerIdAsync(string ownerId)
        {
            return await context.Restaurants
                .Where(r => r.OwnerId == ownerId)
                .Include(r => r.Tables)
                .Include(r => r.Menus)
                .Include(r => r.Ingredients)
                .Include(r => r.Reviews)
                .Include(r => r.WorkDays)
                .Include(r => r.RestaurantImages)
                .ToListAsync();
        }

        public async Task<Restaurant?> UpdateRestaurantAsync(int id, Restaurant restaurant)
        {
            var existing = await context.Restaurants.FindAsync(id);
            if (existing == null) return null;

            existing.Name = restaurant.Name;
            existing.Category = restaurant.Category;
            existing.Address = restaurant.Address;
            existing.PhoneNumber = restaurant.PhoneNumber;
            existing.Status = restaurant.Status;

            await context.SaveChangesAsync();
            return existing;
        }
        public async Task DeleteAsync(Restaurant restaurant)
        {
            context.Restaurants.Remove(restaurant);
            await context.SaveChangesAsync();
        }
    }
}
using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class MenuRepository : GenericRepository<Menu>, IMenuRepository
    {
        public MenuRepository(TableUpContextDB context) : base(context) { }

        public async Task<List<Menu>> GetByRestaurantIdAsync(int restaurantId)
        {
            return await context.Set<Menu>()
                .AsNoTracking()
                .Where(m => m.RestaurantId == restaurantId)
                .ToListAsync();
        }

        public async Task<bool> ExistsByNameAsync(int restaurantId, string name)
        {
            return await context.Set<Menu>()
                .AnyAsync(m =>
                    m.RestaurantId == restaurantId &&
                    m.Name.ToLower() == name.ToLower());
        }

    }
}
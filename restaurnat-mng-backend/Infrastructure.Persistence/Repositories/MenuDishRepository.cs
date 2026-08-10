using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;
namespace Infrastructure.Persistence.Repositories
{
    public class MenuDishRepository : IMenuDishRepository
    {
        private readonly TableUpContextDB context;

        public MenuDishRepository(TableUpContextDB context)
        {
            this.context = context;
        }

        public async Task<bool> AddAsync(MenuDish entity)
        {
            var exists = await context.MenuDishes
                .AnyAsync(md => md.MenuId == entity.MenuId && md.DishId == entity.DishId);

            if (exists) return false;

            context.MenuDishes.Add(entity);
            await context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveAsync(int menuId, int dishId)
        {
            var relation = await context.MenuDishes
                .FirstOrDefaultAsync(md => md.MenuId == menuId && md.DishId == dishId);

            if (relation == null) return false;

            context.MenuDishes.Remove(relation);
            await context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Dish>> GetDishesByMenuAsync(int menuId)
        {
            return await context.MenuDishes
                .Where(md => md.MenuId == menuId)
                .Include(md => md.Dish)
                .Select(md => md.Dish!)
                .ToListAsync();
        }

        public async Task<IEnumerable<Menu>> GetMenusByDishAsync(int dishId)
        {
            return await context.MenuDishes
                .Where(md => md.DishId == dishId)
                .Include(md => md.Menu)
                .Select(md => md.Menu!)
                .ToListAsync();
        }
    }
}

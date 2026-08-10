using Domain.Entities;

namespace Domain.Interfaces
{
    public interface IMenuDishRepository
    {
        Task<bool> AddAsync(MenuDish entity);
        Task<bool> RemoveAsync(int menuId, int dishId);
        Task<IEnumerable<Dish>> GetDishesByMenuAsync(int menuId);
        Task<IEnumerable<Menu>> GetMenusByDishAsync(int dishId);
    }
}

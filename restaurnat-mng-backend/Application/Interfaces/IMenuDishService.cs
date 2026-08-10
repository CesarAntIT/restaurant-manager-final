using Application.Dtos.Dish;

namespace Application.Interfaces
{
    public interface IMenuDishService
    {
        Task<bool> AddDishToMenuAsync(int menuId, int dishId);

        Task<bool> RemoveDishFromMenuAsync(int menuId, int dishId);
        Task<IEnumerable<DishDto>> GetDishesByMenuAsync(int menuId);
        Task<IEnumerable<MenuDto>> GetMenusByDishAsync(int dishId);
    }
}

using Application.Dtos.Dish;
using Application.Interfaces;
using Domain.Entities;
using Domain.Interfaces;

namespace Application.Services
{
    public class MenuDishService : IMenuDishService
    {
        private readonly IMenuDishRepository menuDishRepository;

        public MenuDishService(IMenuDishRepository menuDishRepository)
        {
            this.menuDishRepository = menuDishRepository;
        }

        public async Task<bool> AddDishToMenuAsync(int menuId, int dishId)
        {
            var relation = new MenuDish
            {
                MenuId = menuId,
                DishId = dishId
            };

            return await menuDishRepository.AddAsync(relation);
        }

        public async Task<bool> RemoveDishFromMenuAsync(int menuId, int dishId)
        {
            return await menuDishRepository.RemoveAsync(menuId, dishId);
        }

        public async Task<IEnumerable<DishDto>> GetDishesByMenuAsync(int menuId)
        {
            var dishes = await menuDishRepository.GetDishesByMenuAsync(menuId);

            return dishes.Select(d => new DishDto
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
                }).ToList()
            }).ToList();
        }

        public async Task<IEnumerable<MenuDto>> GetMenusByDishAsync(int dishId)
        {
            var menus = await menuDishRepository.GetMenusByDishAsync(dishId);

            return menus.Select(m => new MenuDto
            {
                Id = m.Id,
                RestaurantId = m.RestaurantId,
                Name = m.Name,
                Description = m.Description,
                Status = m.Status
            }).ToList();
        }
    }
}

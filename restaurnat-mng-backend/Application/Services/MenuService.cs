using Application.Dtos.Dish;
using Application.Interfaces;
using Domain.Common.Enums;
using Domain.Entities;
using Domain.Interfaces;

namespace Application.Services
{
    public class MenuService : IMenuService
    {
        private readonly IMenuRepository menuRepository;

        public MenuService(
            IMenuRepository menuRepository)
        {
            this.menuRepository = menuRepository;
        }

        public async Task<MenuDto?> CreateAsync(CreateMenuDto dto)
        {
            var exists = await menuRepository
                .ExistsByNameAsync(dto.RestaurantId, dto.Name);

            if (exists)
                return null;

            var menu = new Menu
            {
                Id = 0,
                RestaurantId = dto.RestaurantId,
                Name = dto.Name,
                Description = dto.Description,
                Status = MenuStatus.Active
            };

            var created = await menuRepository.AddAsync(menu);

            if (created == null)
                return null;

            return new MenuDto
            {
                Id = created.Id,
                RestaurantId = created.RestaurantId,
                Name = created.Name,
                Description = created.Description,
                Status = created.Status
            };
        }
        public async Task<MenuDto?> GetByIdAsync(int id)
        {
            var menu = await menuRepository.GetById(id);

            if (menu == null)
                return null;

            return new MenuDto
            {
                Id = menu.Id,
                RestaurantId = menu.RestaurantId,
                Name = menu.Name,
                Description = menu.Description,
                Status = menu.Status
            };
        }

        public async Task<List<MenuDto>> GetByRestaurantIdAsync(int restaurantId)
        {
            var menus = await menuRepository.GetByRestaurantIdAsync(restaurantId);

            return menus.Select(m => new MenuDto
            {
                Id = m.Id,
                RestaurantId = m.RestaurantId,
                Name = m.Name,
                Description = m.Description,
                Status = m.Status
            }).ToList();
        }

        public async Task<MenuDto?> UpdateAsync(int id, UpdateMenuDto dto)
        {
            var menu = await menuRepository.GetById(id);

            if (menu == null)
                return null;

            menu.Name = dto.Name;
            menu.Description = dto.Description;
            menu.Status = dto.Status;

            var updated = await menuRepository.UpdateAsync(id, menu);

            if (updated == null)
                return null;

            return new MenuDto
            {
                Id = updated.Id,
                RestaurantId = updated.RestaurantId,
                Name = updated.Name,
                Description = updated.Description,
                Status = updated.Status
            };
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var menu = await menuRepository.GetById(id);

            if (menu == null)
                return false;

            await menuRepository.DeleteAsync(id);

            return true;
        }


    }
}
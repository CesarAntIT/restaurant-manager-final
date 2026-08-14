public interface IMenuService
{
    Task<MenuDto?> CreateAsync(CreateMenuDto dto);

    Task<MenuDto?> GetByIdAsync(int id);

    Task<List<MenuDto>> GetByRestaurantIdAsync(int restaurantId);

    Task<MenuDto?> UpdateAsync(int id, UpdateMenuDto dto);

    Task<bool> DeleteAsync(int id);
}   
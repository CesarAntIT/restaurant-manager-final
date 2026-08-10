using Domain.Entities;

namespace Domain.Interfaces
{
    public interface IMenuRepository : IGenericRepository<Menu>
    {
        Task<List<Menu>> GetByRestaurantIdAsync(int restaurantId);
        Task<bool> ExistsByNameAsync(int restaurantId, string name);
    }
}

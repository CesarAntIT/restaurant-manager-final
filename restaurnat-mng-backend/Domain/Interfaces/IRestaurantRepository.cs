using Domain.Entities;

namespace Domain.Interfaces
{
    public interface IRestaurantRepository : IGenericRepository<Restaurant>
    {
        Task<Restaurant?> GetByIdAsync(int id);
        Task<List<Restaurant>> GetAllAsync();
        Task<List<Restaurant>> GetByOwnerIdAsync(string ownerId);
        Task<Restaurant?> UpdateRestaurantAsync(int id, Restaurant restaurant);
        Task DeleteAsync(Restaurant restaurant);
    }
}
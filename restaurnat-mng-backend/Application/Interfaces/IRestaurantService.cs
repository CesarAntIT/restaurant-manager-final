using Application.Dtos.Restaurant;

namespace Application.Interfaces
{
    public interface IRestaurantService
    {
        Task<RestaurantDto?> GetByIdAsync(int id);
        Task<List<RestaurantDto>> GetAllAsync();
        Task<List<RestaurantDto>> GetByOwnerIdAsync(string ownerId);
        Task<RestaurantDto?> CreateAsync(SaveRestaurantDto dto);
        Task<RestaurantDto?> UpdateAsync(int id, UpdateRestaurantDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
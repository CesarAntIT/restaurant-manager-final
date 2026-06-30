using Application.Dtos.Restaurant;
using Domain.Common.Enums;

namespace Application.Interfaces
{
    public interface IRestaurantService
    {
        Task<RestaurantDto?> GetByIdAsync(int id);
        Task<List<RestaurantDto>> GetAllAsync();
        Task<List<RestaurantDto>> GetByOwnerIdAsync(string ownerId);
        Task<RestaurantDto?> CreateAsync(SaveRestaurantDto dto);
        Task<RestaurantDto?> UpdateAsync(int id, UpdateRestaurantDto dto);
        Task<bool> ChangeStatus (int id, RestaurantStatus status);
        Task<bool> DeleteAsync(int id);
    }
}
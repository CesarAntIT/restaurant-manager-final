using Application.Dtos.Restaurant;
using Application.Interfaces;
using Domain.Entities;
using Domain.Interfaces;

namespace Application.Services
{
    public class RestaurantService : IRestaurantService
    {
        private readonly IRestaurantRepository restaurantRepository;

        public RestaurantService(IRestaurantRepository restaurantRepository)
        {
            this.restaurantRepository = restaurantRepository;
        }

        public async Task<RestaurantDto?> GetByIdAsync(int id)
        {
            var restaurant = await restaurantRepository.GetByIdAsync(id);
            if (restaurant == null) return null;
            return MapToDto(restaurant);
        }

        public async Task<List<RestaurantDto>> GetAllAsync()
        {
            var restaurants = await restaurantRepository.GetAllAsync();
            return restaurants.Select(MapToDto).ToList();
        }

        public async Task<List<RestaurantDto>> GetByOwnerIdAsync(string ownerId)
        {
            var restaurants = await restaurantRepository.GetByOwnerIdAsync(ownerId);
            return restaurants.Select(MapToDto).ToList();
        }

        public async Task<RestaurantDto?> CreateAsync(SaveRestaurantDto dto)
        {
            var restaurant = new Restaurant
            {
                Id = 0,
                OwnerId = dto.OwnerId,
                Name = dto.Name,
                Category = dto.Category,
                Address = dto.Address,
                PhoneNumber = dto.PhoneNumber
            };

            var created = await restaurantRepository.AddAsync(restaurant);
            if (created == null) return null;
            return MapToDto(created);
        }

        public async Task<RestaurantDto?> UpdateAsync(int id, UpdateRestaurantDto dto)
        {
            var existing = await restaurantRepository.GetByIdAsync(id);
            if (existing == null) return null;

            existing.Name = dto.Name;
            existing.Category = dto.Category;
            existing.Address = dto.Address;
            existing.PhoneNumber = dto.PhoneNumber;
            existing.Status = dto.Status;

            var updated = await restaurantRepository.UpdateRestaurantAsync(id, existing);
            if (updated == null) return null;
            return MapToDto(updated);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var existing = await restaurantRepository.GetByIdAsync(id);
            if (existing == null) return false;

            await restaurantRepository.DeleteAsync(existing);
            return true;
        }

        private static RestaurantDto MapToDto(Restaurant r) => new()
        {
            Id = r.Id,
            OwnerId = r.OwnerId,
            Name = r.Name,
            Category = r.Category,
            Status = r.Status,
            Address = r.Address,
            PhoneNumber = r.PhoneNumber,
            CreatedAt = r.CreatedAt
        };
    }
}
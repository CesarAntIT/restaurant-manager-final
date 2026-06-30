using Application.Dtos.Restaurant;
using Application.Interfaces;
using Domain.Common.Enums;
using Domain.Entities;
using Domain.Interfaces;

namespace Application.Services
{
    public class RestaurantService : IRestaurantService
    {
        private readonly IRestaurantRepository restaurantRepository;
        private readonly IImageService imageService;

        public RestaurantService(IRestaurantRepository restaurantRepository, IImageService imageService)
        {
            this.restaurantRepository = restaurantRepository;
            this.imageService = imageService;
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
                PhoneNumber = dto.PhoneNumber,
                Status = RestaurantStatus.Pending

            };

            foreach (var file in dto.Images)
            {
                var url = await imageService.UploadAsync(file);

                restaurant.RestaurantImages.Add(new RestaurantImage
                {

                    Url = url
                });
            }

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

            if (dto.Images.Any())
            {
                foreach (var image in existing.RestaurantImages)
                {
                    await imageService.DeleteAsync(image.Url);
                }

                existing.RestaurantImages.Clear();

                foreach (var file in dto.Images)
                {
                    var url = await imageService.UploadAsync(file);

                    existing.RestaurantImages.Add(new RestaurantImage
                    {
                        Url = url
                    });
                }
            }

            var updated = await restaurantRepository.UpdateRestaurantAsync(id, existing);
            if (updated == null) return null;
            return MapToDto(updated);
        }

        public async Task<bool> ChangeStatus(int id, RestaurantStatus status)
        {
            var exists = await restaurantRepository.GetByIdAsync(id);
            if (exists == null) return false;

            exists.Status = status;
            var updated = await restaurantRepository.UpdateRestaurantAsync(id, exists);

            if (updated == null) return false;
            return true;

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
            CreatedAt = r.CreatedAt,
            Images = r.RestaurantImages
            .Select(i => i.Url)
            .ToList()

        };
    }
}
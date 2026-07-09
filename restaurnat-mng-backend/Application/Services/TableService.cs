using Application.Dtos.Table;
using Application.Interfaces;
using Domain.Common.Enums;
using Domain.Entities;
using Domain.Interfaces;

namespace Application.Services
{
    public class TableService : ITableService
    {
        private readonly ITableRepository tableRepository;
        private readonly IRestaurantRepository restaurantRepository;

        public TableService(ITableRepository tableRepository, IRestaurantRepository restaurantRepository)
        {
            this.tableRepository = tableRepository;
            this.restaurantRepository = restaurantRepository;
        }

        public async Task<TableDto?> GetByIdAsync(int id)
        {
            var table = await tableRepository.GetByIdAsync(id);
            return table == null ? null : MapToDto(table);
        }

        public async Task<List<TableDto>> GetByRestaurantIdAsync(int restaurantId)
        {
            var tables = await tableRepository.GetByRestaurantIdAsync(restaurantId);
            return tables.Select(MapToDto).ToList();
        }

        public async Task<TableDto?> CreateAsync(int restaurantId, SaveTableDto dto)
        {
            var restaurant = await restaurantRepository.GetByIdAsync(restaurantId);
            if (restaurant == null) return null; // restaurante no existe

            var table = new Table
            {
                Id = 0,
                RestaurantId = restaurantId,
                NumberMesa = dto.NumberMesa,
                Seats = dto.Seats,
                Status = TableStatus.Available
            };

            var created = await tableRepository.AddAsync(table);
            return created == null ? null : MapToDto(created);
        }

        public async Task<TableDto?> UpdateAsync(int restaurantId, int id, UpdateTableDto dto)
        {
            var existing = await tableRepository.GetByIdAsync(id);
            if (existing == null || existing.RestaurantId != restaurantId) return null;

            var table = new Table
            {
                Id = existing.Id,
                RestaurantId = existing.RestaurantId,
                NumberMesa = dto.NumberMesa,
                Seats = dto.Seats,
                Status = dto.Status
            };

            var updated = await tableRepository.UpdateTableAsync(id, table);
            return updated == null ? null : MapToDto(updated);
        }

        public async Task<bool> DeleteAsync(int restaurantId, int id)
        {
            var existing = await tableRepository.GetByIdAsync(id);
            if (existing == null || existing.RestaurantId != restaurantId) return false;

            await tableRepository.DeleteAsync(existing);
            return true;
        }

        private static TableDto MapToDto(Table t) => new()
        {
            Id = t.Id,
            RestaurantId = t.RestaurantId,
            NumberMesa = t.NumberMesa,
            Seats = t.Seats,
            Status = t.Status
        };
    }
}
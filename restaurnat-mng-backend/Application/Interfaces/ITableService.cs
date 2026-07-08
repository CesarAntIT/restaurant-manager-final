using Application.Dtos.Table;

namespace Application.Interfaces
{
    public interface ITableService
    {
        Task<TableDto?> GetByIdAsync(int id);
        Task<List<TableDto>> GetByRestaurantIdAsync(int restaurantId);
        Task<TableDto?> CreateAsync(int restaurantId, SaveTableDto dto);
        Task<TableDto?> UpdateAsync(int restaurantId, int id, UpdateTableDto dto);
        Task<bool> DeleteAsync(int restaurantId, int id);
    }
}
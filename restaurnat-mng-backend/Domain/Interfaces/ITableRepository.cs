using Domain.Entities;

namespace Domain.Interfaces
{
    public interface ITableRepository : IGenericRepository<Table>
    {
        Task<Table?> GetByIdAsync(int id);
        Task<List<Table>> GetByRestaurantIdAsync(int restaurantId);
        Task<Table?> UpdateTableAsync(int id, Table table);
        Task DeleteAsync(Table table);
    }
}
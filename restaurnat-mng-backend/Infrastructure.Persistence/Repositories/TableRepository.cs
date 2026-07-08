using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class TableRepository : GenericRepository<Table>, ITableRepository
    {
        public TableRepository(TableUpContextDB context) : base(context)
        {
        }

        public async Task<Table?> GetByIdAsync(int id)
        {
            return await context.Tables
                .Include(t => t.Restaurant)
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<List<Table>> GetByRestaurantIdAsync(int restaurantId)
        {
            return await context.Tables
                .Where(t => t.RestaurantId == restaurantId)
                .ToListAsync();
        }

        public async Task<Table?> UpdateTableAsync(int id, Table table)
        {
            var existing = await context.Tables.FindAsync(id);
            if (existing == null) return null;

            existing.NumberMesa = table.NumberMesa;
            existing.Seats = table.Seats;
            existing.Status = table.Status;

            await context.SaveChangesAsync();
            return existing;
        }

        public async Task DeleteAsync(Table table)
        {
            context.Tables.Remove(table);
            await context.SaveChangesAsync();
        }
    }
}
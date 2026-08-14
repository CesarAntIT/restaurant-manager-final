using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class HistoricalDemandRepository : GenericRepository<HistoricalDemandEntry>, IHistoricalDemandRepository
    {
        public HistoricalDemandRepository(TableUpContextDB context) : base(context)
        {
        }

        public async Task<List<HistoricalDemandEntry>> GetByRestaurantAndDateRangeAsync(int restaurantId, DateTime start, DateTime end)
        {
            return await context.HistoricalDemandEntries
                .Where(h => h.RestaurantId == restaurantId && h.Date >= start && h.Date < end)
                .OrderBy(h => h.Date)
                .ToListAsync();
        }

        public async Task<List<HistoricalDemandEntry>> GetByRestaurantIdAsync(int restaurantId)
        {
            return await context.HistoricalDemandEntries
                .Where(h => h.RestaurantId == restaurantId)
                .OrderByDescending(h => h.Date)
                .ToListAsync();
        }

        public async Task<List<HistoricalDemandEntry>> AddRangeAsync(IEnumerable<HistoricalDemandEntry> entries)
        {
            var list = entries.ToList();
            await context.HistoricalDemandEntries.AddRangeAsync(list);
            await context.SaveChangesAsync();
            return list;
        }
    }
}
using Domain.Common.Enums;
using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class WorkDayRepository : GenericRepository<WorkDay>, IWorkDayRepository
    {
        public WorkDayRepository(TableUpContextDB context) : base(context)
        {
        }

        public async Task<WorkDay?> GetActiveWorkDayAsync(int restaurantId)
        {
            return await context.Set<WorkDay>()
                .FirstOrDefaultAsync(w =>
                    w.RestaurantId == restaurantId &&
                    w.Status == WorkDayStatus.Open);
        }

        public async Task<List<WorkDay>> GetByRestaurantIdAsync(int restaurantId)
        {
            return await context.Set<WorkDay>()
                .Where(w => w.RestaurantId == restaurantId)
                .OrderByDescending(w => w.TimeOpen)
                .ToListAsync();
        }
    }
}
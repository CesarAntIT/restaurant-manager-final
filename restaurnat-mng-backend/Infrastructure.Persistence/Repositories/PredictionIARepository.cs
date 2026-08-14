using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class PredictionIARepository : GenericRepository<PredictionIA>, IPredictionIARepository
    {
        public PredictionIARepository(TableUpContextDB context) : base(context)
        {
        }

        public async Task<List<PredictionIA>> GetByRestaurantIdAsync(int restaurantId)
        {
            return await context.PredictionsIA
                .Where(p => p.RestaurantId == restaurantId)
                .OrderByDescending(p => p.PredictionDate)
                .ToListAsync();
        }
    }
}
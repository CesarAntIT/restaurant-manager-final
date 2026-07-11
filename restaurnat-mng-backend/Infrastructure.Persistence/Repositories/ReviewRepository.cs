using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class ReviewRepository : GenericRepository<Review>, IReviewRepository
    {
        public ReviewRepository(TableUpContextDB context) : base(context)
        {
        }

        public async Task<List<Review>> GetByUserIdAsync(string userId)
        {
            return await context.Set<Review>()
                .Where(r => r.UserId == userId)
                .ToListAsync();
        }

        public async Task<List<Review>> GetByUserIdWithRestaurantAsync(string userId)
        {
            // Usamos AsNoTracking para que la consulta sea limpia, rápida y no de errores de seguimiento
            return await context.Set<Review>()
                .AsNoTracking()
                .Include(r => r.Restaurant)
                .Where(r => r.UserId == userId)
                .ToListAsync();
        }
    }
}
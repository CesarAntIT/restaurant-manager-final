using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence.Contexts;

namespace Infrastructure.Persistence.Repositories
{
    public class ReviewRepository : GenericRepository<Review>, IReviewRepository
    {
        public ReviewRepository(TableUpContextDB context) : base(context)
        {
        }
    }
}
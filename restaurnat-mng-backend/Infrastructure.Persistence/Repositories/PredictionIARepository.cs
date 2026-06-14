using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence.Contexts;

namespace Infrastructure.Persistence.Repositories
{
    public class PredictionIARepository : GenericRepository<PredictionIA>, IPredictionIARepository
    {
        public PredictionIARepository(TableUpContextDB context) : base(context)
        {
        }
    }
}
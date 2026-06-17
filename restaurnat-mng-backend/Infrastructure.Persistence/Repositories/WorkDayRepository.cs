using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence.Contexts;

namespace Infrastructure.Persistence.Repositories
{
    public class WorkDayRepository : GenericRepository<WorkDay>, IWorkDayRepository
    {
        public WorkDayRepository(TableUpContextDB context) : base(context)
        {
        }
    }
}
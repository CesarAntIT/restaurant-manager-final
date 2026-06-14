using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence.Contexts;

namespace Infrastructure.Persistence.Repositories
{
    public class WorkDayItemRepository : GenericRepository<WorkDayItem>, IWorkDayItemRepository
    {
        public WorkDayItemRepository(TableUpContextDB context) : base(context)
        {
        }
    }
}
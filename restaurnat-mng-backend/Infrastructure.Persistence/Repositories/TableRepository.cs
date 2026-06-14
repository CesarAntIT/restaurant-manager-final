using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence.Contexts;

namespace Infrastructure.Persistence.Repositories
{
    public class TableRepository : GenericRepository<Table>, ITableRepository
    {
        public TableRepository(TableUpContextDB context) : base(context)
        {
        }
    }
}
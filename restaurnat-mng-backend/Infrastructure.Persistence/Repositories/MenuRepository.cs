using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence.Contexts;

namespace Infrastructure.Persistence.Repositories
{
    public class MenuRepository : GenericRepository<Menu>, IMenuRepository
    {
        public MenuRepository(TableUpContextDB context) : base(context) { }

    }
}
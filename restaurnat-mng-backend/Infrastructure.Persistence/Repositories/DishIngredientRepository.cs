using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class DishIngredientRepository : GenericRepository<DishIngredient>, IDishIngredientRepository
    {
        public DishIngredientRepository(TableUpContextDB context) : base(context)
        {
        }
    }
}
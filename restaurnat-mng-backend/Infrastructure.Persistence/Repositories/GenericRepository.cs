using Domain.Interfaces;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class GenericRepository<Entity> : IGenericRepository<Entity>
        where Entity : class        
    {
        protected readonly TableUpContextDB context;

        public GenericRepository(TableUpContextDB context)
        {
            this.context = context;
        }
        public virtual async Task<Entity?> AddAsync(Entity entity)
        {
            await context.Set<Entity>().AddAsync(entity);
            await context.SaveChangesAsync();
            return entity;
        }

        public virtual async Task<int> AddRangeAsync(IEnumerable<Entity> entities)
        {
            await context.Set<Entity>().AddRangeAsync(entities);
            return await context.SaveChangesAsync();
        }

        public virtual async Task<Entity?> UpdateAsync(int id, Entity entity)
        {
            context.Set<Entity>().Update(entity);
            await context.SaveChangesAsync();
            return entity;
        }
        public virtual async Task<int> UpdateRangeAsync(IEnumerable<Entity> entities)
        {
            context.Set<Entity>().UpdateRange(entities);
            return await context.SaveChangesAsync();
        }
        public virtual async Task DeleteAsync(int id)
        {
            var entity = await context.Set<Entity>().FindAsync(id);
            if (entity != null)
            {
                context.Set<Entity>().Remove(entity);
                await context.SaveChangesAsync();
            }
        }
        public virtual async Task<List<Entity>> GetAllList()
        {
            return await context.Set<Entity>().ToListAsync();
        }

        public virtual async Task<List<Entity>> GetAllListWithInclude(List<string> properties)
        {
            var query = context.Set<Entity>().AsQueryable();

            foreach(var property in properties)
            {
                query = query.Include(property);
            }

            return await query.ToListAsync(); 
        }    
        public virtual async Task<Entity?> GetById(int id)
        {
            return await context.Set<Entity>().FindAsync(id);
        }
        public virtual IQueryable<Entity> GetAllQuery()
        {
            return context.Set<Entity>().AsQueryable();
        }
        public virtual IQueryable<Entity> GetAllQueryWithInclude(List<string> properties)
        {
            var query = context.Set<Entity>().AsQueryable();

            foreach (var property in properties)
            {
                query = query.Include(property);
            }

            return query; 
        }
    }
}
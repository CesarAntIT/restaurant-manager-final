using Domain.Entities;

namespace Domain.Interfaces
{
    public interface IReviewRepository : IGenericRepository<Review>
    {
        // Obtener las reseñas hechas por un usuario especifico
        Task<List<Review>> GetByUserIdAsync(string userId);

        // Obtener las reseñas hechas por un usuario incluyendo los datos del restaurante
        Task<List<Review>> GetByUserIdWithRestaurantAsync(string userId);
    }
}
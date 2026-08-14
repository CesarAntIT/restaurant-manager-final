using Domain.Entities;

namespace Domain.Interfaces
{
    public interface IPredictionIARepository : IGenericRepository<PredictionIA>
    {
        Task<List<PredictionIA>> GetByRestaurantIdAsync(int restaurantId);
    }
}
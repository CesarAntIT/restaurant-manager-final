
using Application.Dtos.Review;

namespace Application.Interfaces
{
    public interface IReviewService
    {
        // Crear reseña
        Task<bool> AddAsync(CreateReviewDto dto, string userId);

        // Ver historial del cliente
        Task<List<ReviewHistoryDto>> GetClientHistoryAsync(string userId);

        // Eliminar reseña (Validando propiedad)
        Task<bool> DeleteReviewByClientAsync(int id, string userId);

        Task<RestaurantReviewsDto?> GetReviewsByRestaurantAsync(int restaurantId);
    }
}

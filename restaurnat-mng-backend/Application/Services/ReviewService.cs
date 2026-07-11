using Application.Dtos.Review;
using Application.Interfaces;
using Domain.Entities;
using Domain.Interfaces;


namespace Application.Services
{

    public class ReviewService : IReviewService
    {
        private readonly IReviewRepository _reviewRepository;

        public ReviewService(IReviewRepository reviewRepository)
        {
            _reviewRepository = reviewRepository;
        }

        public async Task<bool> AddAsync(CreateReviewDto dto, string userId)
        {
            var review = new Review
            {
                Id= 0, 
                UserId = userId,
                RestaurantId = dto.RestaurantId,
                Rating = dto.Rating,
                Comment = dto.Comment,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _reviewRepository.AddAsync(review);
            return result != null;
        }

        public async Task<List<ReviewHistoryDto>> GetClientHistoryAsync(string userId)
        {
            var reviews = await _reviewRepository.GetByUserIdWithRestaurantAsync(userId);

            return reviews.Select(r => new ReviewHistoryDto
            {
                Id = r.Id,
                RestaurantId = r.RestaurantId,
                RestaurantName = r.Restaurant?.Name ?? "Restaurante no encontrado",
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            }).ToList();
        }

        public async Task<bool> DeleteReviewByClientAsync(int id, string userId)
        {
            var review = await _reviewRepository.GetById(id);

            // Verificación de seguridad: Validar que exista y pertenezca al cliente actual
            if (review == null || review.UserId != userId)
            {
                return false;
            }

            await _reviewRepository.DeleteAsync(id);
            return true;
        }
    }

}

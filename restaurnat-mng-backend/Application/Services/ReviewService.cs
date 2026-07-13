using Application.Dtos.Review;
using Application.Interfaces;
using Domain.Entities;
using Domain.Interfaces;


namespace Application.Services
{

    public class ReviewService : IReviewService
    {
        private readonly IReviewRepository _reviewRepository;
        private readonly IUserAccountServiceForWebApi _userAccountService;

        public ReviewService(IReviewRepository reviewRepository, IUserAccountServiceForWebApi userAccountService)
        {
            _reviewRepository = reviewRepository;
            _userAccountService = userAccountService;
        }

        public async Task<bool> AddAsync(CreateReviewDto dto, string userId)
        {
            var review = new Review
            {
                Id = 0,
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

        public async Task<RestaurantReviewsDto?> GetReviewsByRestaurantAsync(int restaurantId)
        {
            var reviews = await _reviewRepository
                .GetByRestaurantIdWithRestaurantAsync(restaurantId);

            if (!reviews.Any())
                return null;

            var reviewItems = new List<ReviewItemDto>();

            foreach (var review in reviews)
            {
                var user = await _userAccountService.GetUserById(review.UserId);

                reviewItems.Add(new ReviewItemDto
                {
                    UserName = user?.Name ?? "Usuario desconocido",
                    Rating = review.Rating,
                    Comment = review.Comment,
                    CreatedAt = review.CreatedAt
                });
            }

            return new RestaurantReviewsDto
            {
                RestaurantId = restaurantId,
                RestaurantName = reviews.First().Restaurant?.Name ?? string.Empty,
                AverageRating = Math.Round((decimal)reviews.Average(x => x.Rating), 1),
                TotalReviews = reviews.Count,
                Reviews = reviewItems
            };
        }
    }

}

using Application.Dtos.Reservation;

namespace Application.Interfaces
{
    public interface IReservationService
    {
        Task<ReservationDto?> GetByIdAsync(int id);
        Task<List<ReservationDto>> GetByUserIdAsync(string userId);
        Task<List<ReservationDto>> GetByRestaurantIdAsync(int restaurantId);
        Task<(ReservationDto? Reservation, string? Error)> CreateAsync(string userId, CreateReservationDto dto);
        Task<(bool Success, string? Error)> CancelAsync(int id, string userId);
    }
}
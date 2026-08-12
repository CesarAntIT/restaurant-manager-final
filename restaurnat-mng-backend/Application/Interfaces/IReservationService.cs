using Application.Dtos.Reservation;

namespace Application.Interfaces
{
    public interface IReservationService
    {
        Task<ReservationDto?> GetByIdAsync(int id);
        Task<List<ReservationDto>> GetByUserIdAsync(string userId);
        Task<List<ReservationDto>> GetByRestaurantIdAsync(int restaurantId);
        Task<List<ReservationDto>> GetActiveReservationsAsync();
        Task<List<ReservationDto>> GetConfirmedHistoryAsync(int? restaurantId, DateTime? from, DateTime? to);
        Task<List<ReservationDto>> GetCancelledHistoryAsync(int? restaurantId, DateTime? from, DateTime? to);
        Task<List<PeakHourDto>> GetPeakHoursAsync(int? restaurantId, DateTime? from, DateTime? to, int top = 5);
        Task<ReservationHistoryDto> GetHistoryAsync(int? restaurantId, DateTime? from, DateTime? to, int topPeakHours = 5);
        Task<(ReservationDto? Reservation, string? Error)> CreateAsync(string userId, CreateReservationDto dto);
        Task<(bool Success, string? Error)> CancelAsync(int id, string userId);
    }
}

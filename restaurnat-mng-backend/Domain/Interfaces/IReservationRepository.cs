using Domain.Entities;

namespace Domain.Interfaces
{
    public interface IReservationRepository : IGenericRepository<Reservation>
    {
        Task<Reservation?> GetByIdAsync(int id);
        Task<List<Reservation>> GetByUserIdAsync(string userId);
        Task<List<Reservation>> GetByRestaurantIdAsync(int restaurantId);
        Task<List<Reservation>> GetByTableIdAsync(int tableId, DateTime from, DateTime to);
        Task<List<Reservation>> GetActiveReservationsAsync();
        Task<Reservation?> UpdateStatusAsync(int id, Domain.Common.Enums.ReservationStatus status);
    }
}
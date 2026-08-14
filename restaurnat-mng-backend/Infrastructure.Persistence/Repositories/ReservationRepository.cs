using Domain.Common.Enums;
using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class ReservationRepository : GenericRepository<Reservation>, IReservationRepository
    {
        public ReservationRepository(TableUpContextDB context) : base(context)
        {
        }

        public async Task<Reservation?> GetByIdAsync(int id)
        {
            return await context.Reservations
                .Include(r => r.Table)
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<List<Reservation>> GetByUserIdAsync(string userId)
        {
            return await context.Reservations
                .Include(r => r.Table)
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.DateTimeReservation)
                .ToListAsync();
        }

        public async Task<List<Reservation>> GetByRestaurantIdAsync(int restaurantId)
        {
            return await context.Reservations
                .Include(r => r.Table)
                .Where(r => r.Table != null && r.Table.RestaurantId == restaurantId)
                .OrderByDescending(r => r.DateTimeReservation)
                .ToListAsync();
        }

        public async Task<List<Reservation>> GetByTableIdAsync(int tableId, DateTime from, DateTime to)
        {
            return await context.Reservations
                .Where(r => r.TableId == tableId
                    && r.Status != ReservationStatus.Cancelled
                    && r.DateTimeReservation >= from
                    && r.DateTimeReservation <= to)
                .ToListAsync();
        }
        public async Task<List<Reservation>> GetActiveReservationsAsync()
        {
            return await context.Reservations
                .Include(r => r.Table)
                .Where(r => r.Status == ReservationStatus.Confirmed)
                .OrderBy(r => r.DateTimeReservation)
                .ToListAsync();
        }

        public async Task<List<Reservation>> GetHistoryAsync(
            IReadOnlyCollection<ReservationStatus> statuses,
            int? restaurantId,
            DateTime? from,
            DateTime? to)
        {
            var query = context.Reservations
                .Include(r => r.Table)
                .AsQueryable();

            if (statuses.Any())
                query = query.Where(r => statuses.Contains(r.Status));

            if (restaurantId.HasValue)
                query = query.Where(r => r.Table != null && r.Table.RestaurantId == restaurantId.Value);

            if (from.HasValue)
                query = query.Where(r => r.DateTimeReservation >= from.Value);

            if (to.HasValue)
                query = query.Where(r => r.DateTimeReservation <= to.Value);

            return await query
                .OrderByDescending(r => r.DateTimeReservation)
                .ToListAsync();
        }

        public async Task<Reservation?> UpdateStatusAsync(int id, ReservationStatus status)
        {
            var existing = await context.Reservations.FindAsync(id);
            if (existing == null) return null;

            existing.Status = status;
            await context.SaveChangesAsync();
            return existing;
        }
    }
}

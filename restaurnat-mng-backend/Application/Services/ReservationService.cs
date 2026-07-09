using Application.Dtos.Reservation;
using Application.Interfaces;
using Domain.Common.Enums;
using Domain.Entities;
using Domain.Interfaces;

namespace Application.Services
{
    public class ReservationService : IReservationService
    {
        private readonly IReservationRepository reservationRepository;
        private readonly ITableRepository tableRepository;

        public ReservationService(IReservationRepository reservationRepository, ITableRepository tableRepository)
        {
            this.reservationRepository = reservationRepository;
            this.tableRepository = tableRepository;
        }

        public async Task<ReservationDto?> GetByIdAsync(int id)
        {
            var reservation = await reservationRepository.GetByIdAsync(id);
            return reservation == null ? null : MapToDto(reservation);
        }

        public async Task<List<ReservationDto>> GetByUserIdAsync(string userId)
        {
            var reservations = await reservationRepository.GetByUserIdAsync(userId);
            return reservations.Select(MapToDto).ToList();
        }

        public async Task<List<ReservationDto>> GetByRestaurantIdAsync(int restaurantId)
        {
            var reservations = await reservationRepository.GetByRestaurantIdAsync(restaurantId);
            return reservations.Select(MapToDto).ToList();
        }
        public async Task<(ReservationDto? Reservation, string? Error)> CreateAsync(string userId, CreateReservationDto dto)
        {
            var table = await tableRepository.GetByIdAsync(dto.TableId);
            if (table == null)
                return (null, "La mesa no existe.");

            if (table.Status == TableStatus.Maintenance)
                return (null, "La mesa no está disponible (mantenimiento).");

            if (dto.PeopleCount > table.Seats)
                return (null, "La cantidad de personas excede la capacidad de la mesa.");

            var reservationDateUtc = DateTime.SpecifyKind(dto.DateTimeReservation, DateTimeKind.Utc);

            if (reservationDateUtc <= DateTime.UtcNow)
                return (null, "La fecha de la reserva debe ser futura.");

            var windowStart = reservationDateUtc.AddHours(-2);
            var windowEnd = reservationDateUtc.AddHours(2);

            var overlapping = await reservationRepository.GetByTableIdAsync(dto.TableId, windowStart, windowEnd);
            if (overlapping.Any())
                return (null, "La mesa ya tiene una reserva en ese horario.");

            var reservation = new Reservation
            {
                Id = 0,
                UserId = userId,
                TableId = dto.TableId,
                DateTimeReservation = reservationDateUtc,
                PeopleCount = dto.PeopleCount,
                Status = ReservationStatus.Pending
            };

            var created = await reservationRepository.AddAsync(reservation);
            if (created == null) return (null, "No se pudo crear la reserva.");

            created.Table = table;
            return (MapToDto(created), null);
        }
        public async Task<(bool Success, string? Error)> CancelAsync(int id, string userId)
        {
            var existing = await reservationRepository.GetByIdAsync(id);
            if (existing == null)
                return (false, "La reserva no existe.");

            if (existing.UserId != userId)
                return (false, "No tienes permiso para cancelar esta reserva.");

            if (existing.Status == ReservationStatus.Cancelled)
                return (false, "La reserva ya está cancelada.");

            if (existing.Status == ReservationStatus.Attended)
                return (false, "No se puede cancelar una reserva ya atendida.");

            var updated = await reservationRepository.UpdateStatusAsync(id, ReservationStatus.Cancelled);
            return updated == null ? (false, "No se pudo cancelar la reserva.") : (true, null);
        }

        public async Task<List<ReservationDto>> GetActiveReservationsAsync()
        {
            var reservations = await reservationRepository.GetActiveReservationsAsync();
            return reservations.Select(MapToDto).ToList();
        }


        private static ReservationDto MapToDto(Reservation r) => new()
        {
            Id = r.Id,
            UserId = r.UserId,
            TableId = r.TableId,
            NumberMesa = r.Table?.NumberMesa ?? string.Empty,
            RestaurantId = r.Table?.RestaurantId ?? 0,
            DateTimeReservation = r.DateTimeReservation,
            PeopleCount = r.PeopleCount,
            Status = r.Status,
            CreatedAt = r.CreatedAt
        };
    }
}
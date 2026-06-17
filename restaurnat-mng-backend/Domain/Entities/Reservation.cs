using Domain.Common.Enums;

namespace Domain.Entities
{
    public class Reservation
    {
        public required int Id { get; set; }
        public required string UserId { get; set; } //fk
        public required int TableId { get; set; } //fk
        public required DateTime DateTimeReservation { get; set; }
        public required int PeopleCount { get; set; }
        public ReservationStatus Status { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // nav property
        public Table? Table { get; set; }
    }
}
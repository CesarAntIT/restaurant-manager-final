using Domain.Common.Enums;

namespace Application.Dtos.Reservation
{
    public class ReservationDto
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public int TableId { get; set; }
        public string NumberMesa { get; set; }
        public int RestaurantId { get; set; }
        public DateTime DateTimeReservation { get; set; }
        public int PeopleCount { get; set; }
        public ReservationStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
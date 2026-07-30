namespace Application.Dtos.Reservation
{
    public class CreateReservationDto
    {
        public required int TableId { get; set; }
        public required DateTime DateTimeReservation { get; set; }
        public required int PeopleCount { get; set; }
    }
}
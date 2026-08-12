namespace Application.Dtos.Reservation
{
    public class ReservationHistoryDto
    {
        public List<ReservationDto> ConfirmedReservations { get; set; } = [];
        public List<ReservationDto> CancelledReservations { get; set; } = [];
        public List<PeakHourDto> PeakHours { get; set; } = [];
        public int TotalConfirmed { get; set; }
        public int TotalCancelled { get; set; }
    }
}

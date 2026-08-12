namespace Application.Dtos.Reservation
{
    public class PeakHourDto
    {
        public int Hour { get; set; }
        public string TimeRange { get; set; } = string.Empty;
        public int ReservationsCount { get; set; }
        public int PeopleCount { get; set; }
    }
}

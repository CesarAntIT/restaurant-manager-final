namespace Application.Dtos.Prediction
{
    public class HistoricalDemandEntryCreateDto
    {
        public int RestaurantId { get; set; }
        public int? MenuId { get; set; }
        public DateTime Date { get; set; }
        public int PeopleCount { get; set; }
        public int? ItemsSold { get; set; }
        public string? Notes { get; set; }
    }

    public class HistoricalDemandEntryDto
    {
        public int Id { get; set; }
        public int RestaurantId { get; set; }
        public int? MenuId { get; set; }
        public DateTime Date { get; set; }
        public int PeopleCount { get; set; }
        public int? ItemsSold { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
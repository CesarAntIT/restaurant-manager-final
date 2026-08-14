namespace Domain.Entities
{
    public class HistoricalDemandEntry
    {
        public int Id { get; set; }
        public int RestaurantId { get; set; }
        public int? MenuId { get; set; }
        public DateTime Date { get; set; }
        public int PeopleCount { get; set; }
        public int? ItemsSold { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Restaurant Restaurant { get; set; } = null!;
        public Menu? Menu { get; set; }
    }
}
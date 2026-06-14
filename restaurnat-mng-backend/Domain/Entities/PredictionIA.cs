namespace Domain.Entities
{
    public class PredictionIA
    {
        public required int Id { get; set; }
        public required int RestaurantId { get; set; } // FK
        public required int MenuId { get; set; } // FK
        public required DateTime PredictionDate { get; set; }
        public required int EstimatedDemand { get; set; }
        public string? StockRecommendation { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
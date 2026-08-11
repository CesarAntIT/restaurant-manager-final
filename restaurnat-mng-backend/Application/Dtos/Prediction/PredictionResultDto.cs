namespace Application.Dtos.Prediction
{
    public class PredictionResultDto
    {
        public int Id { get; set; }
        public int RestaurantId { get; set; }
        public int MenuId { get; set; }
        public DateTime PredictionDate { get; set; }
        public int EstimatedDemand { get; set; }
        public string? StockRecommendation { get; set; }
        public DateTime CreatedAt { get; set; }

        public int SampleSizeUsed { get; set; }
        public string ConfidenceLevel { get; set; } = "Baja";
    }
}
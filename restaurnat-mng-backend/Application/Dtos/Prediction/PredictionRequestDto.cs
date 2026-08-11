namespace Application.Dtos.Prediction
{
    public class PredictionRequestDto
    {
        public required int RestaurantId { get; set; }
        public required int MenuId { get; set; }
        public required DateTime TargetDate { get; set; }
        public int LookbackWeeks { get; set; } = 8;
    }
}
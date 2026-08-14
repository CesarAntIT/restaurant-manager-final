using Application.Dtos.Prediction;

namespace Application.Interfaces
{
    public interface IPredictionService
    {
        Task<PredictionResultDto> GeneratePredictionAsync(PredictionRequestDto request);
        Task<List<PredictionResultDto>> GetPredictionHistoryAsync(int restaurantId);
    }
}
using Application.Dtos.Prediction;

namespace Application.Interfaces
{
    public interface IPredictionService
    {
        Task<PredictionResultDto> GeneratePredictionAsync(PredictionRequestDto request);
        Task<List<PredictionResultDto>> GetPredictionHistoryAsync(int restaurantId);
        Task<HistoricalDemandEntryDto> AddHistoricalDataAsync(HistoricalDemandEntryCreateDto dto);
        Task<List<HistoricalDemandEntryDto>> AddHistoricalDataBulkAsync(List<HistoricalDemandEntryCreateDto> dtos);
        Task<List<HistoricalDemandEntryDto>> GetHistoricalDataAsync(int restaurantId);
    }
}
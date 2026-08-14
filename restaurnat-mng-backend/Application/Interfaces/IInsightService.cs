using Application.Dtos.Insight;

namespace Application.Interfaces
{
    public interface IInsightService
    {
        Task<InsightResponseDto> GenerateInsightAsync(int restaurantId, string userPrompt);
    }
}
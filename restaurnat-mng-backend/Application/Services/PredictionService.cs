using Application.Dtos.Prediction;
using Application.Interfaces;
using Domain.Common.Enums;
using Domain.Entities;
using Domain.Interfaces;

namespace Application.Services
{
    public class PredictionService : IPredictionService
    {
        private readonly IPredictionIARepository predictionRepository;
        private readonly IReservationRepository reservationRepository;
        private readonly IWorkDayRepository workDayRepository;

        public PredictionService(
            IPredictionIARepository predictionRepository,
            IReservationRepository reservationRepository,
            IWorkDayRepository workDayRepository)
        {
            this.predictionRepository = predictionRepository;
            this.reservationRepository = reservationRepository;
            this.workDayRepository = workDayRepository;
        }

        public async Task<PredictionResultDto> GeneratePredictionAsync(PredictionRequestDto request)
        {
            var targetDateUtc = DateTime.SpecifyKind(request.TargetDate, DateTimeKind.Utc);
            var targetWeekday = targetDateUtc.DayOfWeek;
            var lookbackStart = targetDateUtc.AddDays(-7 * request.LookbackWeeks);

            var allReservations = await reservationRepository.GetByRestaurantIdAsync(request.RestaurantId);
            var relevantReservations = allReservations
                .Where(r => r.DateTimeReservation >= lookbackStart
                         && r.DateTimeReservation < request.TargetDate
                         && r.DateTimeReservation < targetDateUtc
                         && r.DateTimeReservation.DayOfWeek == targetWeekday
                         && r.Status != ReservationStatus.Cancelled)
                .ToList();

            var reservationsByDate = relevantReservations
                .GroupBy(r => r.DateTimeReservation.Date)
                .Select(g => g.Sum(r => r.PeopleCount))
                .ToList();

            var workDays = await workDayRepository.GetByRestaurantAndDateRangeAsync(
                request.RestaurantId, lookbackStart, targetDateUtc);

            var salesByDate = workDays
                .Where(w => w.TimeOpen.DayOfWeek == targetWeekday)
                .Select(w => w.WorkDayItems.Sum(i => i.QuantitySold))
                .ToList();

            var sampleSize = Math.Max(reservationsByDate.Count, salesByDate.Count);

            int estimatedDemand;
            if (reservationsByDate.Any() && salesByDate.Any())
                estimatedDemand = (int)Math.Round((reservationsByDate.Average() + salesByDate.Average()) / 2.0);
            else if (reservationsByDate.Any())
                estimatedDemand = (int)Math.Round(reservationsByDate.Average());
            else if (salesByDate.Any())
                estimatedDemand = (int)Math.Round(salesByDate.Average());
            else
                estimatedDemand = 0;

            var confidence = sampleSize switch
            {
                >= 6 => "Alta",
                >= 3 => "Media",
                _ => "Baja"
            };

            var stockRecommendation = BuildStockRecommendation(estimatedDemand, confidence);

            var prediction = new PredictionIA
            {
                Id = 0,
                RestaurantId = request.RestaurantId,
                MenuId = request.MenuId,
                PredictionDate = targetDateUtc,
                EstimatedDemand = estimatedDemand,
                StockRecommendation = stockRecommendation
            };

            var saved = await predictionRepository.AddAsync(prediction);

            return new PredictionResultDto
            {
                Id = saved?.Id ?? 0,
                RestaurantId = request.RestaurantId,
                MenuId = request.MenuId,
                PredictionDate = targetDateUtc,
                EstimatedDemand = estimatedDemand,
                StockRecommendation = stockRecommendation,
                CreatedAt = saved?.CreatedAt ?? DateTime.UtcNow,
                SampleSizeUsed = sampleSize,
                ConfidenceLevel = confidence
            };
        }

        public async Task<List<PredictionResultDto>> GetPredictionHistoryAsync(int restaurantId)
        {
            var predictions = await predictionRepository.GetByRestaurantIdAsync(restaurantId);
            return predictions.Select(p => new PredictionResultDto
            {
                Id = p.Id,
                RestaurantId = p.RestaurantId,
                MenuId = p.MenuId,
                PredictionDate = p.PredictionDate,
                EstimatedDemand = p.EstimatedDemand,
                StockRecommendation = p.StockRecommendation,
                CreatedAt = p.CreatedAt
            }).ToList();
        }

        private static string BuildStockRecommendation(int estimatedDemand, string confidence)
        {
            if (estimatedDemand == 0)
                return "Sin datos históricos suficientes para recomendar niveles de stock.";

            var buffer = confidence switch
            {
                "Alta" => 1.10,
                "Media" => 1.20,
                _ => 1.35
            };

            var recommended = (int)Math.Ceiling(estimatedDemand * buffer);
            return $"Se recomienda preparar stock/insumos para aproximadamente {recommended} clientes " +
                   $"(demanda estimada: {estimatedDemand}, margen de seguridad {buffer:P0}, confianza: {confidence}).";
        }
    }
}
using System.Text.Json;
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
        private readonly IHistoricalDemandRepository historicalDemandRepository;
        private readonly IAIService aiService;

        private const int MinSamplesForWeekdayPattern = 3;

        public PredictionService(
            IPredictionIARepository predictionRepository,
            IReservationRepository reservationRepository,
            IWorkDayRepository workDayRepository,
            IHistoricalDemandRepository historicalDemandRepository,
            IAIService aiService)
        {
            this.predictionRepository = predictionRepository;
            this.reservationRepository = reservationRepository;
            this.workDayRepository = workDayRepository;
            this.historicalDemandRepository = historicalDemandRepository;
            this.aiService = aiService;
        }

        public async Task<PredictionResultDto> GeneratePredictionAsync(PredictionRequestDto request)
        {
            var targetDateUtc = DateTime.SpecifyKind(request.TargetDate, DateTimeKind.Utc);
            var targetWeekday = targetDateUtc.DayOfWeek;
            var lookbackStart = targetDateUtc.AddDays(-7 * request.LookbackWeeks);

            // ---- Reservas ----
            var allReservations = await reservationRepository.GetByRestaurantIdAsync(request.RestaurantId);

            var reservationsInRange = allReservations
                .Where(r => r.DateTimeReservation >= lookbackStart
                         && r.DateTimeReservation < targetDateUtc
                         && r.Status != ReservationStatus.Cancelled)
                .ToList();

            var reservationsSameWeekday = reservationsInRange
                .Where(r => r.DateTimeReservation.DayOfWeek == targetWeekday)
                .ToList();

            var usedReservationFallback = reservationsInRange.Any() && reservationsSameWeekday.Count < MinSamplesForWeekdayPattern;
            var reservationsForCalc = usedReservationFallback ? reservationsInRange : reservationsSameWeekday;

            var reservationsByDate = reservationsForCalc
                .GroupBy(r => r.DateTimeReservation.Date)
                .Select(g => g.Sum(r => r.PeopleCount))
                .ToList();

            // ---- Ventas / WorkDays ----
            var workDays = await workDayRepository.GetByRestaurantAndDateRangeAsync(
                request.RestaurantId, lookbackStart, targetDateUtc);

            var workDaysSameWeekday = workDays
                .Where(w => w.TimeOpen.DayOfWeek == targetWeekday)
                .ToList();

            var usedWorkDayFallback = workDays.Any() && workDaysSameWeekday.Count < MinSamplesForWeekdayPattern;
            var workDaysForCalc = usedWorkDayFallback ? workDays.ToList() : workDaysSameWeekday;

            var salesByDate = workDaysForCalc
                .Select(w => w.WorkDayItems.Sum(i => i.QuantitySold))
                .ToList();

            // ---- Historial manual cargado por el cliente (nuevo) ----
            var historicalEntries = await historicalDemandRepository.GetByRestaurantAndDateRangeAsync(
                request.RestaurantId, lookbackStart, targetDateUtc);

            // Si se pidió un menú específico, prioriza registros de ese menú o sin menú asignado (generales)
            var relevantHistorical = historicalEntries
                .Where(h => h.MenuId == null || h.MenuId == request.MenuId)
                .ToList();

            var historicalSameWeekday = relevantHistorical
                .Where(h => h.Date.DayOfWeek == targetWeekday)
                .ToList();

            var usedHistoricalFallback = relevantHistorical.Any() && historicalSameWeekday.Count < MinSamplesForWeekdayPattern;
            var historicalForCalc = usedHistoricalFallback ? relevantHistorical : historicalSameWeekday;

            var historicalPeopleByDate = historicalForCalc
                .GroupBy(h => h.Date.Date)
                .Select(g => g.Sum(h => h.PeopleCount))
                .ToList();

            var historicalSalesByDate = historicalForCalc
                .Where(h => h.ItemsSold.HasValue)
                .GroupBy(h => h.Date.Date)
                .Select(g => g.Sum(h => h.ItemsSold!.Value))
                .ToList();

            reservationsByDate.AddRange(historicalPeopleByDate);
            salesByDate.AddRange(historicalSalesByDate);

            var sampleSize = Math.Max(reservationsByDate.Count, salesByDate.Count);
            var usedFallback = usedReservationFallback || usedWorkDayFallback || usedHistoricalFallback;

            // ---- Cálculo estadístico base (siempre se calcula, sirve de respaldo) ----
            int statisticalDemand;
            if (reservationsByDate.Any() && salesByDate.Any())
                statisticalDemand = (int)Math.Round((reservationsByDate.Average() + salesByDate.Average()) / 2.0);
            else if (reservationsByDate.Any())
                statisticalDemand = (int)Math.Round(reservationsByDate.Average());
            else if (salesByDate.Any())
                statisticalDemand = (int)Math.Round(salesByDate.Average());
            else
                statisticalDemand = 0;

            var statisticalConfidence = sampleSize switch
            {
                >= 6 when !usedFallback => "Alta",
                >= 3 => "Media",
                _ => "Baja"
            };

            // ---- Intento de refinamiento vía IA ----
            var estimatedDemand = statisticalDemand;
            var confidence = statisticalConfidence;
            var stockRecommendation = BuildStockRecommendation(statisticalDemand, statisticalConfidence);
            var generatedByAI = false;

            if (sampleSize > 0)
            {
                try
                {
                    var prompt = BuildAIPrompt(request, targetWeekday, reservationsByDate, salesByDate, usedFallback);
                    var rawResponse = await aiService.GenerarInsightAsync(prompt);
                    var aiResult = ParseAIResponse(rawResponse);

                    if (aiResult != null && aiResult.EstimatedDemand >= 0 && !string.IsNullOrWhiteSpace(aiResult.StockRecommendation))
                    {
                        estimatedDemand = aiResult.EstimatedDemand;
                        confidence = aiResult.Confidence;
                        stockRecommendation = aiResult.StockRecommendation;
                        generatedByAI = true;
                    }
                }
                catch
                {
                    // Si la IA falla (timeout, cuota, formato inesperado, etc.)
                    // nos quedamos silenciosamente con el cálculo estadístico.
                }
            }

            var prediction = new PredictionIA
            {
                Id = 0,
                RestaurantId = request.RestaurantId,
                MenuId = request.MenuId,
                PredictionDate = targetDateUtc,
                EstimatedDemand = estimatedDemand,
                StockRecommendation = stockRecommendation,
                SampleSizeUsed = sampleSize,
                ConfidenceLevel = confidence,
                GeneratedByAI = generatedByAI
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
                ConfidenceLevel = confidence,
                GeneratedByAI = generatedByAI
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
                CreatedAt = p.CreatedAt,
                SampleSizeUsed = p.SampleSizeUsed,
                ConfidenceLevel = p.ConfidenceLevel,
                GeneratedByAI = p.GeneratedByAI
            }).ToList();
        }

        public async Task<HistoricalDemandEntryDto> AddHistoricalDataAsync(HistoricalDemandEntryCreateDto dto)
        {
            var entry = new HistoricalDemandEntry
            {
                RestaurantId = dto.RestaurantId,
                MenuId = dto.MenuId,
                Date = DateTime.SpecifyKind(dto.Date.Date, DateTimeKind.Utc),
                PeopleCount = dto.PeopleCount,
                ItemsSold = dto.ItemsSold,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow
            };

            var saved = await historicalDemandRepository.AddAsync(entry);
            return MapHistoricalToDto(saved!);
        }

        public async Task<List<HistoricalDemandEntryDto>> AddHistoricalDataBulkAsync(List<HistoricalDemandEntryCreateDto> dtos)
        {
            var entries = dtos.Select(dto => new HistoricalDemandEntry
            {
                RestaurantId = dto.RestaurantId,
                MenuId = dto.MenuId,
                Date = DateTime.SpecifyKind(dto.Date.Date, DateTimeKind.Utc),
                PeopleCount = dto.PeopleCount,
                ItemsSold = dto.ItemsSold,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow
            });

            var saved = await historicalDemandRepository.AddRangeAsync(entries);
            return saved.Select(MapHistoricalToDto).ToList();
        }

        public async Task<List<HistoricalDemandEntryDto>> GetHistoricalDataAsync(int restaurantId)
        {
            var entries = await historicalDemandRepository.GetByRestaurantIdAsync(restaurantId);
            return entries.Select(MapHistoricalToDto).ToList();
        }

        private static HistoricalDemandEntryDto MapHistoricalToDto(HistoricalDemandEntry h) => new()
        {
            Id = h.Id,
            RestaurantId = h.RestaurantId,
            MenuId = h.MenuId,
            Date = h.Date,
            PeopleCount = h.PeopleCount,
            ItemsSold = h.ItemsSold,
            Notes = h.Notes,
            CreatedAt = h.CreatedAt
        };

        private static string BuildAIPrompt(
            PredictionRequestDto request,
            DayOfWeek targetWeekday,
            List<int> reservationsByDate,
            List<int> salesByDate,
            bool usedFallback)
        {
            var reservationsSummary = reservationsByDate.Any()
                ? string.Join(", ", reservationsByDate)
                : "sin datos";

            var salesSummary = salesByDate.Any()
                ? string.Join(", ", salesByDate)
                : "sin datos";

            var patternNote = usedFallback
                ? "Nota: no había suficientes registros del mismo día de la semana, así que estas cifras provienen de días variados dentro del rango de historial (incluye datos reales del sistema y/o cargados manualmente por el dueño)."
                : $"Estas cifras corresponden específicamente a los {targetWeekday} anteriores (incluye datos reales del sistema y/o cargados manualmente por el dueño).";

            return $@"Eres un analista de demanda para un restaurante. Con base en el siguiente historial, estima la afluencia de clientes esperada para la fecha objetivo y recomienda niveles de stock/insumos.

Fecha objetivo: {request.TargetDate:yyyy-MM-dd} ({targetWeekday})
Semanas de historial solicitadas: {request.LookbackWeeks}
Personas reservadas/atendidas por día en el historial relevante: {reservationsSummary}
Platillos vendidos por día en el historial relevante: {salesSummary}
{patternNote}

Responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin bloques de código, con este formato exacto:
{{""estimatedDemand"": <número entero>, ""confidence"": ""Alta"" | ""Media"" | ""Baja"", ""stockRecommendation"": ""<recomendación breve en español>""}}";
        }

        private static AIPredictionResult? ParseAIResponse(string raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return null;

            var cleaned = raw.Trim();

            if (cleaned.StartsWith("```"))
            {
                var firstBreak = cleaned.IndexOf('\n');
                var lastFence = cleaned.LastIndexOf("```");
                if (firstBreak >= 0 && lastFence > firstBreak)
                    cleaned = cleaned[(firstBreak + 1)..lastFence].Trim();
            }

            try
            {
                using var doc = JsonDocument.Parse(cleaned);
                var root = doc.RootElement;

                if (!root.TryGetProperty("estimatedDemand", out var demandEl))
                    return null;

                var demand = demandEl.ValueKind == JsonValueKind.Number
                    ? demandEl.GetInt32()
                    : int.Parse(demandEl.GetString() ?? "0");

                var confidence = root.TryGetProperty("confidence", out var confEl)
                    ? confEl.GetString() ?? "Baja"
                    : "Baja";

                if (confidence is not ("Alta" or "Media" or "Baja"))
                    confidence = "Baja";

                var stockRecommendation = root.TryGetProperty("stockRecommendation", out var stockEl)
                    ? stockEl.GetString() ?? string.Empty
                    : string.Empty;

                return new AIPredictionResult(demand, confidence, stockRecommendation);
            }
            catch (JsonException)
            {
                return null;
            }
            catch (FormatException)
            {
                return null;
            }
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

        private sealed record AIPredictionResult(int EstimatedDemand, string Confidence, string StockRecommendation);
    }
}
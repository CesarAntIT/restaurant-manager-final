using System.Text;
using Application.Dtos.Insight;
using Application.Interfaces;

namespace Application.Services
{
    public class InsightService : IInsightService
    {
        private readonly ISalesService salesService;
        private readonly IDishService dishService;
        private readonly IPredictionService predictionService;
        private readonly IReviewService reviewService;
        private readonly IAIService aiService;

        private const int LookbackDays = 30;

        public InsightService(
            ISalesService salesService,
            IDishService dishService,
            IPredictionService predictionService,
            IReviewService reviewService,
            IAIService aiService)
        {
            this.salesService = salesService;
            this.dishService = dishService;
            this.predictionService = predictionService;
            this.reviewService = reviewService;
            this.aiService = aiService;
        }

        public async Task<InsightResponseDto> GenerateInsightAsync(int restaurantId, string userPrompt)
        {
            var context = await BuildRestaurantContextAsync(restaurantId);

            var fullPrompt = $@"Eres un asistente de negocio para un restaurante. Responde en español,
de forma clara y accionable, usando ÚNICAMENTE los datos reales del restaurante que se muestran
a continuación como base de tu análisis. Si el dueño pide algo que los datos no permiten responder
con precisión, acláralo brevemente en vez de inventar cifras.

=== DATOS DEL RESTAURANTE (últimos {LookbackDays} días) ===
{context}

=== PREGUNTA DEL DUEÑO ===
{userPrompt}";

            var respuesta = await aiService.GenerarInsightAsync(fullPrompt);

            return new InsightResponseDto
            {
                Respuesta = respuesta,
                UsoDatosReales = true
            };
        }

        private async Task<string> BuildRestaurantContextAsync(int restaurantId)
        {
            var sb = new StringBuilder();
            var to = DateTime.UtcNow.Date;
            var from = to.AddDays(-LookbackDays);

            // ---- Ventas históricas ----
            try
            {
                var sales = await salesService.GetHistoricalSummaryAsync(restaurantId, from, to);

                sb.AppendLine($"- Ingresos totales: {sales.TotalRevenue:C}");
                sb.AppendLine($"- Platos vendidos: {sales.TotalItemsSold}");
                sb.AppendLine($"- Días operativos registrados: {sales.WorkDaysCount}");
                sb.AppendLine($"- Ingreso promedio por día: {sales.AverageRevenuePerDay:C}");

                if (sales.TopDishes.Any())
                {
                    sb.AppendLine("- Platos más vendidos:");
                    foreach (var d in sales.TopDishes.Take(5))
                    {
                        sb.AppendLine($"  * {d.DishName}: {d.QuantitySold} unidades, {d.Revenue:C} en ingresos");
                    }
                }
            }
            catch
            {
                sb.AppendLine("- (No se pudieron obtener datos de ventas históricas)");
            }

            // ---- Menú / platos ----
            try
            {
                var dishes = await dishService.GetByRestaurantIdAsync(restaurantId);
                sb.AppendLine($"- Platos activos en el menú: {dishes.Count}");
                if (dishes.Any())
                {
                    var listado = string.Join(", ", dishes.Take(15).Select(d => $"{d.Name} (${d.Price})"));
                    sb.AppendLine($"  Ejemplos: {listado}");
                }
            }
            catch
            {
                sb.AppendLine("- (No se pudieron obtener los platos del menú)");
            }

            // ---- Última predicción de demanda ----
            try
            {
                var predictions = await predictionService.GetPredictionHistoryAsync(restaurantId);
                var last = predictions
                    .OrderByDescending(p => p.CreatedAt)
                    .FirstOrDefault();

                if (last != null)
                {
                    sb.AppendLine("- Última predicción de demanda generada por el sistema:");
                    sb.AppendLine($"  * Fecha objetivo: {last.PredictionDate:yyyy-MM-dd}");
                    sb.AppendLine($"  * Demanda estimada: {last.EstimatedDemand} clientes");
                    sb.AppendLine($"  * Confianza: {last.ConfidenceLevel} (muestras usadas: {last.SampleSizeUsed})");
                    sb.AppendLine($"  * Recomendación de stock: {last.StockRecommendation}");
                }
                else
                {
                    sb.AppendLine("- (Todavía no hay predicciones de demanda generadas)");
                }
            }
            catch
            {
                sb.AppendLine("- (No se pudieron obtener predicciones previas)");
            }

            // ---- Reseñas ----
            try
            {
                var reviews = await reviewService.GetReviewsByRestaurantAsync(restaurantId);
                if (reviews != null)
                {
                    sb.AppendLine($"- Calificación promedio: {reviews.AverageRating}/5 ({reviews.TotalReviews} reseñas)");
                    var comentarios = reviews.Reviews
                        .Where(r => !string.IsNullOrWhiteSpace(r.Comment))
                        .Take(5)
                        .Select(r => $"\"{r.Comment}\" ({r.Rating}/5)");
                    if (comentarios.Any())
                        sb.AppendLine($"  Comentarios recientes: {string.Join(" | ", comentarios)}");
                }
                else
                {
                    sb.AppendLine("- (Todavía no hay reseñas registradas)");
                }
            }
            catch
            {
                sb.AppendLine("- (No se pudieron obtener las reseñas)");
            }

            return sb.ToString();
        }
    }
}
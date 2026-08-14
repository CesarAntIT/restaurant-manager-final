using Application.Dtos.Prediction;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace WebApi.Controllers.v1
{
    [SwaggerTag("Endpoints para predicción de afluencia de clientes")]
    [Route("api/predictions")]
    [ApiController]
    [Authorize(Roles = "Owner,Admin")]
    public class PredictionsController : ControllerBase
    {
        private readonly IPredictionService _predictionService;

        public PredictionsController(IPredictionService predictionService)
        {
            _predictionService = predictionService;
        }

        [HttpPost("generate")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(
            Summary = "Generar predicción de afluencia",
            Description = "Procesa el historial de reservas y ventas para estimar la afluencia de clientes en una fecha futura."
        )]
        public async Task<IActionResult> Generate([FromBody] PredictionRequestDto dto)
        {
            var traceId = $"00-generate-prediction-{Guid.NewGuid()}";

            var targetDateUtc = DateTime.SpecifyKind(dto.TargetDate, DateTimeKind.Utc);
            if (targetDateUtc <= DateTime.UtcNow)
            {
                return BadRequest(new
                {
                    success = false,
                    error = new { code = "INVALID_TARGET_DATE", message = "La fecha objetivo debe ser futura.", traceId }
                });
            }

            try
            {
                var result = await _predictionService.GeneratePredictionAsync(dto);
                return Ok(new { success = true, data = result });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error = new { code = "INTERNAL_SERVER_ERROR", message = "Ocurrió un error al generar la predicción.", traceId }
                });
            }
        }

        [HttpGet("{restaurantId}/history")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [SwaggerOperation(
            Summary = "Historial de predicciones",
            Description = "Devuelve las predicciones generadas previamente para un restaurante."
        )]
        public async Task<IActionResult> GetHistory(int restaurantId)
        {
            var result = await _predictionService.GetPredictionHistoryAsync(restaurantId);
            return Ok(new { success = true, data = result });
        }
    }
}
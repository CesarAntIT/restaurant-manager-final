using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace WebApi.Controllers.v1
{
    [SwaggerTag("Endpoints para resúmenes de ventas del restaurante")]
    [Route("api/sales")]
    [ApiController]
    [Authorize(Roles = "Owner,Admin")]
    public class SalesController : ControllerBase
    {
        private readonly ISalesService _salesService;

        public SalesController(ISalesService salesService)
        {
            _salesService = salesService;
        }

        [HttpGet("{restaurantId}/daily")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(
            Summary = "Resumen de ventas diarias",
            Description = "Devuelve el resumen de ventas de un restaurante para una fecha específica (por defecto, hoy)."
        )]
        public async Task<IActionResult> GetDailySummary(int restaurantId, [FromQuery] DateTime? date)
        {
            var traceId = $"00-sales-daily-{Guid.NewGuid()}";
            try
            {
                var targetDate = date ?? DateTime.UtcNow;
                var result = await _salesService.GetDailySummaryAsync(restaurantId, targetDate);

                if (result == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        error = new { code = "NO_SALES_DATA", message = "No hay datos de ventas para esa fecha.", traceId }
                    });
                }

                return Ok(new { success = true, data = result });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error = new { code = "INTERNAL_SERVER_ERROR", message = "Ocurrió un error al obtener el resumen de ventas.", traceId }
                });
            }
        }

        [HttpGet("{restaurantId}/history")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(
            Summary = "Historial de ventas",
            Description = "Devuelve el resumen histórico de ventas de un restaurante entre dos fechas."
        )]
        public async Task<IActionResult> GetHistoricalSummary(int restaurantId, [FromQuery] DateTime from, [FromQuery] DateTime to)
        {
            var traceId = $"00-sales-history-{Guid.NewGuid()}";

            if (from > to)
            {
                return BadRequest(new
                {
                    success = false,
                    error = new { code = "INVALID_RANGE", message = "La fecha 'from' no puede ser mayor que 'to'.", traceId }
                });
            }

            try
            {
                var result = await _salesService.GetHistoricalSummaryAsync(restaurantId, from, to);
                return Ok(new { success = true, data = result });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error = new { code = "INTERNAL_SERVER_ERROR", message = "Ocurrió un error al obtener el historial de ventas.", traceId }
                });
            }
        }
    }
}
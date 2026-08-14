using Application.Dtos.Insight;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace restaurnat_mng_backend.Controllers
{
    [ApiController]
    [Route("api/restaurants/{restaurantId:int}/insights")]
    [Authorize]
    public class InsightsController : ControllerBase
    {
        private readonly IInsightService _insightService;

        public InsightsController(IInsightService insightService)
        {
            _insightService = insightService;
        }

        [HttpPost]
        public async Task<IActionResult> GenerateInsight(int restaurantId, [FromBody] InsightRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Prompt))
                return BadRequest(new { error = "El prompt no puede estar vacío." });

            try
            {
                var result = await _insightService.GenerateInsightAsync(restaurantId, dto.Prompt);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
using Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace restaurnat_mng_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IATestController : ControllerBase
    {
        private readonly IAIService _aiService;

        public IATestController(IAIService aiService)
        {
            _aiService = aiService;
        }

        [HttpPost("probando-ia")]
        public async Task<IActionResult> ProbarIA([FromBody] string prompt)
        {
            try
            {
                var resultado = await _aiService.GenerarInsightAsync(prompt);
                return Ok(new { respuesta = resultado });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}

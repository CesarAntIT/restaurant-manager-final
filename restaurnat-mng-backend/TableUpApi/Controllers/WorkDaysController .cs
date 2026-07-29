using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace WebApi.Controllers.v1
{
    [SwaggerTag("Endpoints para la gestión de jornadas laborales")]
    [Route("api/workdays")]
    [ApiController]
    public class WorkDaysController : ControllerBase
    {
        private readonly IWorkDayService _workDayService;

        public WorkDaysController(IWorkDayService workDayService)
        {
            _workDayService = workDayService;
        }

        [HttpPost("open/{restaurantId}")]
        [Authorize(Roles = "Owner")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(
            Summary = "Abrir jornada laboral",
            Description = "Permite abrir una jornada laboral para un restaurante. Solo puede existir una jornada activa por restaurante."
        )]
        public async Task<IActionResult> OpenWorkDay(int restaurantId)
        {
            var traceId = $"00-open-workday-{Guid.NewGuid()}";

            try
            {
                var result = await _workDayService.OpenWorkDayAsync(restaurantId);

                if (!result)
                {
                    return BadRequest(new
                    {
                        success = false,
                        error = new
                        {
                            code = "WORKDAY_ALREADY_OPEN",
                            message = "Ya existe una jornada laboral activa para este restaurante.",
                            traceId
                        }
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Jornada laboral abierta correctamente."
                });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error = new
                    {
                        code = "INTERNAL_SERVER_ERROR",
                        message = "Ocurrió un error inesperado al abrir la jornada laboral.",
                        traceId
                    }
                });
            }
        }

        [HttpPost("close/{restaurantId}")]
        [Authorize(Roles = "Owner")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(
            Summary = "Cerrar jornada laboral",
            Description = "Permite cerrar la jornada laboral activa de un restaurante."
        )]
        public async Task<IActionResult> CloseWorkDay(int restaurantId)
        {
            var traceId = $"00-close-workday-{Guid.NewGuid()}";

            try
            {
                var result = await _workDayService.CloseWorkDayAsync(restaurantId);

                if (!result)
                {
                    return BadRequest(new
                    {
                        success = false,
                        error = new
                        {
                            code = "NO_ACTIVE_WORKDAY",
                            message = "No existe una jornada laboral activa para cerrar.",
                            traceId
                        }
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Jornada laboral cerrada correctamente."
                });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error = new
                    {
                        code = "INTERNAL_SERVER_ERROR",
                        message = "Ocurrió un error inesperado al cerrar la jornada laboral.",
                        traceId
                    }
                });
            }
        }
    }
}
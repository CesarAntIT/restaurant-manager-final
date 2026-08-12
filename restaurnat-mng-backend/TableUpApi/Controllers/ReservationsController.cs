using Application.Dtos.Reservation;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Security.Claims;

namespace WebApi.Controllers
{
    [SwaggerTag("Endpoints para la gestión de reservas del restaurante")]
    [ApiController]
    [Route("api/reservations")]
    [Authorize]
    public class ReservationsController : ControllerBase
    {
        private readonly IReservationService reservationService;

        public ReservationsController(IReservationService reservationService)
        {
            this.reservationService = reservationService;
        }
        private string? CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

        [HttpPost]
        [SwaggerOperation(
            Summary = "Crear una reserva",
            Description = "Permite al usuario autenticado crear una nueva reserva en el restaurante"
        )]
        public async Task<ActionResult<ReservationDto>> Create([FromBody] CreateReservationDto dto)
        {
            var userId = CurrentUserId;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var (reservation, error) = await reservationService.CreateAsync(userId, dto);
            if (reservation == null)
                return BadRequest(error);

            return CreatedAtAction(nameof(GetById), new { id = reservation.Id }, reservation);
        }

        [HttpPut("{id:int}/cancel")]
        [SwaggerOperation(
            Summary = "Cancelar una reserva",
            Description = "Permite al usuario autenticado cancelar una reserva existente, siempre que esté pendiente"
        )]
        public async Task<IActionResult> Cancel(int id)
        {
            var userId = CurrentUserId;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var (success, error) = await reservationService.CancelAsync(id, userId);
            if (!success)
                return BadRequest(error);

            return NoContent();
        }

        [HttpGet("{id:int}")]
        [SwaggerOperation(
            Summary = "Obtener una reserva por ID",
            Description = "Devuelve los detalles de una reserva específica según su identificador"
        )]
        public async Task<ActionResult<ReservationDto>> GetById(int id)
        {
            var reservation = await reservationService.GetByIdAsync(id);
            if (reservation == null)
                return NotFound();

            return Ok(reservation);
        }

        [HttpGet("me")]
        [SwaggerOperation(
            Summary = "Obtener mis reservas",
            Description = "Devuelve el listado de reservas asociadas al usuario autenticado"
        )]
        public async Task<ActionResult<List<ReservationDto>>> GetMyReservations()
        {
            var userId = CurrentUserId;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var reservations = await reservationService.GetByUserIdAsync(userId);
            return Ok(reservations);
        }

        [HttpGet("restaurant/{restaurantId:int}")]
        [SwaggerOperation(
            Summary = "Obtener reservas por restaurante",
            Description = "Devuelve todas las reservas asociadas a un restaurante específico"
        )]
        public async Task<ActionResult<List<ReservationDto>>> GetByRestaurant(int restaurantId)
        {
            var reservations = await reservationService.GetByRestaurantIdAsync(restaurantId);
            return Ok(reservations);
        }

        [Authorize(Roles = "Admin,Owner")]
        [HttpGet("get-active-reservations")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(
            Summary = "Obtener reservas activas",
            Description = "Devuelve el listado de todas las reservas que se encuentran activas"
        )]
        public async Task<IActionResult> GetActiveReservations()
        {
            try
            {
                var activeReservations = await reservationService.GetActiveReservationsAsync();
                if (activeReservations == null || !activeReservations.Any())
                    return NotFound("No active reservations found.");

                return Ok(activeReservations);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    $"An error occurred while retrieving reservations: {ex.Message}");
            }
        }

        [Authorize(Roles = "Admin,Owner")]
        [HttpGet("history")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(
            Summary = "Obtener historial de reservas",
            Description = "Devuelve reservas confirmadas, canceladas y las horas pico. Puede filtrarse por restaurante y rango de fechas"
        )]
        public async Task<ActionResult<ReservationHistoryDto>> GetReservationHistory(
            [FromQuery] int? restaurantId,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery] int topPeakHours = 5)
        {
            try
            {
                var history = await reservationService.GetHistoryAsync(restaurantId, from, to, topPeakHours);
                return Ok(history);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    $"An error occurred while retrieving reservation history: {ex.Message}");
            }
        }

        [Authorize(Roles = "Admin,Owner")]
        [HttpGet("history/confirmed")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(
            Summary = "Obtener historial de reservas confirmadas",
            Description = "Devuelve las reservas confirmadas. Puede filtrarse por restaurante y rango de fechas"
        )]
        public async Task<ActionResult<List<ReservationDto>>> GetConfirmedHistory(
            [FromQuery] int? restaurantId,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to)
        {
            try
            {
                var reservations = await reservationService.GetConfirmedHistoryAsync(restaurantId, from, to);
                return Ok(reservations);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    $"An error occurred while retrieving confirmed reservation history: {ex.Message}");
            }
        }

        [Authorize(Roles = "Admin,Owner")]
        [HttpGet("history/cancelled")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(
            Summary = "Obtener historial de reservas canceladas",
            Description = "Devuelve las reservas canceladas. Puede filtrarse por restaurante y rango de fechas"
        )]
        public async Task<ActionResult<List<ReservationDto>>> GetCancelledHistory(
            [FromQuery] int? restaurantId,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to)
        {
            try
            {
                var reservations = await reservationService.GetCancelledHistoryAsync(restaurantId, from, to);
                return Ok(reservations);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    $"An error occurred while retrieving cancelled reservation history: {ex.Message}");
            }
        }

        [Authorize(Roles = "Admin,Owner")]
        [HttpGet("history/peak-hours")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(
            Summary = "Obtener horas pico de reservas",
            Description = "Devuelve las horas con mayor cantidad de reservas. Puede filtrarse por restaurante y rango de fechas"
        )]
        public async Task<ActionResult<List<PeakHourDto>>> GetPeakHours(
            [FromQuery] int? restaurantId,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery] int top = 5)
        {
            try
            {
                var peakHours = await reservationService.GetPeakHoursAsync(restaurantId, from, to, top);
                return Ok(peakHours);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    $"An error occurred while retrieving reservation peak hours: {ex.Message}");
            }
        }
    }
}

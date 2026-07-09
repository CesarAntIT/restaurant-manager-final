using Application.Dtos.Reservation;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace WebApi.Controllers
{
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
        public async Task<ActionResult<ReservationDto>> GetById(int id)
        {
            var reservation = await reservationService.GetByIdAsync(id);
            if (reservation == null)
                return NotFound();

            return Ok(reservation);
        }

        [HttpGet("me")]
        public async Task<ActionResult<List<ReservationDto>>> GetMyReservations()
        {
            var userId = CurrentUserId;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var reservations = await reservationService.GetByUserIdAsync(userId);
            return Ok(reservations);
        }

        [HttpGet("restaurant/{restaurantId:int}")]
        public async Task<ActionResult<List<ReservationDto>>> GetByRestaurant(int restaurantId)
        {
            var reservations = await reservationService.GetByRestaurantIdAsync(restaurantId);
            return Ok(reservations);
        }
    }
}
using Application.Dtos.Review;
using Application.Dtos.User;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Data;
using System.Security.Claims;


namespace TableUpApi.Controllers
{
    [SwaggerTag("Endpoints para la creación, eliminación e historial de reseñas por parte de los clientes")]
    [Route("api/reviews")]
    [ApiController]
    [Authorize(Roles = "Client")]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewsController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Summary = "Crear Reseña", Description = "Permite a un cliente autenticado publicar una nueva reseña para un restaurante.")]
        public async Task<IActionResult> Create([FromBody] CreateReviewDto dto)
        {
            var traceId = $"00-create-review-{Guid.NewGuid()}";

            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    error = new
                    {
                        code = "VALIDATION_ERROR",
                        message = "La solicitud contiene datos inválidos.",
                        traceId = traceId
                    }
                });
            }

            try
            {
                var userId = User.FindFirst("uid")?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    return StatusCode(StatusCodes.Status401Unauthorized, new
                    {
                        success = false,
                        error = new
                        {
                            code = "UNAUTHORIZED",
                            message = "No se pudo identificar al usuario autenticado.",
                            traceId = traceId
                        }
                    });
                }

                var isCreated = await _reviewService.AddAsync(dto, userId);

                if (!isCreated)
                {
                    return BadRequest(new
                    {
                        success = false,
                        error = new
                        {
                            code = "CREATE_REVIEW_FAILED",
                            message = "No se pudo registrar la reseña. Verifique los datos del restaurante.",
                            traceId = traceId
                        }
                    });
                }

                return StatusCode(StatusCodes.Status201Created, new
                {
                    success = true,
                    message = "Reseña publicada exitosamente."
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
                        message = "Ocurrió un error inesperado al procesar la solicitud.",
                        traceId = traceId
                    }
                });
            }
        }

        /// <summary>
        /// Obtiene el historial de reseñas del cliente autenticado.
        /// </summary>
        /// <returns>Historial de reseñas asociadas al usuario actual.</returns>
        [HttpGet("my-history")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetMyHistory()
        {
            var traceId = $"00-history-review-{Guid.NewGuid()}";

            try
            {
   
                var userId = User.FindFirst("uid")?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    return StatusCode(StatusCodes.Status401Unauthorized, new
                    {
                        success = false,
                        error = new { code = "UNAUTHORIZED", message = "No se pudo identificar al usuario.", traceId = traceId }
                    });
                }

                var history = await _reviewService.GetClientHistoryAsync(userId);

                return Ok(new
                {
                    success = true,
                    message = "Historial de reseñas obtenido exitosamente.",
                    data = history
                });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error = new
                    {
                        code = "INTERNAL_SERVER_ERROR",
                        message = "Ocurrió un error inesperado al consultar el historial.",
                        details = ex.Message,
                        traceId = traceId
                    }
                });
            }
        }

        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Summary = "Eliminar Reseña", Description = "Permite a un cliente eliminar una reseña de su propiedad utilizando el ID.")]
        public async Task<IActionResult> Delete(int id)
        {
            var traceId = $"00-delete-review-{Guid.NewGuid()}";

            try
            {
                var userId = User.FindFirst("uid")?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    return StatusCode(StatusCodes.Status401Unauthorized, new
                    {
                        success = false,
                        error = new
                        {
                            code = "UNAUTHORIZED",
                            message = "No se pudo identificar al usuario autenticado.",
                            traceId = traceId
                        }
                    });
                }

                var isDeleted = await _reviewService.DeleteReviewByClientAsync(id, userId);

                if (!isDeleted)
                {
                    return BadRequest(new
                    {
                        success = false,
                        error = new
                        {
                            code = "DELETE_FAILED",
                            message = "No se pudo eliminar la reseña. Puede que no exista o no tengas los permisos necesarios.",
                            traceId = traceId
                        }
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Reseña eliminada correctamente."
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
                        message = "Ocurrió un error inesperado al intentar eliminar la reseña.",
                        traceId = traceId
                    }
                });
            }
        }
    }
}
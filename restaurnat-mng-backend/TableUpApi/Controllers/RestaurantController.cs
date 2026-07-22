using Application.Dtos.Restaurant;
using Application.Interfaces;
using Domain.Common.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Security.Claims;

namespace TableUpApi.Controllers
{
    [SwaggerTag("Endpoints for restaurant management")]
    [Route("api/restaurants")]
    [ApiController]
    [Authorize]
    public class RestaurantController : ControllerBase
    {
        private readonly IRestaurantService restaurantService;

        public RestaurantController(IRestaurantService restaurantService)
        {
            this.restaurantService = restaurantService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Summary = "Listar todos los restaurantes", Description = "Solo Admin puede ver todos los restaurantes.")]
        public async Task<IActionResult> GetAll()
        {
            var traceId = $"00-restaurants-{Guid.NewGuid()}";
            try
            {
                var result = await restaurantService.GetAllAsync();
                return Ok(new { success = true, data = result });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error = new { code = "INTERNAL_SERVER_ERROR", message = "Ocurrio un error inesperado.", traceId = traceId }
                });
            }
        }

        [HttpGet]
        [Route("public")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Summary = "Listar todos los restaurantes", Description = "Permite al resto de los usuarios ver los distintos restaurantes aprobados por el Admin")]
        public async Task<IActionResult> GetAllPublic()
        {
            var traceId = $"00-restaurants-{Guid.NewGuid()}";
            try
            {
                var result = await restaurantService.GetAllAsync();

                return Ok(new { success = true, data = result.Where(x => x.Status == RestaurantStatus.Approved) });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error = new { code = "INTERNAL_SERVER_ERROR", message = "Ocurrio un error inesperado.", traceId = traceId }
                });
            }

        }


        [HttpGet("my-restaurants")]
        [Authorize(Roles = "Owner")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Summary = "Listar mis restaurantes", Description = "Owner puede ver sus propios restaurantes.")]
        public async Task<IActionResult> GetMyRestaurants()
        {
            var traceId = $"00-my-restaurants-{Guid.NewGuid()}";
            try
            {
                var ownerId = User.FindFirst("uid")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(ownerId))
                    return Unauthorized(new { success = false, error = new { code = "UNAUTHORIZED", message = "Token JWT ausente, invalido o expirado.", traceId = traceId } });

                var result = await restaurantService.GetByOwnerIdAsync(ownerId);
                return Ok(new { success = true, data = result });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error = new { code = "INTERNAL_SERVER_ERROR", message = "Ocurrio un error inesperado.", traceId = traceId }
                });
            }
        }

        [HttpGet("{id}")]
        //[Authorize(Roles = "Admin,Owner")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Summary = "Obtener restaurante por ID", Description = "Admin y Owner pueden consultar un restaurante por su ID.")]
        public async Task<IActionResult> GetById(int id)
        {
            var traceId = $"00-restaurant-{Guid.NewGuid()}";
            try
            {
                var result = await restaurantService.GetByIdAsync(id);
                if (result == null)
                    return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = "Restaurante no encontrado.", traceId = traceId } });

                return Ok(new { success = true, data = result });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error = new { code = "INTERNAL_SERVER_ERROR", message = "Ocurrio un error inesperado.", traceId = traceId }
                });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Owner")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Summary = "Crear restaurante", Description = "Owner puede crear un restaurante.")]
        public async Task<IActionResult> Create([FromForm] SaveRestaurantDto dto)
        {
            var traceId = $"00-create-restaurant-{Guid.NewGuid()}";
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, error = new { code = "VALIDATION_ERROR", message = "La solicitud contiene datos invalidos.", traceId = traceId } });

            try
            {
                var ownerId = User.FindFirst("uid")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(ownerId))
                    return Unauthorized(new { success = false, error = new { code = "UNAUTHORIZED", message = "Token JWT ausente, invalido o expirado.", traceId = traceId } });

                dto.OwnerId = ownerId;
                var result = await restaurantService.CreateAsync(dto);
                if (result == null)
                    return BadRequest(new { success = false, error = new { code = "CREATE_ERROR", message = "No se pudo crear el restaurante.", traceId = traceId } });

                return StatusCode(StatusCodes.Status201Created, new { success = true, message = "Restaurante creado correctamente.", data = result });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error = new { code = "INTERNAL_SERVER_ERROR", message = "Ocurrio un error inesperado.", traceId = traceId }
                });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Owner")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Summary = "Actualizar restaurante", Description = "Owner puede actualizar los datos de su restaurante.")]
        public async Task<IActionResult> Update(int id, [FromForm] UpdateRestaurantDto dto)
        {
            var traceId = $"00-update-restaurant-{Guid.NewGuid()}";
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, error = new { code = "VALIDATION_ERROR", message = "La solicitud contiene datos invalidos.", traceId = traceId } });

            try
            {
                var result = await restaurantService.UpdateAsync(id, dto);
                if (result == null)
                    return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = "Restaurante no encontrado.", traceId = traceId } });

                return Ok(new { success = true, message = "Restaurante actualizado correctamente.", data = result });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error = new { code = "INTERNAL_SERVER_ERROR", message = "Ocurrio un error inesperado.", traceId = traceId }
                });
            }
        }

        [HttpPatch("change-status/{id}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Summary =
            "Actualizar Estado de Restaurante", Description = "Permite a un Administrador aceptar o rechazar una solicitud para creación de restaurante.\n" +
            "Los estados deben de especificarse como string:" +
            "\n * Pendiente\n * Approved\n * Rejected")]
        public async Task<IActionResult> UpdateStatus([FromRoute] int id, [FromBody] RestaurantStatus status)
        {
            var traceId = $"00-update-restaurant-status-{Guid.NewGuid()}";
            try
            {
                var res = await restaurantService.ChangeStatus(id, status);
                if (!res)
                    return NotFound(new
                    {
                        success = false,
                        error = new
                        {
                            code = "NOT_FOUND",
                            message = "No se pudo cambiar el estado del restaurante",
                            traceId = traceId
                        }
                    });

                return Ok(new { success = true, message = "El estado del restaurante ha sido cambiado satisfactoriamente", traceId = traceId });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error = new { code = "INTERNAL_SERVER_ERROR", message = "Ocurrio un error inesperado.", traceId = traceId }
                });
            }

        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Owner, Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Summary = "Eliminar restaurante", Description = "Admin y Owner pueden eliminar un restaurante.")]
        public async Task<IActionResult> Delete(int id)
        {
            var traceId = $"00-delete-restaurant-{Guid.NewGuid()}";
            try
            {
                var deleted = await restaurantService.DeleteAsync(id);
                if (!deleted)
                    return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = "Restaurante no encontrado.", traceId = traceId } });

                return Ok(new { success = true, message = "Restaurante eliminado correctamente." });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error = new { code = "INTERNAL_SERVER_ERROR", message = "Ocurrio un error inesperado.", traceId = traceId }
                });
            }
        }
    }
}
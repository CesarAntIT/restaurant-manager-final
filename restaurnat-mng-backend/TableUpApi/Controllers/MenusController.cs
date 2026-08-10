using Application.Dtos.Table;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace WebApi.Controllers
{
    [SwaggerTag("Endpoints para la gestion de menus")]
    [Route("api/menus")]
    [ApiController]
    [Authorize(Roles = "Owner")]
    public class MenusController : ControllerBase
    {
        private readonly IMenuService menuService;

        public MenusController(IMenuService menuService)
        {
            this.menuService = menuService;
        }

        [HttpPost]
        [Authorize(Roles = "Owner")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(
    Summary = "Crear menú",
    Description = "Permite crear un nuevo menú para un restaurante."
)]
        public async Task<IActionResult> Create([FromBody] CreateMenuDto dto)
        {
            var traceId = $"00-create-menu-{Guid.NewGuid()}";

            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    error = new
                    {
                        code = "VALIDATION_ERROR",
                        message = "La solicitud contiene datos inválidos.",
                        traceId
                    }
                });
            }

            try
            {
                var result = await menuService.CreateAsync(dto);

                if (result == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        error = new
                        {
                            code = "CREATE_MENU_FAILED",
                            message = "Ya existe un menú con ese nombre para este restaurante.",
                            traceId
                        }
                    });
                }

                return StatusCode(StatusCodes.Status201Created, new
                {
                    success = true,
                    message = "Menú creado correctamente.",
                    data = result
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
                        message = ex.Message,
                        details = ex.InnerException?.Message,
                        traceId
                    }
                });
            }
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(
    Summary = "Obtener menú por Id",
    Description = "Obtiene la información de un menú específico."
)]
        public async Task<IActionResult> GetById(int id)
        {
            var traceId = $"00-get-menu-{Guid.NewGuid()}";

            try
            {
                var result = await menuService.GetByIdAsync(id);

                if (result == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        error = new
                        {
                            code = "MENU_NOT_FOUND",
                            message = "No se encontró el menú solicitado.",
                            traceId
                        }
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = result
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
                        message = "Ocurrió un error inesperado.",
                        traceId
                    }
                });
            }
        }

        [HttpGet("restaurant/{restaurantId}")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(
    Summary = "Obtener menús por restaurante",
    Description = "Obtiene todos los menús asociados a un restaurante."
)]
        public async Task<IActionResult> GetByRestaurant(int restaurantId)
        {
            var traceId = $"00-get-restaurant-menus-{Guid.NewGuid()}";

            try
            {
                var result = await menuService.GetByRestaurantIdAsync(restaurantId);

                return Ok(new
                {
                    success = true,
                    message = "Menús obtenidos exitosamente.",
                    data = result
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
                        message = "Ocurrió un error inesperado.",
                        traceId
                    }
                });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Owner")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(
    Summary = "Actualizar menú",
    Description = "Permite actualizar la información de un menú existente."
)]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateMenuDto dto)
        {
            var traceId = $"00-update-menu-{Guid.NewGuid()}";

            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    error = new
                    {
                        code = "VALIDATION_ERROR",
                        message = "La solicitud contiene datos inválidos.",
                        traceId
                    }
                });
            }

            try
            {
                var result = await menuService.UpdateAsync(id, dto);

                if (result == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        error = new
                        {
                            code = "MENU_NOT_FOUND",
                            message = "No se encontró el menú solicitado.",
                            traceId
                        }
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Menú actualizado exitosamente.",
                    data = result
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
                        message = "Ocurrió un error inesperado.",
                        traceId
                    }
                });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Owner")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(
    Summary = "Eliminar menú",
    Description = "Permite eliminar un menú existente."
)]
        public async Task<IActionResult> Delete(int id)
        {
            var traceId = $"00-delete-menu-{Guid.NewGuid()}";

            try
            {
                var result = await menuService.DeleteAsync(id);

                if (!result)
                {
                    return NotFound(new
                    {
                        success = false,
                        error = new
                        {
                            code = "MENU_NOT_FOUND",
                            message = "No se encontró el menú solicitado.",
                            traceId
                        }
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Menú eliminado exitosamente."
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
                        message = "Ocurrió un error inesperado.",
                        traceId
                    }
                });
            }
        }

    }
}
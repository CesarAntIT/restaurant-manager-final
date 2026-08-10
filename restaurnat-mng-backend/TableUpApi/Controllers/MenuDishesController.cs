using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace WebApi.Controllers
{
    [SwaggerTag("Endpoints para la gestión de relación Menú-Platos")]
    [ApiController]
    [Route("api/menudishes")]
    [Authorize(Roles = "Admin,Owner")]
    public class MenuDishesController : ControllerBase
    {
        private readonly IMenuDishService menuDishService;

        public MenuDishesController(IMenuDishService menuDishService)
        {
            this.menuDishService = menuDishService;
        }

        [HttpPost("{menuId}/dishes/{dishId}")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [SwaggerOperation(
            Summary = "Agregar plato a un menú",
            Description = "Crea la relación entre un menú y un plato"
        )]
        public async Task<IActionResult> AddDishToMenu(int menuId, int dishId)
        {
            try
            {
                var result = await menuDishService.AddDishToMenuAsync(menuId, dishId);
                if (!result)
                    return BadRequest("No se pudo agregar el plato al menú.");

                return StatusCode(StatusCodes.Status201Created, new { success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    $"Error al agregar plato: {ex.Message}");
            }
        }

        [HttpDelete("{menuId}/dishes/{dishId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [SwaggerOperation(
            Summary = "Quitar plato de un menú",
            Description = "Elimina la relación entre un menú y un plato"
        )]
        public async Task<IActionResult> RemoveDishFromMenu(int menuId, int dishId)
        {
            try
            {
                var result = await menuDishService.RemoveDishFromMenuAsync(menuId, dishId);
                if (!result)
                    return NotFound("No se encontró la relación menú-plato.");

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    $"Error al quitar plato: {ex.Message}");
            }
        }

        [HttpGet("menu/{menuId}/dishes")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [SwaggerOperation(
            Summary = "Obtener platos de un menú",
            Description = "Devuelve el listado de platos asociados a un menú específico"
        )]
        public async Task<IActionResult> GetDishesByMenu(int menuId)
        {
            try
            {
                var dishes = await menuDishService.GetDishesByMenuAsync(menuId);
                if (dishes == null || !dishes.Any())
                    return NotFound("No se encontraron platos para este menú.");

                return Ok(new { success = true, data = dishes });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    $"Error al obtener platos: {ex.Message}");
            }
        }
    }
}

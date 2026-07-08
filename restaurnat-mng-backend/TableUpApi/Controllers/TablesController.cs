using Application.Dtos.Table;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [ApiController]
    [Route("api/restaurants/{restaurantId:int}/tables")]
    [Authorize]
    public class TablesController : ControllerBase
    {
        private readonly ITableService tableService;

        public TablesController(ITableService tableService)
        {
            this.tableService = tableService;
        }

        [HttpGet]
        public async Task<ActionResult<List<TableDto>>> GetByRestaurant(int restaurantId)
        {
            var tables = await tableService.GetByRestaurantIdAsync(restaurantId);
            return Ok(tables);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<TableDto>> GetById(int restaurantId, int id)
        {
            var table = await tableService.GetByIdAsync(id);
            if (table == null || table.RestaurantId != restaurantId)
                return NotFound();

            return Ok(table);
        }

        [HttpPost]
        public async Task<ActionResult<TableDto>> Create(int restaurantId, [FromBody] SaveTableDto dto)
        {
            var created = await tableService.CreateAsync(restaurantId, dto);
            if (created == null)
                return NotFound("El restaurante no existe.");

            return CreatedAtAction(nameof(GetById), new { restaurantId, id = created.Id }, created);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<TableDto>> Update(int restaurantId, int id, [FromBody] UpdateTableDto dto)
        {
            var updated = await tableService.UpdateAsync(restaurantId, id, dto);
            if (updated == null)
                return NotFound();

            return Ok(updated);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int restaurantId, int id)
        {
            var deleted = await tableService.DeleteAsync(restaurantId, id);
            if (!deleted)
                return NotFound();

            return NoContent();
        }
    }
}
using Application.Dtos.Dish;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [ApiController]
    [Route("api/restaurants/{restaurantId:int}/dishes")]
    [Authorize]
    public class DishesController : ControllerBase
    {
        private readonly IDishService dishService;

        public DishesController(IDishService dishService)
        {
            this.dishService = dishService;
        }

        [HttpGet]
        public async Task<ActionResult<List<DishDto>>> GetByRestaurant(int restaurantId)
        {
            var dishes = await dishService.GetByRestaurantIdAsync(restaurantId);
            return Ok(dishes);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<DishDto>> GetById(int restaurantId, int id)
        {
            var dish = await dishService.GetByIdAsync(id);
            if (dish == null || dish.RestaurantId != restaurantId)
                return NotFound();

            return Ok(dish);
        }

        [HttpPost]
        public async Task<ActionResult<DishDto>> Create(int restaurantId, [FromBody] SaveDishDto dto)
        {
            var (dish, error) = await dishService.CreateAsync(restaurantId, dto);
            if (dish == null)
                return BadRequest(error);

            return CreatedAtAction(nameof(GetById), new { restaurantId, id = dish.Id }, dish);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<DishDto>> Update(int restaurantId, int id, [FromBody] UpdateDishDto dto)
        {
            var (dish, error) = await dishService.UpdateAsync(restaurantId, id, dto);
            if (dish == null)
                return BadRequest(error);

            return Ok(dish);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int restaurantId, int id)
        {
            var deleted = await dishService.DeleteAsync(restaurantId, id);
            if (!deleted)
                return NotFound();

            return NoContent();
        }
    }
}
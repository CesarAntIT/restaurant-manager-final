using Application.Dtos.Ingredient;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [ApiController]
    [Route("api/restaurants/{restaurantId:int}/ingredients")]
    [Authorize]
    public class IngredientsController : ControllerBase
    {
        private readonly IIngredientService ingredientService;

        public IngredientsController(IIngredientService ingredientService)
        {
            this.ingredientService = ingredientService;
        }

        [HttpGet]
        public async Task<ActionResult<List<IngredientDto>>> GetByRestaurant(int restaurantId)
        {
            var ingredients = await ingredientService.GetByRestaurantIdAsync(restaurantId);
            return Ok(ingredients);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<IngredientDto>> GetById(int restaurantId, int id)
        {
            var ingredient = await ingredientService.GetByIdAsync(id);
            if (ingredient == null || ingredient.RestaurantId != restaurantId)
                return NotFound();

            return Ok(ingredient);
        }

        [HttpPost]
        public async Task<ActionResult<IngredientDto>> Create(int restaurantId, [FromBody] SaveIngredientDto dto)
        {
            var created = await ingredientService.CreateAsync(restaurantId, dto);
            if (created == null)
                return NotFound("El restaurante no existe.");

            return CreatedAtAction(nameof(GetById), new { restaurantId, id = created.Id }, created);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<IngredientDto>> Update(int restaurantId, int id, [FromBody] UpdateIngredientDto dto)
        {
            var updated = await ingredientService.UpdateAsync(restaurantId, id, dto);
            if (updated == null)
                return NotFound();

            return Ok(updated);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int restaurantId, int id)
        {
            var deleted = await ingredientService.DeleteAsync(restaurantId, id);
            if (!deleted)
                return NotFound();

            return NoContent();
        }
    }
}
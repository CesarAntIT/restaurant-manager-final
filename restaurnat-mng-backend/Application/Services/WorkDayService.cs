using Application.Interfaces;
using Domain.Common.Enums;
using Domain.Entities;
using Domain.Interfaces;


namespace Application.Services
{

    public class WorkDayService : IWorkDayService
    {
        private readonly IWorkDayRepository _workDayRepository;
        private readonly IWorkDayItemRepository _workDayItemRepository;
        private readonly IDishIngredientRepository _dishRepository;
        private readonly IIngredientRepository _ingredientRepository;
        public WorkDayService(
            IWorkDayRepository workDayRepository,
            IWorkDayItemRepository workDayItemRepository,
            IDishIngredientRepository dishRepository,
            IIngredientRepository ingredientRepository)
        {
            _workDayRepository = workDayRepository;
            _workDayItemRepository = workDayItemRepository;
            _dishRepository = dishRepository;
            _ingredientRepository = ingredientRepository;
        }

        public async Task<bool> OpenWorkDayAsync(int restaurantId)
        {
            var activeWorkDay =
                await _workDayRepository.GetActiveWorkDayAsync(restaurantId);

            if (activeWorkDay != null)
                return false;

            var workDay = new WorkDay
            {
                Id = 0,
                RestaurantId = restaurantId,
                TimeOpen = DateTime.UtcNow,
                TimeClose = null,
                Status = WorkDayStatus.Open
            };

            var result = await _workDayRepository.AddAsync(workDay);

            return result != null;
        }
        public async Task<bool> RegisterDishSaleAsync(int dishId, int quantity)
        {
            if (quantity <= 0) return false;

            var dish = await _dishRepository.GetByIdAsync(dishId);
            if (dish == null) return false;

            var activeWorkDay = await _workDayRepository.GetActiveWorkDayAsync(dish.RestaurantId);
            if (activeWorkDay == null) return false;

            foreach (var di in dish.DishIngredients)
            {
                var ingredient = await _ingredientRepository.GetByIdAsync(di.IngredientId);
                if (ingredient == null) continue;

                if (ingredient.Quantity < di.QuantityNeeded * quantity)
                    return false;
            }

            foreach (var di in dish.DishIngredients)
            {
                var ingredient = await _ingredientRepository.GetByIdAsync(di.IngredientId);
                if (ingredient == null) continue;

                ingredient.Quantity -= di.QuantityNeeded * quantity;
                await _ingredientRepository.UpdateIngredientAsync(ingredient.Id, ingredient);
            }

            var workDayItem = new WorkDayItem
            {
                Id = 0,
                WorkDayId = activeWorkDay.Id,
                DishId = dishId,
                QuantitySold = quantity,
                PriceUnit = dish.Price
            };

            var saved = await _workDayItemRepository.AddAsync(workDayItem);
            return saved != null;
        }

        public async Task<bool> CloseWorkDayAsync(int restaurantId)
        {
            var activeWorkDay =
                await _workDayRepository.GetActiveWorkDayAsync(restaurantId);

            if (activeWorkDay == null)
                return false;

            activeWorkDay.Status = WorkDayStatus.Closed;
            activeWorkDay.TimeClose = DateTime.UtcNow;

            await _workDayRepository.UpdateAsync(activeWorkDay.Id, activeWorkDay);

            return true;
        }

        public async Task<List<WorkDay>> GetWorkDayHistoryAsync(int restaurantId)
        {
            return await _workDayRepository.GetByRestaurantIdAsync(restaurantId);
        }

        public async Task<WorkDay?> GetActiveWorkDayAsync(int restaurantId)
        {
            return await _workDayRepository.GetActiveWorkDayAsync(restaurantId);
        }
    }

}

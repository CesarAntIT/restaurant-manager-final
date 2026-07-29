using Application.Dtos.Review;
using Application.Interfaces;
using Domain.Common.Enums;
using Domain.Entities;
using Domain.Interfaces;


namespace Application.Services
{

    public class WorkDayService : IWorkDayService
    {
        private readonly IWorkDayRepository _workDayRepository;

        public WorkDayService(IWorkDayRepository workDayRepository)
        {
            _workDayRepository = workDayRepository;
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
    }

}

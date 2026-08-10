using Application.Dtos.Sales;
using Application.Interfaces;
using Domain.Entities;
using Domain.Interfaces;

namespace Application.Services
{
    public class SalesService : ISalesService
    {
        private readonly IWorkDayRepository workDayRepository;

        public SalesService(IWorkDayRepository workDayRepository)
        {
            this.workDayRepository = workDayRepository;
        }

        public async Task<DailySalesSummaryDto?> GetDailySummaryAsync(int restaurantId, DateTime date)
        {
            var from = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
            var to = from.AddDays(1);

            var workDays = await workDayRepository.GetByRestaurantAndDateRangeAsync(restaurantId, from, to);
            var workDay = workDays.FirstOrDefault();
            return workDay == null ? null : MapToDailyDto(workDay);
        }

        public async Task<HistoricalSalesSummaryDto> GetHistoricalSummaryAsync(int restaurantId, DateTime from, DateTime to)
        {
            var fromUtc = DateTime.SpecifyKind(from.Date, DateTimeKind.Utc);
            var toUtc = DateTime.SpecifyKind(to.Date, DateTimeKind.Utc).AddDays(1);

            var workDays = await workDayRepository.GetByRestaurantAndDateRangeAsync(restaurantId, fromUtc, toUtc);
            var dailySummaries = workDays.Select(MapToDailyDto).ToList();
            var allItems = workDays.SelectMany(w => w.WorkDayItems).ToList();

            var topDishes = allItems
                .GroupBy(i => new { i.DishId, DishName = i.Dish?.Name ?? "Desconocido" })
                .Select(g => new DishSalesItemDto
                {
                    DishId = g.Key.DishId,
                    DishName = g.Key.DishName,
                    QuantitySold = g.Sum(i => i.QuantitySold),
                    Revenue = g.Sum(i => i.Total)
                })
                .OrderByDescending(d => d.Revenue)
                .Take(10)
                .ToList();

            var totalRevenue = dailySummaries.Sum(d => d.TotalRevenue);

            return new HistoricalSalesSummaryDto
            {
                RestaurantId = restaurantId,
                From = fromUtc,
                To = toUtc.AddDays(-1),
                TotalRevenue = totalRevenue,
                TotalItemsSold = dailySummaries.Sum(d => d.TotalItemsSold),
                WorkDaysCount = dailySummaries.Count,
                AverageRevenuePerDay = dailySummaries.Count > 0 ? Math.Round(totalRevenue / dailySummaries.Count, 2) : 0,
                DailyBreakdown = dailySummaries,
                TopDishes = topDishes
            };
        }

        private static DailySalesSummaryDto MapToDailyDto(WorkDay w)
        {
            var dishGroups = w.WorkDayItems
                .GroupBy(i => new { i.DishId, DishName = i.Dish?.Name ?? "Desconocido" })
                .Select(g => new DishSalesItemDto
                {
                    DishId = g.Key.DishId,
                    DishName = g.Key.DishName,
                    QuantitySold = g.Sum(i => i.QuantitySold),
                    Revenue = g.Sum(i => i.Total)
                })
                .OrderByDescending(d => d.Revenue)
                .ToList();

            return new DailySalesSummaryDto
            {
                WorkDayId = w.Id,
                RestaurantId = w.RestaurantId,
                Date = w.TimeOpen,
                TimeClose = w.TimeClose,
                TotalRevenue = dishGroups.Sum(d => d.Revenue),
                TotalItemsSold = dishGroups.Sum(d => d.QuantitySold),
                Dishes = dishGroups
            };
        }
    }
}
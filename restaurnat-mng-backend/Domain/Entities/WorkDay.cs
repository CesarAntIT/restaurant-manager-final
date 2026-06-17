using Domain.Common.Enums;

namespace Domain.Entities
{
    public class WorkDay
    {
        public required int Id { get; set; }
        public required int RestaurantId { get; set; } // FK
        public required DateTime TimeOpen { get; set; }
        public DateTime? TimeClose { get; set; }
        public WorkDayStatus Status { get; set; } = WorkDayStatus.Open;

        // nav property
        public ICollection<WorkDayItem> WorkDayItems { get; set; } = new List<WorkDayItem>();

        public Restaurant? Restaurant { get; set; }
    }
}
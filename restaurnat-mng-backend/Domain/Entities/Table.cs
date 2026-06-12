using Domain.Common.Enums;

namespace Domain.Entities
{
    public class Table
    {
        public required int Id { get; set; }
        public required int RestaurantId { get; set; } // FK
        public required string NumberMesa { get; set; }
        public required int Seats { get; set; }
        public TableStatus Status { get; set; } 
    }
}

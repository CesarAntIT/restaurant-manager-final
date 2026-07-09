using Domain.Common.Enums;

namespace Application.Dtos.Table
{
    public class TableDto
    {
        public int Id { get; set; }
        public int RestaurantId { get; set; }
        public string NumberMesa { get; set; }
        public int Seats { get; set; }
        public TableStatus Status { get; set; }
    }
}
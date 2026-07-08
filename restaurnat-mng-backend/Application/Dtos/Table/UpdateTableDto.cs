using Domain.Common.Enums;

namespace Application.Dtos.Table
{
    public class UpdateTableDto
    {
        public required string NumberMesa { get; set; }
        public required int Seats { get; set; }
        public TableStatus Status { get; set; }
    }
}
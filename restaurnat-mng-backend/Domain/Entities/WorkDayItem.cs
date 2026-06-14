namespace Domain.Entities
{
    public class WorkDayItem
    {
        public required int Id { get; set; }
        public required int WorkDayId { get; set; } // FK
        public required int MenuId { get; set; } // FK
        public required int QuantitySold { get; set; }
        public required decimal PriceUnit { get; set; }
        public decimal Total => QuantitySold * PriceUnit;
    }
}
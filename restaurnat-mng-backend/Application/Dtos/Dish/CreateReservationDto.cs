namespace Application.Dtos.Dish
{
    public class CreateReservationDto
    {
        public int TableId { get; set; }
        public DateTime DateTimeReservation { get; set; }
        public int PeopleCount { get; set; }
        public List<int> DishIds { get; set; } = new();
    }
}
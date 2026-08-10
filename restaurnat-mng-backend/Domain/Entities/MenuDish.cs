namespace Domain.Entities
{
    public class MenuDish
    {
        public required int MenuId { get; set; }

        public required int DishId { get; set; }

        public Menu? Menu { get; set; }
        public Dish? Dish { get; set; }
    }
}

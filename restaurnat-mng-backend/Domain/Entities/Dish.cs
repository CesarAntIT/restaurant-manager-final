using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class Dish
    {
        public required int Id { get; set; }

        public required int RestaurantId { get; set; }

        public string Name { get; set; }

        public string Description { get; set; }

        public decimal Price { get; set; }

        public ICollection<DishIngredient> DishIngredients { get; set; } = new List<DishIngredient>();

        public ICollection<MenuDish> MenuDishes { get; set; } = new List<MenuDish>();

    }
}

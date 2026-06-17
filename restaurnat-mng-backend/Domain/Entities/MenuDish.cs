using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class RestaurantImage
    {
        public int Id { get; set; }

        public int RestaurantId { get; set; }

        public string Url { get; set; }

        public Restaurant Restaurant { get; set; }

    }
}

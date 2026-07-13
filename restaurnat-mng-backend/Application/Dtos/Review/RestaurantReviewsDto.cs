using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Dtos.Review
{
    public class RestaurantReviewsDto
    {
        public int RestaurantId { get; set; }

        public string RestaurantName { get; set; } = string.Empty;

        public decimal AverageRating { get; set; }

        public int TotalReviews { get; set; }

        public List<ReviewItemDto> Reviews { get; set; } = new();
    }

}

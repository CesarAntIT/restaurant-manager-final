using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Dtos.Review
{
    public class CreateReviewDto
    {
        [Required(ErrorMessage = "El restaurante es requerido.")]
        public int RestaurantId { get; set; }

        [Required(ErrorMessage = "La calificación es requerida.")]
        [Range(1, 5, ErrorMessage = "La calificación debe estar entre 1 y 5 estrellas.")]
        public int Rating { get; set; }

        [MaxLength(500, ErrorMessage = "El comentario no puede exceder los 500 caracteres.")]
        public string? Comment { get; set; }
    }
}

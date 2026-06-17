using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Persistence.EntityConfigurations
{
    public class MenuDishEntityConfiguration : IEntityTypeConfiguration<MenuDish>
    {
        public void Configure(EntityTypeBuilder<MenuDish> builder)
        {
            builder.ToTable("MenuDishes");

            // Llave primaria compuesta
            builder.HasKey(di => new { di.DishId, di.MenuId });

            builder.HasOne(di => di.Dish)
                   .WithMany(d => d.MenuDishes)
                   .HasForeignKey(di => di.DishId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(di => di.Menu)
                   .WithMany(d => d.MenuDishes)
                   .HasForeignKey(di => di.MenuId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}

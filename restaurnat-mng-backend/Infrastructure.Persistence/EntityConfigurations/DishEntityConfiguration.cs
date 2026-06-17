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
    public class DishEntityConfiguration : IEntityTypeConfiguration<Dish>
    {
        public void Configure(EntityTypeBuilder<Dish> builder)
        {
            builder.ToTable("Dishes");
            builder.HasKey(d => d.Id);
            builder.HasIndex(d => d.Name);
            builder.HasIndex(d => new { d.RestaurantId, d.Name })
    .IsUnique();

            builder.Property(d => d.Name)
                .HasMaxLength(120)
                .IsRequired();

            builder.Property(d => d.Description)
                .HasMaxLength(500);

            builder.Property(d => d.Price)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            builder.Property(d => d.RestaurantId)
                .IsRequired();

        }
    }
}

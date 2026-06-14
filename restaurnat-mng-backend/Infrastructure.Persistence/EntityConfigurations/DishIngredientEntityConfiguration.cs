using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.EntityConfigurations
{
    public class DishIngredientEntityConfiguration : IEntityTypeConfiguration<DishIngredient>
    {
        public void Configure(EntityTypeBuilder<DishIngredient> builder)
        {
            builder.ToTable("DishIngredients");

            // Llave primaria compuesta
            builder.HasKey(di => new { di.MenuId, di.IngredientId });

            builder.Property(di => di.QuantityNeeded).HasColumnType("numeric(10,2)").IsRequired();

            builder.HasOne(di => di.Menu)
                   .WithMany()
                   .HasForeignKey(di => di.MenuId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(di => di.Ingredient)
                   .WithMany()
                   .HasForeignKey(di => di.IngredientId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
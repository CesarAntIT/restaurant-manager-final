using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.EntityConfigurations
{
    public class IngredientEntityConfiguration : IEntityTypeConfiguration<Ingredient>
    {
        public void Configure(EntityTypeBuilder<Ingredient> builder)
        {
            builder.ToTable("Ingredients");
            builder.HasKey(i => i.Id);
            builder.HasIndex(i => i.Name);
            builder.HasIndex(i => new { i.RestaurantId, i.Name }).IsUnique();

            builder.Property(i => i.Name).HasMaxLength(120).IsRequired();
            builder.Property(i => i.InitialQuantity).HasColumnType("numeric(10,2)").IsRequired();
            builder.Property(i => i.Quantity).HasColumnType("numeric(10,2)").IsRequired();
            builder.Property(i => i.StockMinimo).HasColumnType("numeric(10,2)").IsRequired();
            builder.Property(i => i.Cost).HasColumnType("decimal(10,2)").IsRequired();
            builder.Property(i => i.WeightUnit).HasMaxLength(20).IsRequired();

            builder.HasOne(i => i.Restaurant)
                   .WithMany(r => r.Ingredients)
                   .HasForeignKey(i => i.RestaurantId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
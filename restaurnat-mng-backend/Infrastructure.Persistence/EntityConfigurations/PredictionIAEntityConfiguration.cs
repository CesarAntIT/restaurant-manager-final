using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.EntityConfigurations
{
    public class PredictionIAEntityConfiguration : IEntityTypeConfiguration<PredictionIA>
    {
        public void Configure(EntityTypeBuilder<PredictionIA> builder)
        {
            builder.ToTable("PredictionsIA");
            builder.HasKey(p => p.Id);

            builder.Property(p => p.PredictionDate).IsRequired();
            builder.Property(p => p.EstimatedDemand).IsRequired();
            builder.Property(p => p.StockRecommendation).HasColumnType("text");
            builder.Property(p => p.CreatedAt).IsRequired();

            builder.HasOne<Restaurant>()
                   .WithMany()
                   .HasForeignKey(p => p.RestaurantId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne<Menu>()
                   .WithMany()
                   .HasForeignKey(p => p.MenuId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
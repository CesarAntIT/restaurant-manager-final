using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.EntityConfigurations
{
    public class ReviewEntityConfiguration : IEntityTypeConfiguration<Review>
    {
        public void Configure(EntityTypeBuilder<Review> builder)
        {
            builder.ToTable("Reviews");
            builder.HasKey(r => r.Id);

            builder.Property(r => r.UserId).HasMaxLength(450).IsRequired();
            builder.Property(r => r.Rating).IsRequired();
            builder.Property(r => r.Comment).HasMaxLength(1000);

            builder.Property(r => r.Status)
                .HasConversion<string>()
                .HasMaxLength(30)
                .IsRequired();

            builder.HasOne<Restaurant>()
                   .WithMany()
                   .HasForeignKey(r => r.RestaurantId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
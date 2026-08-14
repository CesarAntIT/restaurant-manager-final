using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.EntityConfigurations
{
    public class WorkDayEntityConfiguration : IEntityTypeConfiguration<WorkDay>
    {
        public void Configure(EntityTypeBuilder<WorkDay> builder)
        {
            builder.ToTable("WorkDays");
            builder.HasKey(w => w.Id);

            builder.Property(w => w.TimeOpen).IsRequired();
            builder.Property(w => w.TimeClose);

            builder.Property(w => w.Status)
                .HasConversion<string>()
                .HasMaxLength(30)
                .IsRequired();

            builder.HasOne(w=> w.Restaurant)
                   .WithMany(rest => rest.WorkDays)
                   .HasForeignKey(w => w.RestaurantId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(w => w.WorkDayItems)
                    .WithOne(wi => wi.WorkDay)
                    .HasForeignKey(wi => wi.WorkDayId)
                    .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
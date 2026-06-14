using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.EntityConfigurations
{
    public class WorkDayItemEntityConfiguration : IEntityTypeConfiguration<WorkDayItem>
    {
        public void Configure(EntityTypeBuilder<WorkDayItem> builder)
        {
            builder.ToTable("WorkDayItems");
            builder.HasKey(wi => wi.Id);

            builder.Property(wi => wi.QuantitySold).IsRequired();
            builder.Property(wi => wi.PriceUnit).HasColumnType("decimal(10,2)").IsRequired();

            builder.HasOne<Menu>()
                   .WithMany()
                   .HasForeignKey(wi => wi.MenuId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
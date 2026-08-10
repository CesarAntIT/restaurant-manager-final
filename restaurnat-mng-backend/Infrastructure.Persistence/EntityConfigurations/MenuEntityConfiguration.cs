using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.EntityConfigurations
{
    public class MenuEntityConfiguration : IEntityTypeConfiguration<Menu>
    {
        public void Configure(EntityTypeBuilder<Menu> builder)
        {
            builder.ToTable("Menus");
            builder.HasKey(m => m.Id);

            builder.Property(m => m.Name).HasMaxLength(150).IsRequired();

            builder.Property(m => m.Description)
       .HasMaxLength(500);

         builder.Property(m => m.Status)
       .IsRequired();

            builder.HasOne(m => m.Restaurant)
                   .WithMany(r => r.Menus)
                   .HasForeignKey(m => m.RestaurantId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}

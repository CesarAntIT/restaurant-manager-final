using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.EntityConfigurations
{
    public class RestaurantEntityConfiguration : IEntityTypeConfiguration<Restaurant>
    {
        public void Configure(EntityTypeBuilder<Restaurant> builder)
        {
            builder.ToTable("Restaurants");
            builder.HasKey(r => r.Id);
            builder.HasIndex(r => r.OwnerId);
            builder.HasIndex(r => r.Category);
            builder.HasIndex(d => d.Name);

            builder.Property(r => r.Name).HasMaxLength(150).IsRequired();
            builder.Property(r => r.Category).HasMaxLength(100).IsRequired();
            builder.Property(r => r.Address).HasMaxLength(250).IsRequired();
            builder.Property(r => r.PhoneNumber).HasMaxLength(20);

            builder.HasMany(r => r.Tables)
                   .WithOne(t => t.Restaurant)
                   .HasForeignKey(t => t.RestaurantId);

            builder.HasMany(r => r.Menus)
                   .WithOne(m  => m.Restaurant)
                   .HasForeignKey(m => m.RestaurantId);

            builder.HasMany(r => r.Ingredients)
                   .WithOne(i => i.Restaurant)
                   .HasForeignKey(m => m.RestaurantId);

            builder.HasMany(r => r.Reviews)
                   .WithOne(r => r.Restaurant)
                   .HasForeignKey(m => m.RestaurantId);


            builder.HasMany(r => r.WorkDays)
                   .WithOne(w => w.Restaurant)
                   .HasForeignKey(m => m.RestaurantId);
        }
    }
}

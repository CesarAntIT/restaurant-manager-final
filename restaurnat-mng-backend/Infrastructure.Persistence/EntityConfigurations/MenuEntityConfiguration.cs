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
            builder.Property(m => m.Price).HasColumnType("decimal(10,2)").IsRequired();
        }
    }
}

using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System.Reflection.Emit;

namespace Infrastructure.Persistence.EntityConfigurations
{
    public class TableEntityConfiguration : IEntityTypeConfiguration<Table>
    {
        public void Configure(EntityTypeBuilder<Table> builder)
        {
            builder.ToTable("Tables");
            builder.HasKey(t => t.Id);

            builder.Property(t => t.NumberMesa).HasMaxLength(50).IsRequired();
            builder.Property(t => t.Seats).IsRequired();
        }
    }
}

using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.EntityConfigurations
{
    public class ReservationEntityConfiguration : IEntityTypeConfiguration<Reservation>
    {
        public void Configure(EntityTypeBuilder<Reservation> builder)
        {
            builder.ToTable("Reservations");
            builder.HasKey(r => r.Id);

            builder.Property(r => r.UserId).HasMaxLength(450).IsRequired();
            builder.Property(r => r.DateTimeReservation).IsRequired();
            builder.Property(r => r.PeopleCount).IsRequired();

            builder.Property(r => r.Status)
                .HasConversion<string>()
                .HasMaxLength(30)
                .IsRequired();

            builder.HasOne(r => r.Table)
                    .WithMany()
                    .HasForeignKey(r => r.TableId)
                    .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
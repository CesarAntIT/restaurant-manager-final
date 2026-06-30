using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Persistence.EntityConfigurations
{
    public class RestaurantImageEntityConfiguration : IEntityTypeConfiguration<RestaurantImage>
    {
        public void Configure(EntityTypeBuilder<RestaurantImage> builder)
        {
            builder.ToTable("RestaurantImages");
            builder.HasKey(ri => ri.Id);

            builder.HasOne(ri => ri.Restaurant)
                .WithMany(re => re.RestaurantImages)
                .HasForeignKey(ri => ri.RestaurantId);

            
        }
    }
}

//using Application.Interfaces;
using Domain.Interfaces;
using Infrastructure.Persistence.Contexts;
using Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Persistence
{
    public static class ServicesRegistration
    {
        public static void PersistenceLayerIoc(this IServiceCollection services, IConfiguration config)
        {
                var connectionString = config.GetConnectionString("DefaultConnection");
                services.AddDbContext<TableUpContextDB>(
                  (serviceProvider, opt) =>
                  {
                      opt.EnableSensitiveDataLogging();
                      opt.UseNpgsql(connectionString,
                      m => m.MigrationsAssembly(typeof(TableUpContextDB).Assembly.FullName));
                  },
                    contextLifetime: ServiceLifetime.Scoped,
                    optionsLifetime: ServiceLifetime.Scoped
                 );

            //Repositories IOC
            services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
            services.AddScoped<IDishIngredientRepository, DishIngredientRepository>();
            services.AddScoped<IIngredientRepository, IngredientRepository>();
            services.AddScoped<IMenuRepository, MenuRepository>();
            services.AddScoped<IPredictionIARepository, PredictionIARepository>();
            services.AddScoped<IReservationRepository, ReservationRepository>();
            services.AddScoped<IRestaurantRepository, RestaurantRepository>();
            services.AddScoped<IReviewRepository, ReviewRepository>();
            services.AddScoped<ITableRepository, TableRepository>();
            services.AddScoped<IWorkDayItemRepository, WorkDayItemRepository>();
            services.AddScoped<IWorkDayRepository, WorkDayRepository>();

        }
        }
    }

using System.Reflection;
using Application.Interfaces;
using Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Application
{
    public static class ServicesRegistration
    {
        //Extension method - Decorator pattern
        public static void ApplicationLayerIoc(this IServiceCollection services)
        {
            //configurations
            services.AddAutoMapper(cfg => { }, Assembly.GetExecutingAssembly());

            //services ioc
            services.AddScoped<IRestaurantService, RestaurantService>();
            services.AddScoped<IImageService, ImageService>();
            services.AddScoped<IReviewService, ReviewService>();
            services.AddScoped<IWorkDayService, WorkDayService>();
            services.AddScoped<IMenuService, MenuService>();
            services.AddScoped<IMenuDishService, MenuDishService>();

        }

    }
}

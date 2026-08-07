using System.Text.Json.Serialization;
using Application;
using Application.Interfaces;
using Application.Services;
using Domain.Interfaces;
using Infrastructure.Identity;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Repositories;
using Infrastructure.Shared;
using restaurnat_mng_backend.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddRouting(options =>
{
    options.LowercaseUrls = true;
});

builder.Services.PersistenceLayerIoc(builder.Configuration);
builder.Services.ApplicationLayerIoc();
builder.Services.SharedLayerIoc(builder.Configuration);
builder.Services.AddIdentityLayerIocForWebApi(builder.Configuration);

builder.Services.AddEndpointsApiExplorer();
builder.Services.SwaggerExtension();
builder.Services.AddHealthChecks();
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession();
builder.Services.AddProblemDetails();
builder.Services.AddScoped<ITableRepository, TableRepository>();
builder.Services.AddScoped<ITableService, TableService>();
builder.Services.AddScoped<IReservationRepository, ReservationRepository>();
builder.Services.AddScoped<IReservationService, ReservationService>();
builder.Services.AddScoped<IIngredientRepository, IngredientRepository>();
builder.Services.AddScoped<IIngredientService, IngredientService>();
builder.Services.AddScoped<IDishIngredientRepository, DishIngredientRepository>();
builder.Services.AddScoped<IDishService, DishService>();
builder.Services.AddScoped<ISalesService, SalesService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

await app.Services.RunIdentitySeedAsync();

app.UseExceptionHandler();

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

app.UseRouting();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.UseHealthChecks("/health");
app.MapControllers();

app.UseStaticFiles();

await app.RunAsync();
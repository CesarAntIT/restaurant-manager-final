using Application;
using Infrastructure.Identity;
using Infrastructure.Persistence;
using Infrastructure.Shared;
using restaurnat_mng_backend.Extensions;
using System.Text.Json.Serialization;

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


var app = builder.Build();
await app.Services.RunIdentitySeedAsync();

app.UseExceptionHandler();

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.UseHealthChecks("/health");
app.MapControllers();

await app.RunAsync();
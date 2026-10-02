using Ecommerce.Modules.Identity.Presentation;
using Ecommerce.Modules.Catalog.Presentation;
using Ecommerce.Modules.Inventory.Presentation;
using Ecommerce.Modules.Cart.Presentation;
using Ecommerce.Modules.Orders.Presentation;
using Ecommerce.Modules.Checkout.Presentation;
using Ecommerce.Modules.Payments.Presentation;
using Microsoft.AspNetCore.Authentication.Negotiate;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddIdentityPresentation()
    .AddCatalogPresentation()
    .AddInventoryPresentation()
    .AddCartPresentation()
    .AddOrdersPresentation()
    .AddCheckoutPresentation()
    .AddPaymentsPresentation();
builder.Services.AddOpenApi();

builder.Services.AddAuthentication(NegotiateDefaults.AuthenticationScheme)
   .AddNegotiate();

builder.Services.AddAuthorization(options =>
{
    // By default, all incoming requests will be authorized according to the default policy.
    options.FallbackPolicy = options.DefaultPolicy;
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();

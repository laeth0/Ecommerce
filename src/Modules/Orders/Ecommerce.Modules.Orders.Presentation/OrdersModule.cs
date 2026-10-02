using Microsoft.Extensions.DependencyInjection;

namespace Ecommerce.Modules.Orders.Presentation;

public static class OrdersModule
{
    public static IMvcBuilder AddOrdersPresentation(this IMvcBuilder builder)
    {
        return builder.AddApplicationPart(typeof(OrdersModule).Assembly);
    }
}

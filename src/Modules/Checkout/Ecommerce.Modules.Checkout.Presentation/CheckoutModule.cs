using Microsoft.Extensions.DependencyInjection;

namespace Ecommerce.Modules.Checkout.Presentation;

public static class CheckoutModule
{
    public static IMvcBuilder AddCheckoutPresentation(this IMvcBuilder builder)
    {
        return builder.AddApplicationPart(typeof(CheckoutModule).Assembly);
    }
}

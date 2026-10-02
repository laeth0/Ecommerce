using Microsoft.Extensions.DependencyInjection;

namespace Ecommerce.Modules.Cart.Presentation;

public static class CartModule
{
    public static IMvcBuilder AddCartPresentation(this IMvcBuilder builder)
    {
        return builder.AddApplicationPart(typeof(CartModule).Assembly);
    }
}

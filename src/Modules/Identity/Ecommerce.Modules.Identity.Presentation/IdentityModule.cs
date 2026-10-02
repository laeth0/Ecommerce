using Microsoft.Extensions.DependencyInjection;

namespace Ecommerce.Modules.Identity.Presentation;

public static class IdentityModule
{
    public static IMvcBuilder AddIdentityPresentation(this IMvcBuilder builder)
    {
        return builder.AddApplicationPart(typeof(IdentityModule).Assembly);
    }
}

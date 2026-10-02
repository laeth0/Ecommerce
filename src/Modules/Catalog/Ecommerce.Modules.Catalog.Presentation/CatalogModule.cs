using Microsoft.Extensions.DependencyInjection;

namespace Ecommerce.Modules.Catalog.Presentation;

public static class CatalogModule
{
    public static IMvcBuilder AddCatalogPresentation(this IMvcBuilder builder)
    {
        return builder.AddApplicationPart(typeof(CatalogModule).Assembly);
    }
}

using Microsoft.Extensions.DependencyInjection;

namespace Ecommerce.Modules.Inventory.Presentation;

public static class InventoryModule
{
    public static IMvcBuilder AddInventoryPresentation(this IMvcBuilder builder)
    {
        return builder.AddApplicationPart(typeof(InventoryModule).Assembly);
    }
}

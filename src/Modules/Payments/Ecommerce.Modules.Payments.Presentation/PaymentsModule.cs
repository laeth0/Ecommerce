using Microsoft.Extensions.DependencyInjection;

namespace Ecommerce.Modules.Payments.Presentation;

public static class PaymentsModule
{
    public static IMvcBuilder AddPaymentsPresentation(this IMvcBuilder builder)
    {
        return builder.AddApplicationPart(typeof(PaymentsModule).Assembly);
    }
}

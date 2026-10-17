using WhitePlate.Application.Tenants;

namespace WhitePlate.Tests.Application;

public sealed class OrderEmailTemplateTests
{
    [Fact]
    public void FrenchBuiltInTemplatesUsePickupAndTrackingPlaceholders()
    {
        var template = OrderEmailTemplateRules.Default("fr", "order.created");

        Assert.Contains("{{pickupTime}}", template.Body);
        Assert.Contains("{{pickupInstructions}}", template.Body);
        Assert.Contains("{{trackingUrl}}", template.Body);
    }

    [Fact]
    public void TemplateRulesRejectMarkupAndUnknownPlaceholders()
    {
        var template = new OrderEmailLocaleTemplatesDto("en",
            new("Order received", "Thanks", "Order {{orderNumber}} received"),
            new("Preparing", "In progress", "We are preparing this order"),
            new("Ready", "Collect your order", "<img src=x> {{unknownValue}}"));

        Assert.False(OrderEmailTemplateRules.IsValid(template));
    }

    [Fact]
    public void TemplateRulesAcceptTheSupportedPlaceholderSet()
    {
        var template = new OrderEmailLocaleTemplatesDto("en",
            new("Order {{orderNumber}} received", "Thanks, {{customerName}}", "{{orderSummary}}"),
            new("Preparing", "{{restaurantName}}", "Pickup: {{pickupTime}} {{pickupInstructions}}"),
            new("Ready", "Collect your order", "Track: {{trackingUrl}}"));

        Assert.True(OrderEmailTemplateRules.IsValid(template));
    }
}

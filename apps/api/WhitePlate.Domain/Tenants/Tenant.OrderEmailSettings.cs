namespace WhitePlate.Domain.Tenants;

public sealed partial class Tenant
{
    public string OrderEmailTemplatesJson { get; private set; } = "{}";
    public int OrderEmailTemplatesVersion { get; private set; } = 1;

    public void SetOrderEmailTemplates(string templatesJson)
    {
        if (OrderEmailTemplatesVersion == int.MaxValue)
            throw new WhitePlate.Domain.Common.DomainRuleException("invalid_email_templates", "version",
                "The email template version is invalid.");
        OrderEmailTemplatesJson = templatesJson;
        OrderEmailTemplatesVersion++;
    }
}

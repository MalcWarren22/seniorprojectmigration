resource "azurerm_api_management" "this" {
  name = "funcapim-${var.project_name}-${var.environment}"
  resource_group_name = var.resource_group_name
  location = var.location
  sku_name = var.apim_sku_name
  publisher_name = var.publisher_name
  publisher_email = var.publisher_email
}
resource "azurerm_api_management_api" "this" {
  name = "fapim-${var.project_name}-${var.environment}"
  resource_group_name = var.resource_group_name
  api_management_name = azurerm_api_management.this.name
 
  revision = "1"
  display_name = var.api_display_name
  path = var.api_path
  protocols = ["https"]

  service_url = var.backend_url
}
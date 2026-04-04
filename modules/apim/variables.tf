variable "location" {
  description = "The Location of the resource group"
  type        = string
}

variable "project_name" {
  description = "Name of the Project"
  type        = string
}

variable "environment" {
  description = "The Type of environment"
  type        = string
}

variable "resource_group_name" {
  description = "The Name of the resource group"
  type        = string
}

variable "apim_sku_name" {
  description = "The Subscription of APIM"
  type = string
}

variable "publisher_name" {
  description = "Name of the APIM publisher"
  type = string
}

variable "publisher_email" {
  description = "Email of the APIM publisher"
  type = string
}

variable "api_display_name" {
  description = "Display name of the API"
  type = string
}

variable "api_path" {
  description = "Path for the APIM route"
  type = string
}

variable "backend_url" {
  description = "Backend url for the Function App"
  type = string
}
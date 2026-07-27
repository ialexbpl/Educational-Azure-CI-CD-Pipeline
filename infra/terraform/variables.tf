variable "subscription_id" {
  type        = string
  description = "Azure for Students subscription ID"
}

variable "location" {
  type        = string
  description = "Azure region"
  default     = "polandcentral"
}

variable "resource_group_name" {
  type    = string
  default = "rg-statmaster"
}

variable "acr_name" {
  type        = string
  description = "Globally unique ACR name (alphanumeric only)"
  default     = "statmasteracrab"
}

variable "aks_name" {
  type    = string
  default = "aks-statmaster"
}

variable "dns_prefix" {
  type    = string
  default = "aks-statmaster-dns"
}

variable "kubernetes_version" {
  type        = string
  description = "Set null to use AKS default"
  default     = null
  nullable    = true
}

variable "node_vm_size" {
  type    = string
  default = "Standard_B2als_v2"
}

variable "node_count" {
  type    = number
  default = 1
}

variable "tags" {
  type = map(string)
  default = {
    project    = "statmaster"
    managed_by = "terraform"
    purpose    = "capgemini-demo"
  }
}

# Terraform — explanation (StatMaster)

IaC for the **same** Azure stack as the portal walkthrough:

`rg-statmaster` → ACR `statmasteracrab` (Basic) → AKS `aks-statmaster` (1 × B2als_v2) → AcrPull.

App deploy stays in **GitHub Actions** / kubectl — Terraform only builds the cloud.

Related: [`WALKTHROUGH.md`](../../WALKTHROUGH.md) (portal + Actions) · [`JENKINS_WALKTHROUGH.md`](../../JENKINS_WALKTHROUGH.md)

---

## File map

| File | Role |
|------|------|
| `versions.tf` | Terraform + Azure provider |
| `variables.tf` | Inputs (names, region, VM size) |
| `main.tf` | Resources: RG, ACR, AKS, AcrPull |
| `outputs.tf` | Values printed after apply *(add next)* |
| `terraform.tfvars` | Your subscription id *(local, gitignored)* |

---

## `versions.tf`

```hcl
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}
```

- **required_version** — minimum Terraform CLI  
- **azurerm ~> 4.0** — Azure provider major v4  

```hcl
provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}
```

- **features {}** — required block (even if empty)  
- **subscription_id** — which Azure subscription gets the resources (Students)

---

## `variables.tf` (defaults = your portal names)

| Variable | Default | Why |
|----------|---------|-----|
| `subscription_id` | *(no default — required)* | Must set in tfvars |
| `location` | `polandcentral` | Same region as before |
| `resource_group_name` | `rg-statmaster` | Same RG name |
| `acr_name` | `statmasteracrab` | Same ACR (globally unique) |
| `aks_name` | `aks-statmaster` | Same cluster name |
| `dns_prefix` | `aks-statmaster-dns` | AKS DNS prefix |
| `kubernetes_version` | `null` | Let Azure pick default |
| `node_vm_size` | `Standard_B2als_v2` | Cheap node you used |
| `node_count` | `1` | Cost control |
| `tags` | project / managed_by / purpose | Labeling in portal |

---

## `main.tf` — resource by resource

### Resource group

```hcl
resource "azurerm_resource_group" "main" { ... }
```

Folder for everything. Delete RG later = teardown (or use `terraform destroy`).

### ACR

```hcl
sku                 = "Basic"
admin_enabled       = false
```

- **Basic** — cheapest SKU (demo)  
- **admin_enabled false** — no admin password; AKS uses **AcrPull** identity  

### AKS

| Setting | Meaning |
|---------|---------|
| `sku_tier = "Free"` | Cheaper control plane |
| `default_node_pool` name `system` | Required system pool |
| `node_count = 1`, `B2als_v2` | Same size/count as portal |
| `network_plugin = azure` + `overlay` | Azure CNI Overlay |
| `load_balancer_sku = standard` | Normal for AKS |
| `oidc_issuer_enabled` | For federated identity later |
| `workload_identity_enabled` | Modern pod identity |
| `lifecycle ignore_changes` | Ignore AKS auto patch version noise |

No OMS/monitoring block = insights off (cheaper), like the portal.

### AcrPull role

```hcl
principal_id         = ...kubelet_identity[0].object_id
role_definition_name = "AcrPull"
scope                = azurerm_container_registry.main.id
```

Kubelet identity may **pull** images from this ACR — same as portal Integrations → attach registry.

---

## What Terraform does NOT create (yet)

| Piece | Who does it now | Later in Terraform? |
|-------|-----------------|---------------------|
| Namespaces `statmaster-dev` / `prod` | `kubectl` after cluster is up | Optional `kubernetes` provider |
| Deployment / Service | `k8s/` + GitHub Actions | No — stay in CI |
| Docker image | CI (`Dockerfile`) | No |
| Entra app / SP for CI/CD (`github-statmaster-cicd`) | Portal (manual) | **TODO — do later** |
| Contributor on RG for that SP | Portal IAM | **TODO — with the SP** |
| Client secret / OIDC federated cred | Portal | **TODO — prefer OIDC** |
| GitHub secret `AZURE_CREDENTIALS` | You paste in GitHub | Still manual (or `gh` CLI); Terraform only **outputs** values |

### TODO later — CI/CD identity in Terraform

Add (new file e.g. `github_oidc.tf` or `cicd_sp.tf`):

1. Provider `azuread`
2. `azuread_application` + `azuread_service_principal` (same role as portal app)
3. Either:
   - `azuread_application_password` (client secret), **or**
   - Federated credential for GitHub Actions OIDC (better interview story)
4. `azurerm_role_assignment` — Contributor on `rg-statmaster` (+ AcrPush if needed)
5. `output` sensitive values → paste into GitHub Secrets / Jenkins

**Do this after** the first clean `terraform apply` of RG/ACR/AKS works.

---

## Clean start checklist

1. Delete old portal RG `rg-statmaster` (and leftover `MC_...` if any)  
2. Add `outputs.tf` + `terraform.tfvars`  
3. `az login` → `terraform init` → `plan` → `apply`  
4. `az aks get-credentials ...`  
5. `kubectl create namespace statmaster-dev` / `statmaster-prod`  
6. Deploy app via Actions  

---

## Capgemini one-liner

“We first clicked the stack in the portal to learn it, then expressed the same resources in Terraform for a repeatable clean apply: RG, ACR Basic, single-node AKS, AcrPull. Application CD stays in GitHub Actions.”

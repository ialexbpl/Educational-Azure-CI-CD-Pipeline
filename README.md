# Educational Azure CI/CD Pipeline

Deploy a **Vite + React** frontend (**StatMaster**) to **Azure Kubernetes Service (AKS)** with **dev** and **prod** environments, automated by **GitHub Actions**.

Built as a Capgemini-style learning project on **Azure for Students** (~€80 budget): one small AKS cluster, two namespaces, ACR for images, branch-based promotion.

**Learning path:** first provisioned everything in the **Azure Portal** (to understand the pieces), then **mirrored the same infrastructure with Terraform** and redeployed the app with GitHub Actions — practicing **Infrastructure as Code (IaC)** without changing the CD story.

| Piece | Choice |
| ----- | ------ |
| App | StatMaster dashboard (static SPA after build) |
| Registry | Azure Container Registry (`statmasteracrab`) |
| Cluster | AKS `aks-statmaster` (1 × `B2als_v2`) |
| Envs | `statmaster-dev` / `statmaster-prod` |
| IaC | **Terraform** (`infra/terraform`) — RG, ACR, AKS, AcrPull |
| CI/CD | GitHub Actions → ACR → AKS |
| Branches | `develop` → dev · `main` → prod |

Deep step-by-step notes:

- GitHub Actions / Azure portal: **[WALKTHROUGH.md](./WALKTHROUGH.md)**
- Terraform IaC: **[infra/terraform/explanation.md](./infra/terraform/explanation.md)**
- Jenkins (local Docker): **[JENKINS_WALKTHROUGH.md](./JENKINS_WALKTHROUGH.md)**
- Task list: **[BACKLOG.md](./BACKLOG.md)**

---

## Architecture

```text
Terraform (infra/terraform)
        → rg-statmaster + ACR + AKS + AcrPull

git push (develop | main)
        │
        ▼
 GitHub Actions
        ├─ docker build (Node → nginx)
        ├─ push to ACR
        └─ kubectl apply
                ├── develop → statmaster-dev
                └── main    → statmaster-prod
```

Same Docker image pipeline for both environments. The **branch** selects the **namespace**. Infrastructure is defined as code; the app is delivered by CI/CD.

---

## Pipeline in pictures

### 1. Azure Container Registry

![ACR created](./Workalong%20images/ACR_Created.png)

### 2. AKS cluster ready

![AKS deployment complete](./Workalong%20images/AKS_Created.png)

### 3. Connect + create namespaces

![Cloud Shell — credentials and nodes](./Workalong%20images/Cloud_Shell.png)

![dev and prod namespaces](./Workalong%20images/Prod_Dev_namespaces_Created.png)

### 4. Identity for GitHub Actions

App registration used by the pipeline:

![Entra app registration](./Workalong%20images/Implemented_user_for_action.png)

GitHub secret `AZURE_CREDENTIALS` (value never committed):

![GitHub Actions secret](./Workalong%20images/Create_azure_secret_for_action.png)

### 5. First CI/CD run on `develop`

![Push to develop](./Workalong%20images/Pushed_dev.png)

![Actions build + deploy success](./Workalong%20images/github_actions_first_deployment.png)

### 6. Verify on the cluster

![Pods and LoadBalancer in namespace](./Workalong%20images/Final_check.png)

### 7. Promote to production

Merge `develop` → `main` to deploy **prod**:

![Merged to main for prod](./Workalong%20images/Merged_prod.png)

### 8. IaC — mirror the stack with Terraform

After learning the portal, the same RG / ACR / AKS stack was recreated with **Terraform** (`terraform apply`), namespaces recreated, Contributor re-attached for the Actions SP, then CD ran again on the new cluster:

![Terraform apply](./Workalong%20images%20terraform/applied_terraform_iac.png)

![Cluster via Terraform + namespaces](./Workalong%20images%20terraform/cluster_setup_using_tf.png)

![Actions deploy after Terraform AKS](./Workalong%20images%20terraform/Deployment_after_terraform_implementation.png)

Details: [`infra/terraform/`](./infra/terraform/) and [`explanation.md`](./infra/terraform/explanation.md).

---

## Local development

```bash
npm i
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Docker (same image the pipeline builds)

```bash
docker build -t statmaster-web:local .
docker run --rm -p 8080:80 statmaster-web:local
```

Then open `http://localhost:8080`.

---

## Repository layout

| Path | Purpose |
| ---- | ------- |
| `src/` | React app |
| `Dockerfile` + `nginx.conf` | Multi-stage build → nginx serves SPA |
| `k8s/` | Deployment + Service (+ explanations) |
| `.github/workflows/ci-cd.yml` | Build → ACR → AKS |
| `infra/terraform/` | Terraform IaC (RG, ACR, AKS, AcrPull) + explanation |
| `WALKTHROUGH.md` | Full portal + pipeline walkthrough |
| `JENKINS_WALKTHROUGH.md` | Jenkins learning path |
| `Workalong images/` | Screenshots from the setup journey |

---

## How deploys work

| Branch | Namespace | When |
| ------ | --------- | ---- |
| `develop` | `statmaster-dev` | On every push (auto) |
| `main` | `statmaster-prod` | On push / merge (optional GitHub Environment approval) |

**Keep `develop` on the remote** — do not delete it after merging to `main`. Day-to-day work stays on `develop`; promote to prod with a PR into `main`.

Required GitHub secret:

- `AZURE_CREDENTIALS` — JSON with `clientId`, `clientSecret`, `subscriptionId`, `tenantId` (Entra app with **Contributor** on the resource group)

---

## Useful cluster commands

```bash
az aks get-credentials --resource-group rg-statmaster --name aks-statmaster --overwrite-existing

kubectl get pods,svc -n statmaster-dev
kubectl get pods,svc -n statmaster-prod
```

Open `http://<EXTERNAL-IP>` when the LoadBalancer IP is assigned.

---

## Cost note

AKS is the main burn on student credit. When you are not demoing, delete or stop the cluster so the ~€80 lasts. Prefer one node, Basic ACR, and avoid App Gateway / heavy monitoring for this project.

---

## UI origin

Dashboard design from Figma: [Design StatMaster Dashboard](https://www.figma.com/design/ubsE7qw7jKaCsIYT5rVKqt/Design-StatMaster-Dashboard).

---

## What’s next (learning path)

- [x] Recreate portal resources with **Terraform** and redeploy via Actions
- [ ] Gate `main` with a GitHub **production** environment (required reviewers)
- [ ] Terraform: Entra app / OIDC for CI identity (still portal today)
- [ ] Finish / host **Jenkins** on an Azure VM (past local Docker wall)
- [ ] Same story again with **Azure DevOps**

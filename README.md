# Educational Azure CI/CD Pipeline

Deploy a **Vite + React** frontend (**StatMaster**) to **Azure Kubernetes Service (AKS)** with **dev** and **prod** environments, automated by **GitHub Actions**.

Built as a Capgemini-style learning project on **Azure for Students** (~€80 budget): one small AKS cluster, two namespaces, ACR for images, branch-based promotion.

| Piece | Choice |
| ----- | ------ |
| App | StatMaster dashboard (static SPA after build) |
| Registry | Azure Container Registry (`statmasteracrab`) |
| Cluster | AKS `aks-statmaster` (1 × `B2als_v2`) |
| Envs | `statmaster-dev` / `statmaster-prod` |
| CI/CD | GitHub Actions → ACR → AKS |
| Branches | `develop` → dev · `main` → prod |

Deep step-by-step notes:

- GitHub Actions / Azure: **[WALKTHROUGH.md](./WALKTHROUGH.md)**
- Jenkins (local Docker): **[JENKINS_WALKTHROUGH.md](./JENKINS_WALKTHROUGH.md)**
- Task list: **[BACKLOG.md](./BACKLOG.md)**

---

## Architecture

```text
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

Same Docker image pipeline for both environments. The **branch** selects the **namespace**.

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
| `WALKTHROUGH.md` | Full portal + pipeline walkthrough |
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

- [ ] Gate `main` with a GitHub **production** environment (required reviewers)
- [ ] Recreate portal resources with **Terraform / Bicep**
- [ ] Tell the same story again with **Jenkins** or **Azure DevOps**

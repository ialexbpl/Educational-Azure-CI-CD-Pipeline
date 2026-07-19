# StatMaster — Azure + Kubernetes + GitHub Actions Walkthrough

Deploy this Vite/React frontend to **Azure Kubernetes (AKS)** with **dev** and **prod**, automated by **GitHub Actions**.

**Repo:** [https://github.com/ialexbpl/Educational-Azure-CI-CD-Pipeline](https://github.com/ialexbpl/Educational-Azure-CI-CD-Pipeline)  

**Status (as of last update):** end-to-end **dev** works (Actions green → pod Running → public LoadBalancer IP). **Prod** deploys when you merge `develop` → `main`.

---

## Goal


| Piece        | Choice                                          | Why                                     |
| ------------ | ----------------------------------------------- | --------------------------------------- |
| App          | Vite/React static frontend                      | Existing StatMaster UI                  |
| Cloud        | Azure for Students (~€80 credit)                | Interview-relevant, real bill awareness |
| Compute      | **One** AKS cluster                             | Two clusters burn credit too fast       |
| Environments | Namespaces `statmaster-dev` / `statmaster-prod` | Same cluster, logical separation        |
| Images       | Azure Container Registry (ACR)                  | Private image store AKS pulls from      |
| CI/CD        | GitHub Actions first                            | Later: Jenkins / Azure DevOps           |


**Interview line:** “One shared cluster with namespace isolation for cost; branch strategy promotes from dev to prod.”

---



## Architecture (current)

```text
git push to develop or main
        │
        ▼
 GitHub Actions (ci-cd.yml)
        │
        ├─ docker build (Node → nginx image)
        ├─ docker push → ACR: statmasteracrab.azurecr.io/statmaster-web:<sha>
        └─ kubectl apply → AKS: aks-statmaster
                ├── develop → namespace: statmaster-dev   (auto)
                └── main    → namespace: statmaster-prod  (optional approval)
```

**Keep both remote branches.** Do **not** delete `develop` after merging to `main` — you need it for ongoing auto-deploys to dev.

---



## Branch → environment map


| Git event         | Branch    | Namespace         | Notes                                             |
| ----------------- | --------- | ----------------- | ------------------------------------------------- |
| Push / merge into | `develop` | `statmaster-dev`  | Automatic                                         |
| Push / merge into | `main`    | `statmaster-prod` | Optional GitHub Environment `production` approval |


A **merge is a push** to the target branch. Merging `develop` into `develop` does nothing useful.  
PR direction for prod: `develop` **→** `main`.

---



## Step 1 — Azure subscription

**What:** Azure for Students subscription with credit.

**Why:** All resources (RG, ACR, AKS) bill here. Student quotas may limit VM sizes.

**Cost habit:** Budget alert (e.g. €60). AKS is the main spend — delete the cluster when idle.

---



## Step 2 — Resource group `rg-statmaster`

**What:** Resource group in **Poland Central**.

**Why:** Folder for related resources; easy teardown. Keep ACR + AKS in the **same region**.

---



## Step 3 — Azure Container Registry (ACR)


| Setting      | Value                        | Why                                 |
| ------------ | ---------------------------- | ----------------------------------- |
| Name         | `statmasteracrab`            | Globally unique                     |
| Login server | `statmasteracrab.azurecr.io` | Docker push/pull target             |
| SKU          | **Basic**                    | Cheapest for demo                   |
| Networking   | Public                       | Private Link = Premium (too costly) |


**Why ACR:** CI builds a container image; AKS pulls it. Like a private Docker Hub on Azure.

---



## Step 4 — AKS cluster `aks-statmaster`


| Setting                  | Value                          | Why                                         |
| ------------------------ | ------------------------------ | ------------------------------------------- |
| Region                   | Poland Central                 | Same as ACR                                 |
| Pricing tier             | Free                           | Cheaper control plane                       |
| Node pool                | 1 × **System**                 | Required by AKS                             |
| Node size                | `Standard_B2als_v2`            | Smallest workable size                      |
| Node count               | **1**, no autoscale            | Fit ~€80 credit                             |
| Network                  | Azure CNI Overlay, policy None | Simple demo defaults                        |
| Private cluster          | Off                            | Easier Cloud Shell access                   |
| Monitoring extras        | Off                            | Save money                                  |
| ACR integration          | `statmasteracrab` attached     | Pull images without docker passwords in K8s |
| OIDC + Workload Identity | On                             | Future hardening / better auth story        |


**Portal note:** “Preview automation” only **exports** an ARM/Bicep template — don’t redeploy it or you may create a second cluster.

Exported template kept under `exported iac template/` for learning (IaC later).

---



## Step 5 — Cloud Shell + namespaces

```bash
az aks get-credentials --resource-group rg-statmaster --name aks-statmaster --overwrite-existing
kubectl get nodes
kubectl create namespace statmaster-dev
kubectl create namespace statmaster-prod
```

- `get-credentials` — kubeconfig for this cluster  
- `get nodes` — worker must be **Ready**  
- namespaces — logical **dev** / **prod** on one cluster

Cloud Shell with **no storage** is fine for short commands (session is ephemeral).

---



## Step 6 — GitHub repository

**Remote:** `https://github.com/ialexbpl/Educational-Azure-CI-CD-Pipeline.git`

Actions runs against this remote. Fix local remote if needed:

```powershell
git remote set-url origin https://github.com/ialexbpl/Educational-Azure-CI-CD-Pipeline.git
```

---



## Step 7 — Dockerfile + nginx



### Why Docker?

AKS runs **containers**, not `npm run dev`.

Multi-stage build:

1. **Node** — `npm ci` + `npm run build` → static `dist/`
2. **nginx** — serve those files on port 80

**Interview line:** “Build once, deploy the same image tag to dev then prod.”

### Why nginx?

After Vite build the app is static HTML/JS/CSS. nginx:

- listens on **80**  
- SPA routing via `try_files` → `/index.html`  
- `/healthz` for Kubernetes probes

Local smoke test (optional): `docker build -t statmaster-web:local .` then `docker run --rm -p 8080:80 statmaster-web:local`.

Files: `Dockerfile`, `nginx.conf`, `.dockerignore`.

---



## Step 8 — Kubernetes manifests

CI/CD does **not** replace Kubernetes. The pipeline **applies** these files.


| File                  | Role                                                          |
| --------------------- | ------------------------------------------------------------- |
| `k8s/deployment.yaml` | Pods, image placeholder `IMAGE_TO_REPLACE`, probes, resources |
| `k8s/service.yaml`    | `LoadBalancer` → public IP for demo                           |
| `k8s/explanation.md`  | Line-by-line Deployment guide                                 |


Workflow replaces `IMAGE_TO_REPLACE` with the ACR image built in that run, then `kubectl apply -n <namespace>`.

---



## Step 9 — GitHub Actions workflow

File: `.github/workflows/ci-cd.yml`  
Guide: `.github/workflows/explanation.md`

**Triggers:** push to `develop` or `main`, plus manual `workflow_dispatch`.

**Jobs:**

1. **Build and push image** — Azure login → `docker build` → push `statmasteracrab.azurecr.io/statmaster-web:<7-char-sha>`
2. **Deploy to AKS** — pick namespace from branch → apply manifests → `rollout status` → print Service IP

```text
develop push → ACR → statmaster-dev
main push    → ACR → statmaster-prod  (+ environment: production if configured)
```

---



## Step 10 — Azure identity for Actions (no long-lived personal login)

GitHub is not you. Actions needs a **robot identity**.

**Portal path we used:**

1. Entra ID → **App registrations** → `github-statmaster-cicd`
2. **Certificates & secrets** → create client secret (copy Value once)
3. Resource group `rg-statmaster` → **IAM** → role **Contributor** (under Privileged administrator roles) → assign to that app
4. GitHub → **Settings** → **Secrets and variables** → **Actions** → secret name `AZURE_CREDENTIALS`:

```json
{
  "clientId": "<Application (client) ID>",
  "clientSecret": "<client secret Value>",
  "subscriptionId": "<your subscription id>",
  "tenantId": "<Directory (tenant) ID>"
}
```

Never commit that JSON. Screenshots of the secret **name** only are OK; never screenshot the secret value.

---



## Step 11 — First successful deploy (done on `develop`)

1. Commit Docker / k8s / workflow / docs
2. Create and push remote branch `develop`
3. Actions run **Success**: Build (~~1m) + Deploy (~~30s)
4. Verify:

```bash
kubectl get pods,svc -n statmaster-dev
```

Expected: pod **Running 1/1**, Service type **LoadBalancer** with an **EXTERNAL-IP**.  
Open `http://<EXTERNAL-IP>` in a browser → StatMaster UI.

Node.js 16 deprecation **warnings** in Actions annotations are harmless for this demo.

---



## Step 12 — Prod (how to finish it)

`statmaster-prod` stays empty until something runs the pipeline on `main`.

1. Optional: GitHub **Environments** → create `production` → required reviewer = you
2. Open PR `develop` **→** `main` → **Merge**
3. Watch Actions on `main` (Approve deployment if asked)
4. Verify:

```bash
kubectl get pods,svc -n statmaster-prod
```

Prod gets its **own** LoadBalancer IP (separate from dev).

**Do not delete** `develop` after the merge — keep using it for continuous dev deploys.

---



## What CI vs CD means here


|        | Meaning in this project                                           |
| ------ | ----------------------------------------------------------------- |
| **CI** | Build Docker image + push to ACR on every relevant push           |
| **CD** | Apply K8s manifests so AKS runs that image in the right namespace |


---



## Checklist



### Done

- [x] RG `rg-statmaster` (Poland Central)  
- [x] ACR `statmasteracrab` (Basic)  
- [x] AKS `aks-statmaster` (1 × B2als_v2, ACR attached)  
- [x] Namespaces `statmaster-dev` / `statmaster-prod`  
- [x] Dockerfile + nginx + local smoke test  
- [x] K8s Deployment + Service + explanations  
- [x] GitHub Actions `ci-cd.yml`  
- [x] App registration + Contributor on RG + `AZURE_CREDENTIALS`  
- [x] Remote `develop` + green Actions → **dev live**  



### Remaining / optional

- [ ] Merge `develop` → `main` → confirm **prod** pod + EXTERNAL-IP  
- [ ] GitHub Environment `production` with required reviewers  
- [ ] Budget alert + delete AKS when not demoing  
- [ ] Later: Terraform/Bicep for the portal resources  
- [ ] Later: rebuild the same story with Jenkins / Azure DevOps  

---



## Cost cheat sheet (~€80)


| Resource                               | Notes                                                       |
| -------------------------------------- | ----------------------------------------------------------- |
| AKS node `B2als_v2` × 1                | Main cost — destroy when idle                               |
| ACR Basic                              | Small cost                                                  |
| LoadBalancer public IP(s)              | One per Service that is type LoadBalancer (dev and/or prod) |
| Monitoring / App Gateway / 2nd cluster | Avoid                                                       |


---



## Publishing / screenshots

Safe to commit: source, Docker, k8s, workflows, docs, walkalong images **after** blurring Subscription IDs.  
Never commit: client secrets, raw `AZURE_CREDENTIALS` JSON, kubeconfig files.

Correlation IDs in portal screenshots are low sensitivity (not passwords).

---



## Quick glossary


| Term                                 | Meaning                                       |
| ------------------------------------ | --------------------------------------------- |
| RG                                   | Resource group                                |
| ACR                                  | Container image registry                      |
| AKS                                  | Managed Kubernetes on Azure                   |
| Namespace                            | Logical env inside one cluster                |
| Deployment                           | Desired pods + rollout logic                  |
| Service / LoadBalancer               | Stable network endpoint; LB gives a public IP |
| Service principal / App registration | Robot identity for CI                         |
| Image tag (git sha)                  | Exact build artifact deployed                 |


---



## Resources reference


| Resource       | Name                                             |
| -------------- | ------------------------------------------------ |
| Subscription   | Azure for Students                               |
| Resource group | `rg-statmaster`                                  |
| Region         | Poland Central                                   |
| ACR            | `statmasteracrab` → `statmasteracrab.azurecr.io` |
| AKS            | `aks-statmaster`                                 |
| Namespaces     | `statmaster-dev`, `statmaster-prod`              |
| Entra app      | `github-statmaster-cicd`                         |
| GitHub secret  | `AZURE_CREDENTIALS`                              |
| GitHub         | `ialexbpl/Educational-Azure-CI-CD-Pipeline`      |
| Branches       | `develop` (dev), `main` (prod)                   |

---

## Next learning path

Jenkins (same Azure targets, local Docker): see **[JENKINS_WALKTHROUGH.md](./JENKINS_WALKTHROUGH.md)**.


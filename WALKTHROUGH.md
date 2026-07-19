# StatMaster — Azure + Kubernetes Walkthrough

**GitHub Actions** → build image → push **ACR** → deploy **AKS** (`dev` / `prod`).

Capgemini-style demo: deploy this frontend to Azure Kubernetes with **dev** and **prod**, then automate with **GitHub Actions**.  
This document covers everything we did **up to packaging the app with Docker + nginx**.

---

## Goal


| Piece         | Choice                                          | Why                                               |
| ------------- | ----------------------------------------------- | ------------------------------------------------- |
| App           | Vite/React static frontend                      | Existing StatMaster UI                            |
| Cloud         | Azure for Students (~€80 credit)                | Interview-relevant, real cloud bill awareness     |
| Compute       | **One** AKS cluster                             | Two clusters would burn credit too fast           |
| Environments  | Namespaces `statmaster-dev` / `statmaster-prod` | Same cluster, logical separation (common pattern) |
| Images        | Azure Container Registry (ACR)                  | Private image store AKS can pull from             |
| CI/CD (later) | GitHub Actions first                            | Later: Jenkins / Azure DevOps                     |


**Interview line:** “We use one shared cluster with namespace isolation for cost; prod gets stricter promotion from CI.”

---



## Architecture (so far)

```text
Developer PC / GitHub
        │
        ▼
   Docker image (app + nginx)
        │
        ▼
 ACR: statmasteracrab.azurecr.io
        │
        ▼
 AKS: aks-statmaster (1 small node)
        ├── namespace: statmaster-dev
        └── namespace: statmaster-prod
```

Nothing is fully deployed to the namespaces yet — we prepared Azure and are packaging the app next.

---



## Step 1 — Azure subscription

**What:** Use **Azure for Students**, note Subscription ID.

**Why:** Everything (RG, ACR, AKS) must live in a subscription that has credit. Students SKUs/quotas can limit VM sizes; we pick the cheapest allowed node.

**Cost habit:** Set a **budget alert** (e.g. €60) so credit does not disappear unnoticed.

---



## Step 2 — Resource group `rg-statmaster`

**What:** Created a resource group in **Poland Central**.

**Why:** A resource group is a folder for related resources. Deleting the RG later can tear down the whole demo in one go (important with limited credit).

**Region rule:** Keep ACR + AKS in the **same region** (Poland Central) to avoid cross-region traffic cost/latency.

---



## Step 3 — Azure Container Registry (ACR)

**What we created:**


| Setting      | Value                        | Why                                             |
| ------------ | ---------------------------- | ----------------------------------------------- |
| Name         | `statmasteracrab`            | Globally unique DNS name                        |
| Login server | `statmasteracrab.azurecr.io` | Where Docker push/pull points                   |
| SKU          | **Basic**                    | Cheapest; enough for a student demo             |
| Networking   | Public access                | Private Link needs Premium (too expensive here) |


**Why ACR exists:**  
Kubernetes does not build your app. CI builds a **container image** and stores it in a registry. AKS then **pulls** that image to run pods.

**Interview line:** “ACR is our artifact store for container images, analogous to a NuGet/npm feed but for Docker.”

---



## Step 4 — AKS cluster `aks-statmaster`

**What we created (summary):**


| Setting                        | Value                          | Why                                                     |
| ------------------------------ | ------------------------------ | ------------------------------------------------------- |
| Region                         | Poland Central                 | Same as ACR                                             |
| Pricing tier                   | Free                           | Control plane cheaper for learning                      |
| Node pool                      | 1 × **System** pool            | Required — AKS needs a system pool                      |
| Node size                      | `Standard_B2als_v2`            | Smallest sensible burstable size (~$30/mo class)        |
| Node count                     | **1**, autoscale off           | Stay inside ~€80 credit                                 |
| Network                        | Azure CNI Overlay, policy None | Simple defaults for demo                                |
| Private cluster                | Off                            | Easier for learning / Cloud Shell                       |
| App Gateway / heavy monitoring | Off                            | Avoid extra cost                                        |
| ACR integration                | Attached `statmasteracrab`     | Cluster can pull images without manual docker passwords |
| OIDC + Workload Identity       | On                             | Useful later for secure GitHub → Azure auth             |


**Why Kubernetes (AKS)?**  
Capgemini expects container orchestration language: Deployments, Services, namespaces, rollouts, health probes. AKS is managed Kubernetes on Azure (you do not run etcd yourself).

**Why one cluster, two namespaces?**  
Namespaces isolate workloads (`dev` vs `prod`) without paying for two control planes and two node pools.

**Warning:** AKS is the main cost. When you stop working, plan to **stop/delete** the cluster so credit lasts.

**Side note — “Preview automation”:**  
That portal button exports an ARM/Bicep-style template of what you clicked. Useful later for IaC; **do not** deploy it again or you may create a **second** cluster.

---



## Step 5 — Connect with Cloud Shell + namespaces

**What:** Used Azure **Cloud Shell (Bash)** so we did not need Azure CLI on the PC yet.

```bash
az aks get-credentials --resource-group rg-statmaster --name aks-statmaster --overwrite-existing
kubectl get nodes
kubectl create namespace statmaster-dev
kubectl create namespace statmaster-prod
```

**Why** `get-credentials`**:** Downloads kubeconfig so `kubectl` talks to *your* cluster.

**Why** `kubectl get nodes`**:** Confirms the worker VM is **Ready** before deploying apps.

**Why namespaces:**  

- `statmaster-dev` — test deployments from `main` / PRs  
- `statmaster-prod` — promoted, stable releases

Same cluster, different logical environments.

**Cloud Shell “no storage”:** Fine for short commands; session files are ephemeral.

---



## Step 6 — GitHub remote

**What:** Repo already on GitHub: `https://github.com/ialexbpl/frontend-StatMaster.git`

**Why:** GitHub Actions (next phase) runs on push/PR against this remote. Azure alone cannot build your Vite app from thin air without a pipeline or manual upload.

---



## Step 7 — Dockerfile + nginx (current step)



### Why a Dockerfile at all?

AKS runs **containers**, not raw `npm run dev`.

A Dockerfile defines a **repeatable build**:

1. Install npm deps
2. Run `npm run build` (Vite → static files in `dist/`)
3. Put those files into a small web server image
4. Result: one image tag you can push to ACR and deploy identically to dev and prod

**Interview line:** “Build once, promote the same image digest from dev to prod.”

### Why multi-stage?

```text
Stage 1 (node):  build the frontend  → needs Node + npm (large)
Stage 2 (nginx): serve static files  → tiny runtime image
```

You discard the heavy Node toolchain from the final image → smaller, faster pulls, smaller attack surface.

### Why nginx (not Node in production)?

This app is a **static SPA** after Vite build (HTML/JS/CSS).  

- `npm run dev` is for local development only  
- In production, a static file server is enough  
- **nginx** is the usual lightweight choice in containers



### What `nginx.conf` is for


| Concern           | What nginx does                                                 |
| ----------------- | --------------------------------------------------------------- |
| Listen on port 80 | Container exposes HTTP for the Service/LoadBalancer             |
| SPA routing       | `try_files ... /index.html` so React Router paths don’t 404     |
| `/healthz`        | Simple health endpoint for Kubernetes readiness/liveness probes |


Without SPA `try_files`, refreshing `/dashboard` on the cluster would return 404 from nginx even though the React app is fine.

### How this ties to Azure

```text
Dockerfile build  →  image
     →  push to statmasteracrab.azurecr.io/statmaster-web:<tag>
     →  kubectl deploy into statmaster-dev or statmaster-prod
```

GitHub Actions will later automate build + push + deploy. Manually understanding Docker/nginx first makes the pipeline less magical in the interview.

---



## What we have vs what we don’t (yet)



### Done

- [x] Resource group  
- [x] ACR (Basic)  
- [x] AKS (1 small node) + ACR attached  
- [x] Namespaces `statmaster-dev` / `statmaster-prod`  
- [x] GitHub remote: `ialexbpl/Educational-Azure-CI-CD-Pipeline`  
- [x] Understanding Dockerfile + nginx purpose  
- [x] Dockerfile + `nginx.conf` + `.dockerignore`  
- [x] Local `docker build` / run smoke test (Dockerfile validated)  

### In progress — GitHub Actions CI/CD

- [x] Kubernetes Deployment + Service manifests (`k8s/`) + `k8s/explanation.md`  
- [x] GitHub Actions workflow `.github/workflows/ci-cd.yml` + `explanation.md`  
- [x] Azure service principal + GitHub secret `AZURE_CREDENTIALS`  
- [ ] Create `develop` branch; protect `production` environment  
- [ ] First green Actions run → deploy to `statmaster-dev`  

### Later

- [ ] Optional: Terraform/Bicep IaC of portal resources  
- [ ] Same pipeline story with Jenkins / Azure DevOps  

---

## Step 9 — Workflow jobs (what `ci-cd.yml` does)

1. **build** — Azure login → Docker build → push `statmasteracrab.azurecr.io/statmaster-web:<sha>`  
2. **deploy** — branch picks namespace → `sed` replaces `IMAGE_TO_REPLACE` → `kubectl apply` → rollout status  

| Branch | GitHub Environment | Namespace |
|--------|--------------------|-----------|
| `develop` | — | `statmaster-dev` (auto) |
| `main` | `production` (approve) | `statmaster-prod` |

---

## Pipeline design (branch → namespace)

CI/CD does **not** replace Kubernetes. Flow:

```text
git push
  → GitHub Actions
    → docker build + push to ACR
    → kubectl apply manifests into a namespace
```

| Branch | Namespace | Deploy style |
|--------|-----------|--------------|
| `develop` | `statmaster-dev` | Automatic on push |
| `main` | `statmaster-prod` | GitHub Environment approval (gated) |

Same image/Dockerfile; only the **namespace** (and gates) change.

**Why K8s YAML?** Actions builds the artifact; YAML declares how it runs (replicas, ports, probes, Service). CD applies that desired state.

**Repo:** https://github.com/ialexbpl/Educational-Azure-CI-CD-Pipeline  

If local `git remote` still points at an old name, fix with:

```powershell
git remote set-url origin https://github.com/ialexbpl/Educational-Azure-CI-CD-Pipeline.git
git remote -v
```

---



## Cost cheat sheet (~€80)


| Resource                               | Notes                             |
| -------------------------------------- | --------------------------------- |
| AKS node `B2als_v2` × 1                | Main cost — destroy when idle     |
| ACR Basic                              | Small ongoing cost                |
| Public LoadBalancer IP                 | Extra if you expose prod publicly |
| Monitoring / App Gateway / 2nd cluster | Avoid for this budget             |


---



## Quick glossary


| Term      | Meaning                                             |
| --------- | --------------------------------------------------- |
| RG        | Resource group — Azure folder                       |
| ACR       | Container image registry                            |
| AKS       | Managed Kubernetes on Azure                         |
| Namespace | Logical env inside one cluster                      |
| Image     | Packaged app + runtime (here: static files + nginx) |
| Pod       | Running instance(s) of your container on a node     |


---



## Resources we created (reference)


| Resource       | Name                                             |
| -------------- | ------------------------------------------------ |
| Subscription   | Azure for Students                               |
| Resource group | `rg-statmaster`                                  |
| Region         | Poland Central                                   |
| ACR            | `statmasteracrab` → `statmasteracrab.azurecr.io` |
| AKS            | `aks-statmaster`                                 |
| Namespaces     | `statmaster-dev`, `statmaster-prod`              |
| GitHub         | `ialexbpl/Educational-Azure-CI-CD-Pipeline`      |



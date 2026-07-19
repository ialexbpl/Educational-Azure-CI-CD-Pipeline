# `ci-cd.yml` — explanation

File: `.github/workflows/ci-cd.yml`  
This is the **robot** that builds your Docker image, pushes it to ACR, and deploys it to AKS.

---

## Dev vs prod — how it decides (merge / push)

The workflow does **not** look at “merge” as a special event.  
GitHub Actions listens for **`push`** to a branch. A merge is just a push of new commits onto that branch.

| What you do | Branch that got new commits | Namespace |
|-------------|----------------------------|-----------|
| Push (or merge PR) into **`develop`** | `develop` | **`statmaster-dev`** (auto) |
| Push (or merge PR) into **`main`** | `main` | **`statmaster-prod`** (+ approval if Environment is set) |
| Click **Run workflow** | whatever branch you pick | same rules as above |

### Typical flow (interview story)

```text
1. Work on a feature branch (optional)
2. Open PR → merge into develop
      → Actions runs → deploy DEV
3. Test on the dev LoadBalancer IP
4. Open PR develop → main (or merge to main)
      → Actions runs → waits for "production" approval → deploy PROD
```

So: **which branch receives the push/merge** chooses **dev or prod**.  
Not “merge vs push” — both are pushes; the **branch name** matters.

---

## Line-by-line / block explanation

```yaml
name: CI/CD
```
Display name in the GitHub **Actions** tab.

```yaml
on:
  push:
    branches: [develop, main]
  workflow_dispatch:
```
**When** the pipeline runs:
- `push` to `develop` or `main` (includes merging a PR into those branches)
- `workflow_dispatch` = manual “Run workflow” button

```yaml
env:
  ACR_NAME: statmasteracrab
  ACR_LOGIN_SERVER: statmasteracrab.azurecr.io
  IMAGE_NAME: statmaster-web
  AKS_RESOURCE_GROUP: rg-statmaster
  AKS_NAME: aks-statmaster
```
Shared constants for all jobs — your Azure resource names.  
Change here once if you rename ACR/AKS.

---

### Job 1 — `build` (CI)

```yaml
jobs:
  build:
    name: Build and push image
    runs-on: ubuntu-latest
```
Starts a fresh Linux VM in GitHub’s cloud.  
This job = **Continuous Integration**: create the artifact (Docker image).

```yaml
    outputs:
      image: ${{ steps.image.outputs.image }}
```
Exports the full image URL (e.g. `…/statmaster-web:a1b2c3d`) so the **deploy** job can use the exact same image.

```yaml
    steps:
      - name: Checkout
        uses: actions/checkout@v4
```
Clones your repo onto the runner so `Dockerfile` and source exist.

```yaml
      - name: Azure login
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
```
Logs into Azure using a **service principal** JSON stored as a GitHub secret.  
Without this, Actions cannot push to ACR or talk to AKS.

```yaml
      - name: Set image name
        id: image
        run: |
          TAG="${GITHUB_SHA::7}"
          echo "image=${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${TAG}" >> "$GITHUB_OUTPUT"
```
Builds a unique tag from the **first 7 chars of the commit SHA**.  
Example: `statmasteracrab.azurecr.io/statmaster-web:6da5505`  
Unique tags = easy rollback and clear “what’s deployed.”

```yaml
      - name: Build and push to ACR
        run: |
          az acr login --name "$ACR_NAME"
          docker build -t "${{ steps.image.outputs.image }}" .
          docker push "${{ steps.image.outputs.image }}"
```
1. Authenticate Docker to your registry  
2. Build image from your `Dockerfile` (Node build + nginx)  
3. Upload image to ACR  

After this, AKS can pull that image (ACR is already attached to the cluster).

---

### Job 2 — `deploy` (CD)

```yaml
  deploy:
    name: Deploy to AKS
    needs: build
    runs-on: ubuntu-latest
```
**Continuous Deployment** — only runs after **build** succeeds.  
Uses a new runner VM (jobs are isolated).

```yaml
    environment: ${{ github.ref_name == 'main' && 'production' || '' }}
```
If branch is **`main`** → use GitHub Environment named **`production`**.  
You can add a required reviewer there so prod waits for your Approve click.  
If branch is **`develop`** → no environment gate → deploy immediately.

```yaml
      - name: Checkout
        uses: actions/checkout@v4
```
Need the `k8s/` YAML files on this runner too.

```yaml
      - name: Azure login
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
```
Login again (new job = new VM).

```yaml
      - name: Set namespace from branch
        id: ns
        run: |
          if [ "${GITHUB_REF_NAME}" = "main" ]; then
            echo "namespace=statmaster-prod" >> "$GITHUB_OUTPUT"
          else
            echo "namespace=statmaster-dev" >> "$GITHUB_OUTPUT"
          fi
```
**Branch → namespace mapping:**
- `main` → `statmaster-prod`  
- anything else this workflow allows (`develop`) → `statmaster-dev`

```yaml
      - name: Get AKS credentials
        run: |
          az aks get-credentials \
            --resource-group "$AKS_RESOURCE_GROUP" \
            --name "$AKS_NAME" \
            --overwrite-existing
```
Downloads kubeconfig onto the runner so `kubectl` points at **your** cluster.

```yaml
      - name: Apply manifests
        run: |
          IMAGE="${{ needs.build.outputs.image }}"
          NS="${{ steps.ns.outputs.namespace }}"
          sed "s|IMAGE_TO_REPLACE|${IMAGE}|g" k8s/deployment.yaml \
            | kubectl apply -n "$NS" -f -
          kubectl apply -n "$NS" -f k8s/service.yaml
          kubectl rollout status deployment/statmaster-web -n "$NS" --timeout=180s
```
1. Take image URL from the build job  
2. Replace `IMAGE_TO_REPLACE` in Deployment YAML with that real image  
3. `kubectl apply` into the chosen namespace (create or update)  
4. Apply the Service (LoadBalancer)  
5. Wait up to 180s until the new Pods are ready  

```yaml
      - name: Show public IP (LoadBalancer)
        run: |
          NS="${{ steps.ns.outputs.namespace }}"
          kubectl get svc statmaster-web -n "$NS" -o wide
```
Prints the Service — after a minute or two the **EXTERNAL-IP** is the URL to open in a browser.

---

## End-to-end picture

```text
merge/push to develop
  → build image → ACR
  → deploy namespace statmaster-dev
  → open EXTERNAL-IP (dev)

merge/push to main
  → build image → ACR
  → (optional) wait for production approval
  → deploy namespace statmaster-prod
  → open EXTERNAL-IP (prod)
```

Same pipeline code. **Branch chooses environment.**

---

## What you still need before it runs

1. GitHub secret **`AZURE_CREDENTIALS`** (service principal JSON)  
2. Branch **`develop`** (create + push)  
3. Optional: repo **Settings → Environments → production** → required reviewers  
4. Commit + push workflow + k8s files to GitHub  

Next step when you’re ready: Cloud Shell commands to create the service principal.

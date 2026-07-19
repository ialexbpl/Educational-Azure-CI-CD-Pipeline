# StatMaster — Jenkins Walkthrough

Parallel CI/CD path for the same app: **Docker image → Azure Container Registry → AKS** (`statmaster-dev` / `statmaster-prod`).

- GitHub Actions journey: [`WALKTHROUGH.md`](./WALKTHROUGH.md)
- This file: Jenkins on your PC (Docker), same Azure targets

**Repo:** https://github.com/ialexbpl/Educational-Azure-CI-CD-Pipeline  

**Why Jenkins locally?** Protects ~€80 Azure credit. Same `Jenkinsfile` can later run on an Azure VM.

Screenshots: [`workalong images jenkins/`](./workalong%20images%20jenkins/)


**Status:** We hit a **wall** on local Jenkins full deploy (see **WALL** below). GitHub Actions remains the working CD path.

---

## WALL - where we stopped

Local Jenkins got far, then blocked by **Azure for Students** + **Docker-on-Windows**.

### What already worked

| Step | Result |
|------|--------|
| Jenkins LTS in Docker | UI on http://localhost:8080 |
| Plugins | Pipeline, Git, Credentials Binding |
| 4 Azure credentials in Jenkins | SP configured |
| Pipeline job `statmaster-cicd` from GitHub | Checkout from `develop` OK |
| `az login` (service principal) | Success - subscription Azure for Students |

### Where it failed

```text
az acr build ...
ERROR: TasksOperationsNotAllowed
ACR Tasks requests for the registry statmasteracrab ... are not permitted.
```

**Meaning:** ACR **Tasks** (cloud build via `az acr build`) are **not allowed** on this Students subscription.

### Why we did not force Docker-in-Jenkins on the PC

To `docker build` / `docker push` from the Jenkins container you must remount with the host Docker socket, install Docker CLI inside Jenkins, and copy `jenkins_home`. That is fragile on Docker Desktop for Windows and leaves extra data on the machine. We **stopped** rather than paper over it for a student demo.

### What still works for real deploys

**GitHub Actions** builds on GitHub runners, pushes ACR, deploys AKS (already proven for `statmaster-dev`). See WALKTHROUGH.md.

### Clean way past the wall

Run Jenkins on a **small Azure VM** with Docker + az + kubectl on the VM:

```text
GitHub -> Jenkins on Azure VM -> docker build/push ACR -> kubectl apply AKS
```

Deallocate the VM when not demoing so credit lasts.

**Interview line:** We validated Jenkins Pipeline-as-Code and Azure SP auth locally. ACR Tasks are disallowed on Azure for Students, and Docker-in-Docker on a Windows laptop was not worth the ops noise. The production-shaped setup is Jenkins on a locked-down Azure VM with the same Jenkinsfile; until then GitHub Actions owns CD.

---
---

## How this compares to GitHub Actions

| | GitHub Actions | Jenkins (this guide) |
|--|----------------|----------------------|
| Where it runs | GitHub’s cloud | Docker container on your PC |
| Pipeline file | `.github/workflows/ci-cd.yml` | `Jenkinsfile` |
| Secrets | GitHub `AZURE_CREDENTIALS` | Jenkins Credentials UI |
| Trigger (start simple) | `git push` | Manual “Build with Parameters” |
| Deploy target | Same ACR + AKS namespaces | Same |

```text
GitHub repo
    → Jenkins (local Docker)
        → docker build
        → push ACR (statmasteracrab)
        → kubectl apply
            → statmaster-dev  or  statmaster-prod
```

---

## Checklist

- [x] Step 1 — Run Jenkins container + unlock + admin
- [x] Step 2 — Plugins (Pipeline / Git / Credentials Binding)
- [x] Step 3 — Azure credentials in Jenkins
- [x] Step 4 — `Jenkinsfile` + `az`/`kubectl` in container
- [x] Step 5 — Pipeline job; checkout + **Azure login OK**
- [x] **WALL** — `az acr build` → `TasksOperationsNotAllowed` (Students)
- [ ] Skipped for now — Docker socket remount on PC (too messy)
- [ ] Later — Jenkins on Azure VM to finish CD
- [ ] Optional — prod deploy from Jenkins

---

## Step 1 — Download and run the Jenkins container

You **pull a Jenkins image** and run it. No separate Windows installer.

### 1. Start Docker Desktop

Wait until it says Docker is running.

### 2. Run Jenkins LTS

```powershell
docker run -d --name jenkins-statmaster -p 8080:8080 -p 50000:50000 jenkins/jenkins:lts
```

### 3. Open the UI

Browser: **http://localhost:8080**

You should see **Unlock Jenkins** (password field + Continue).

![Unlock Jenkins](./workalong%20images%20jenkins/Installed_jenkins_container.png)

### 4. Get the unlock password

```powershell
docker exec jenkins-statmaster cat /var/jenkins_home/secrets/initialAdminPassword
```

Paste into **Administrator password** → **Continue**.

### 5. Customize Jenkins

1. Choose **Install suggested plugins** (wait until it finishes)
2. **Create First Admin User** — username + password you will remember → Save
3. Instance URL can stay `http://localhost:8080/` → Save and Finish → **Start using Jenkins**

### 6. Done when

Blue Jenkins **Dashboard** (Welcome to Jenkins).

**Useful commands**

```powershell
docker ps --filter name=jenkins-statmaster
docker stop jenkins-statmaster
docker start jenkins-statmaster
```

---

## Step 2 — Extra plugins

Needed so the pipeline can talk to Git, bind secrets, and (later) run shell with Azure tools.

### In the Jenkins UI

1. Left menu → **Manage Jenkins**
2. **Plugins**
3. **Available plugins** tab
4. Search and tick these (names may be slightly different — pick the official ones):

| Search for | Why |
|------------|-----|
| **Pipeline** | Declarative `Jenkinsfile` jobs (often already installed with suggested plugins) |
| **Git** | Clone your GitHub repo (often already installed) |
| **Credentials Binding** | Inject secrets into the build as env vars |
| **Pipeline: Stage View** | Nice stage UI (optional) |
| **Docker Pipeline** | Optional helpers for Docker in pipelines |

5. Click **Install** (or Install without restart)
6. When done, if asked → **Restart Jenkins when installation is complete** (or restart container):

```powershell
docker restart jenkins-statmaster
```

7. Log in again at http://localhost:8080

### If some plugins fail (Installation Failures)

Common on first install (network / mirror). For this project you **must** have:

- Pipeline (green)
- Git (green)
- Credentials Binding (green)

You can **ignore** failures like Email Extension, Dark Theme, GitHub Branch Source, Pipeline Graph View. Continue the wizard and create the admin user.

Retry once if you want; if they fail again, skip and move on.

---

## Step 3 — Azure credentials in Jenkins

Reuse the same Entra app as GitHub Actions: **`github-statmaster-cicd`**.  
Secrets live in Jenkins — **never** in Git.

![Jenkins dashboard](./workalong%20images%20jenkins/Jenkins_setup_done.png)

### Where to get the values

| Jenkins ID (exact) | Where in Azure Portal |
|--------------------|------------------------|
| `AZURE_CLIENT_ID` | Entra → App registrations → `github-statmaster-cicd` → **Application (client) ID** |
| `AZURE_TENANT_ID` | Same Overview → **Directory (tenant) ID** |
| `AZURE_CLIENT_SECRET` | Certificates & secrets → create a **new** client secret if you lost the old Value (copy Value once) |
| `AZURE_SUBSCRIPTION_ID` | Subscriptions → Azure for Students → Subscription ID |

### Add four “Secret text” credentials

1. Jenkins → **Manage Jenkins** (gear)
2. **Credentials** → **System** → **Global credentials (unrestricted)** → **Add Credentials**
3. For **each** of the four rows below:
   - **Kind:** Secret text  
   - **Secret:** paste the real value  
   - **ID:** type exactly as in the table (case-sensitive)  
   - **Description:** e.g. `Azure client id`  
   - **Create**

| ID | Secret |
|----|--------|
| `AZURE_CLIENT_ID` | Application (client) ID |
| `AZURE_CLIENT_SECRET` | Client secret **Value** |
| `AZURE_TENANT_ID` | Directory (tenant) ID |
| `AZURE_SUBSCRIPTION_ID` | Subscription ID |

4. When finished you should see **4** global credentials with those IDs.

Reply **creds done** when all four exist (do not paste the secrets in chat).

---

## Step 4 — Add `Jenkinsfile` to the repo

Create a file named **`Jenkinsfile`** in the **project root** (same level as `Dockerfile`), with this content:

```groovy
pipeline {
  agent any

  parameters {
    choice(name: 'TARGET_ENV', choices: ['dev', 'prod'], description: 'AKS namespace: dev or prod')
  }

  environment {
    ACR_NAME           = 'statmasteracrab'
    ACR_LOGIN_SERVER   = 'statmasteracrab.azurecr.io'
    IMAGE_NAME         = 'statmaster-web'
    AKS_RESOURCE_GROUP = 'rg-statmaster'
    AKS_NAME           = 'aks-statmaster'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Azure login') {
      steps {
        withCredentials([
          string(credentialsId: 'AZURE_CLIENT_ID',       variable: 'AZURE_CLIENT_ID'),
          string(credentialsId: 'AZURE_CLIENT_SECRET',   variable: 'AZURE_CLIENT_SECRET'),
          string(credentialsId: 'AZURE_TENANT_ID',       variable: 'AZURE_TENANT_ID'),
          string(credentialsId: 'AZURE_SUBSCRIPTION_ID', variable: 'AZURE_SUBSCRIPTION_ID')
        ]) {
          sh '''
            az login --service-principal \
              -u "$AZURE_CLIENT_ID" \
              -p "$AZURE_CLIENT_SECRET" \
              --tenant "$AZURE_TENANT_ID"
            az account set --subscription "$AZURE_SUBSCRIPTION_ID"
          '''
        }
      }
    }

    stage('Build and push') {
      steps {
        script {
          def tag = env.GIT_COMMIT.take(7)
          env.IMAGE = "${env.ACR_LOGIN_SERVER}/${env.IMAGE_NAME}:${tag}"
        }
        sh '''
          az acr login --name "$ACR_NAME"
          docker build -t "$IMAGE" .
          docker push "$IMAGE"
        '''
      }
    }

    stage('Deploy to AKS') {
      steps {
        script {
          env.NAMESPACE = (params.TARGET_ENV == 'prod') ? 'statmaster-prod' : 'statmaster-dev'
        }
        sh '''
          az aks get-credentials \
            --resource-group "$AKS_RESOURCE_GROUP" \
            --name "$AKS_NAME" \
            --overwrite-existing
          sed "s|IMAGE_TO_REPLACE|${IMAGE}|g" k8s/deployment.yaml \
            | kubectl apply -n "$NAMESPACE" -f -
          kubectl apply -n "$NAMESPACE" -f k8s/service.yaml
          kubectl rollout status deployment/statmaster-web -n "$NAMESPACE" --timeout=180s
          kubectl get svc statmaster-web -n "$NAMESPACE" -o wide
        '''
      }
    }
  }
}
```

### What it does (same as Actions)

| Stage | Meaning |
|-------|---------|
| Checkout | Clone repo |
| Azure login | SP login using the 4 Jenkins credentials |
| Build and push | `docker build` → ACR |
| Deploy | `dev` → `statmaster-dev`, `prod` → `statmaster-prod` |

Save the file. Commit later when we push (or keep local until the Jenkins job is wired).

Reply **Jenkinsfile done** when the file exists in the project root.

---

## Step 4b — Install Azure CLI + kubectl inside Jenkins

Your Jenkins container is a plain LTS image: no `az` / `kubectl` yet.  
We use **`az acr build`** (build in Azure) so you do **not** need Docker-inside-Jenkins.

### Install tools (PowerShell)

```powershell
docker exec -u root jenkins-statmaster bash -c "apt-get update && apt-get install -y curl apt-transport-https lsb-release gnupg ca-certificates"

docker exec -u root jenkins-statmaster bash -c "curl -sL https://aka.ms/InstallAzureCLIDeb | bash"

docker exec -u root jenkins-statmaster bash -c "curl -LO https://dl.k8s.io/release/v1.31.0/bin/linux/amd64/kubectl && install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl && rm -f kubectl"
```

### Verify

```powershell
docker exec jenkins-statmaster az version
docker exec jenkins-statmaster kubectl version --client
```

Both should print version info (az may take a minute on first install).

### Student subscription note — `az acr build` blocked

Azure for Students often returns `TasksOperationsNotAllowed` for ACR Tasks.  
**Fix:** use `docker build` + `docker push` from Jenkins, with the Docker socket mounted into the container (Step 4d below).

---

## Step 4d — Give Jenkins access to Docker (SKIPPED - see WALL)

**Status: skipped.** Optional escape hatch only; we hit the wall and chose not to remount Docker socket on the PC.

### Original idea (not recommended here)

Run these in **PowerShell** (keeps your Jenkins config/credentials):

```powershell
mkdir "$env:USERPROFILE\jenkins_home_statmaster" -Force
docker cp jenkins-statmaster:/var/jenkins_home/. "$env:USERPROFILE\jenkins_home_statmaster\"

docker commit jenkins-statmaster jenkins-with-tools:local
docker stop jenkins-statmaster
docker rm jenkins-statmaster

docker run -d --name jenkins-statmaster `
  -p 8080:8080 -p 50000:50000 `
  -v "${env:USERPROFILE}\jenkins_home_statmaster:/var/jenkins_home" `
  -v /var/run/docker.sock:/var/run/docker.sock `
  --restart=unless-stopped `
  jenkins-with-tools:local

docker exec -u root jenkins-statmaster bash -c "apt-get update && apt-get install -y docker.io"
docker exec -u root jenkins-statmaster bash -c "chmod 666 /var/run/docker.sock"

docker exec jenkins-statmaster docker version
```

Then push the updated `Jenkinsfile` (docker build/push) and rebuild the job.

---

## Step 5 — Job + first deploy to dev *(next)*

1. Commit + push `Jenkinsfile` to GitHub (`develop` or `main`)
2. Jenkins → New Item → Pipeline → Pipeline script from SCM
3. Build with Parameters → `dev`

---

## Resources (same as Actions path)

| Resource | Name |
|----------|------|
| Resource group | `rg-statmaster` |
| ACR | `statmasteracrab` → `statmasteracrab.azurecr.io` |
| AKS | `aks-statmaster` |
| Namespaces | `statmaster-dev`, `statmaster-prod` |
| Entra app (SP) | `github-statmaster-cicd` (reuse for Jenkins) |

---

## Capgemini one-liners

- “Same artifact path as Actions; only the orchestrator changes.”
- “Pipeline as Code: `Jenkinsfile` in Git; secrets in Jenkins credentials.”
- “Local Jenkins for learning/cost; production teams often run Jenkins on a VM or K8s.”
- “We hit ACR Tasks blocked on Azure for Students; documented it and kept Actions as the working CD path; VM-hosted Jenkins is the clean unblock.”

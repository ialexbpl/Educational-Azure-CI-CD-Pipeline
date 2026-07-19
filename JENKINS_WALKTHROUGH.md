# StatMaster — Jenkins Walkthrough

Parallel CI/CD path for the same app: **Docker image → Azure Container Registry → AKS** (`statmaster-dev` / `statmaster-prod`).

- GitHub Actions journey: [`WALKTHROUGH.md`](./WALKTHROUGH.md)
- This file: Jenkins on your PC (Docker), same Azure targets

**Repo:** https://github.com/ialexbpl/Educational-Azure-CI-CD-Pipeline  

**Why Jenkins locally?** Protects ~€80 Azure credit. Same `Jenkinsfile` can later run on an Azure VM.

Screenshots: [`workalong images jenkins/`](./workalong%20images%20jenkins/)

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

- [x] Step 1 — Run Jenkins container (Unlock screen reached)
- [x] Step 1b — Suggested plugins: **Pipeline / Git / Credentials Binding** OK (some optional plugins may fail — ignore)
- [x] Step 1c — Admin user + Dashboard (Welcome to Jenkins)
- [x] Step 2 — Confirm plugins / skip optional failures
- [x] Step 4 — Add `Jenkinsfile` to the repo
- [x] Step 4b — Install az + kubectl in Jenkins container
- [x] Step 4c — Switch Build stage to `az acr build`
- [ ] Step 5 — Push Jenkinsfile + create Pipeline job + run `dev`
- [ ] Step 6 — Optional prod deploy

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

### Update Build stage in `Jenkinsfile`

Replace the **Build and push** stage with this (uses ACR cloud build — no local `docker`):

```groovy
    stage('Build and push') {
      steps {
        script {
          def tag = env.GIT_COMMIT ? env.GIT_COMMIT.take(7) : "manual${env.BUILD_NUMBER}"
          env.IMAGE_TAG = tag
          env.IMAGE = "${env.ACR_LOGIN_SERVER}/${env.IMAGE_NAME}:${tag}"
        }
        sh '''
          az acr build \
            --registry "$ACR_NAME" \
            --image "${IMAGE_NAME}:${IMAGE_TAG}" \
            .
        '''
      }
    }
```

Leave the other stages as they are.

Reply **tools done** when `az` and `kubectl` work and the Jenkinsfile Build stage is updated.

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

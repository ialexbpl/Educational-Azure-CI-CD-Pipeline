# `deployment.yaml` — line-by-line explanation

This file tells Kubernetes **how to run** your StatMaster web container.  
GitHub Actions will later replace `IMAGE_TO_REPLACE` with a real ACR image tag.

---

```yaml
apiVersion: apps/v1
```
**Which Kubernetes API version** this object uses.  
`apps/v1` is the stable API group for Deployments.

```yaml
kind: Deployment
```
**What kind of object** this is.  
A Deployment manages Pods and can roll out new versions (restart pods with a new image) safely.

```yaml
metadata:
```
**Name and labels** for the Deployment itself (not the Pods yet).

```yaml
  name: statmaster-web
```
**Unique name** of this Deployment inside a namespace (`statmaster-dev` or `statmaster-prod`).  
You use this name with commands like `kubectl get deploy statmaster-web`.

```yaml
  labels:
    app: statmaster-web
```
**Key/value tags** on the Deployment object.  
Useful for filtering (`kubectl get deploy -l app=statmaster-web`) and organization.

```yaml
spec:
```
**Desired state** of the Deployment — what Kubernetes should keep true.

```yaml
  replicas: 1
```
**How many Pod copies** to run.  
`1` saves money on your student cluster. Prod could use `2` later for basic redundancy.

```yaml
  selector:
    matchLabels:
      app: statmaster-web
```
**Which Pods belong to this Deployment.**  
The Deployment only manages Pods that have label `app: statmaster-web`.  
This **must match** the Pod template labels below, or Kubernetes rejects the YAML.

```yaml
  template:
```
**Blueprint for each Pod** the Deployment creates.  
Every replica is created from this template.

```yaml
    metadata:
      labels:
        app: statmaster-web
```
**Labels stuck on each Pod.**  
Must match `spec.selector.matchLabels` above.  
Also what the Service uses to find Pods (`selector: app: statmaster-web`).

```yaml
    spec:
```
**Pod spec** — containers, ports, probes, resources inside one Pod.

```yaml
      containers:
```
**List of containers** in the Pod.  
You have one container (the nginx + frontend image).

```yaml
        - name: web
```
**Container name** inside the Pod (for logs: `kubectl logs … -c web`).

```yaml
          image: IMAGE_TO_REPLACE
```
**Which container image to run.**  
Placeholder for now. CI/CD replaces it with something like:  
`statmasteracrab.azurecr.io/statmaster-web:abc1234`

```yaml
          imagePullPolicy: Always
```
**When to pull the image from ACR.**  
`Always` = check registry every time the Pod starts.  
Good when you reuse tags like `dev` / `latest` and want fresh pulls.  
With unique git-sha tags, `IfNotPresent` is also fine.

```yaml
          ports:
            - name: http
              containerPort: 80
```
**Port the app listens on inside the container.**  
`80` matches nginx.  
`name: http` lets probes and Services refer to the port by name instead of the number.

```yaml
          readinessProbe:
            httpGet:
              path: /healthz
              port: http
            initialDelaySeconds: 3
            periodSeconds: 10
```
**“Is this Pod ready for traffic?”**  
Kubernetes calls `GET /healthz` on port `http` (80).  
- Wait **3s** after start before first check  
- Then every **10s**  
If it fails, the Pod is removed from the Service endpoints (no user traffic) but may stay running.

```yaml
          livenessProbe:
            httpGet:
              path: /healthz
              port: http
            initialDelaySeconds: 10
            periodSeconds: 20
```
**“Is this Pod still alive?”**  
Same `/healthz` endpoint.  
- First check after **10s**  
- Then every **20s**  
If it keeps failing, Kubernetes **restarts** the container (stuck process recovery).

```yaml
          resources:
            requests:
              cpu: 25m
              memory: 64Mi
```
**Guaranteed minimum** the scheduler reserves for this container.  
`25m` = 0.025 CPU (small). `64Mi` = 64 mebibytes RAM.  
Helps packing Pods onto your single small AKS node.

```yaml
            limits:
              cpu: 200m
              memory: 128Mi
```
**Hard cap** this container may use.  
Above this, CPU is throttled / memory may OOM-kill the container.  
Keeps one app from starving the whole node (important with 1 small VM).

---

## How this fits the CI/CD pipe

```text
GitHub Actions builds image → pushes to ACR
        ↓
Updates image: in this Deployment (or sets it at apply time)
        ↓
kubectl apply -n statmaster-dev|statmaster-prod -f k8s/
        ↓
Deployment creates/updates Pods → nginx serves your SPA
```

Branch chooses **namespace**; this file chooses **how the app runs**.

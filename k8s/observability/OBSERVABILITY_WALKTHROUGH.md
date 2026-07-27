# Observability DIY — Loki + Promtail + Grafana na AKS

Instrukcja **zrób to sam** na Twoim klastrze StatMaster (1× `B2als_v2`, ~4 GB RAM).  
Czytaj → wykonuj komendy u siebie → zrób screenshot do rozmowy.

Oficjalne docs: [Install monolithic Loki (Helm)](https://grafana.com/docs/loki/latest/setup/install/helm/install-monolithic/).

---

## 1. Co wdrażasz i po co

```text
  Pody (statmaster-web, kube-system, …)
           │  logi kontenerów
           ▼
     Promtail (DaemonSet na każdym node)
           │  push HTTP
           ▼
     Loki (1× monolithic)  ← magazyn logów
           │  query (LogQL)
           ▼
     Grafana  ← UI Explore / dashboards
```


| Element      | Rola                                                                         |
| ------------ | ---------------------------------------------------------------------------- |
| **Promtail** | Agent: czyta logi z `/var/log/pods` i etykietuje (`namespace`, `pod`, `app`) |
| **Loki**     | Przechowuje logi (indeksuje **etykiety**, nie pełny tekst jak Elasticsearch) |
| **Grafana**  | Przeglądarka logów; datasource = Loki                                        |


Twoja appka **nie musi się zmieniać** — nginx już pisze logi na stdout.

**Uwaga na rozmowę:** Promtail jest w trybie maintenance; następca to **Grafana Alloy**. Na demo klasyczny zestaw „Loki + Promtail + Grafana” nadal jest OK i często pada w rozmowach.

---



## 2. Czy Twój klaster to uniesie?


| Ryzyko                                       | Jak złagodzić                                                                                  |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Mało RAM (1 node)                            | Lekki Loki (filesystem, **bez** MinIO), małe limity, wyłącz canary/cache                       |
| OOM / Pending pods                           | Najpierw `kubectl top nodes` / `kubectl describe nodes`                                        |
| Koszt                                        | Tylko RAM/CPU node’a + ewentualnie 2. LoadBalancer (Grafana) — lepiej **port-forward** na demo |
| Pełny chart „single replica” z MinIO + cache | Za ciężki na Students — **nie kopiuj blind** oficjalnego przykładu z MinIO                     |


Zatrzymaj AKS, gdy nie ćwiczysz (`az aks stop`), żeby nie zjadać €80.

---



## 3. Wymagania u Ciebie (lokalnie)

1. Klaster działa, kontekst kubectl = `aks-statmaster`.
2. Helm 3: `helm version`.
3. Namespace appki ma pody: `kubectl get pods -n statmaster-dev`.

Sprawdź miejsce:

```powershell
az aks get-credentials --resource-group rg-statmaster --name aks-statmaster --overwrite-existing
kubectl get nodes
kubectl get pods -A
```

---



## 4. Plan instalacji (kolejność)

1. Namespace `observability`
2. **Loki** (Helm, tryb Monolithic, filesystem)
3. **Promtail** → URL Loki
4. **Grafana** → datasource Loki
5. W Grafana Explore: zapytanie LogQL na `statmaster-web`
6. Screenshot + (opcjonalnie) wpis w README

Nie pakuj tego do GitHub Actions na start — najpierw ręcznie, jak portal przed Terraform.

---



## 5. Krok po kroku



### 5.1 Repo Helm

```powershell
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add grafana-community https://grafana-community.github.io/helm-charts
helm repo update

kubectl create namespace observability
```



### 5.2 Plik `loki-values.yaml` (lekki pod Students)

Utwórz lokalnie (np. w `k8s/observability/loki-values.yaml` — możesz dodać do repo później):

```yaml
# Lekki Loki na 1 małym node (demo). Nie używaj MinIO na B2als_v2.
deploymentMode: Monolithic

loki:
  auth_enabled: false
  commonConfig:
    replication_factor: 1
  storage:
    type: filesystem
  schemaConfig:
    configs:
      - from: "2024-04-01"
        store: tsdb
        object_store: filesystem
        schema: v13
        index:
          prefix: loki_index_
          period: 24h
  limits_config:
    retention_period: 72h

singleBinary:
  replicas: 1
  resources:
    requests:
      cpu: 50m
      memory: 128Mi
    limits:
      cpu: 500m
      memory: 512Mi
  persistence:
    enabled: true
    size: 5Gi

# Wyłącz ciężkie dodatki
minio:
  enabled: false
chunksCache:
  enabled: false
resultsCache:
  enabled: false
lokiCanary:
  enabled: false
test:
  enabled: false

gateway:
  enabled: true
  resources:
    requests:
      cpu: 20m
      memory: 32Mi
    limits:
      cpu: 100m
      memory: 64Mi

# Wyzeruj tryby distributed / simple scalable
backend:
  replicas: 0
read:
  replicas: 0
write:
  replicas: 0
ingester:
  replicas: 0
querier:
  replicas: 0
queryFrontend:
  replicas: 0
queryScheduler:
  replicas: 0
distributor:
  replicas: 0
compactor:
  replicas: 0
indexGateway:
  replicas: 0
bloomPlanner:
  replicas: 0
bloomBuilder:
  replicas: 0
bloomGateway:
  replicas: 0
```

Jeśli `helm install` krzyczy na nieznane klucze — porównaj z:

```powershell
helm show values grafana-community/loki > loki-chart-defaults.yaml
```

i dostosuj nazwy (chart się zmienia; idea: **Monolithic + filesystem + bez MinIO + małe resources**).

### 5.3 Instalacja Loki

```powershell
helm install loki grafana-community/loki `
  -n observability `
  -f loki-values.yaml

kubectl get pods -n observability -w
```

Poczekaj aż pod(y) Loki / gateway są `Running`.  
URL wewnątrz klastra (do Promtail / Grafana) zwykle:

`http://loki-gateway.observability.svc.cluster.local`

(dokładną nazwę Service sprawdź: `kubectl get svc -n observability`)

### 5.4 Promtail

```powershell
helm install promtail grafana/promtail `
  -n observability `
  --set "config.clients[0].url=http://loki-gateway.observability.svc.cluster.local/loki/api/v1/push"
```

Jeśli gateway ma inną nazwę albo ścieżkę — popraw URL po `kubectl get svc`.

Sprawdź DaemonSet:

```powershell
kubectl get pods -n observability -l app.kubernetes.io/name=promtail
kubectl logs -n observability -l app.kubernetes.io/name=promtail --tail=50
```



### 5.5 Grafana

**Opcja A — port-forward (zalecane na demo, bez 2. publicznego IP):**

```powershell
helm install grafana grafana/grafana `
  -n observability `
  --set adminPassword='XYZ' `
  --set service.type=ClusterIP `
  --set resources.requests.memory=128Mi `
  --set resources.limits.memory=256Mi

kubectl get secret -n observability grafana -o jsonpath="{.data.admin-password}" 
# jeśli chart wygenerował własne hasło — zdekoduj Base64; albo użyj tego co ustawiłeś

kubectl port-forward -n observability svc/grafana 3000:80
```

Otwórz: `http://localhost:3000`  
Login: `admin` / hasło z values lub z Secret.

**Opcja B — LoadBalancer** (wygodniej publicznie, drożej / więcej powierzchni ataku):

```powershell
--set service.type=LoadBalancer
```



### 5.6 Datasource Loki w Grafana

1. **Connections → Data sources → Add → Loki**
2. URL: `http://loki-gateway.observability.svc.cluster.local`
3. Save & test → powinno być zielone.

(Albo przy `helm install grafana` dodaj provisioning — na start UI wystarczy.)

### 5.7 Pierwsze zapytanie (LogQL)

**Explore** → datasource Loki, np.:

```logql
{namespace="statmaster-dev"}
```

albo:

```logql
{namespace="statmaster-dev", pod=~"statmaster-web.*"}
```

Wygeneruj ruch: otwórz LoadBalancer IP aplikacji / odśwież stronę, wróć do Explore.

Screenshot: Grafana z logami nginx + po lewej lista podów w `observability` — idealne na rozmowę.

---



## 6. Weryfikacja (checklist)

```powershell
kubectl get all -n observability
kubectl top pods -n observability   # jeśli metrics-server jest
```


| Check    | OK gdy                         |
| -------- | ------------------------------ |
| Loki     | Pod Running, brak CrashLoop    |
| Promtail | 1 pod na node (DaemonSet)      |
| Grafana  | UI + datasource Test OK        |
| LogQL    | Widać linie z `statmaster-dev` |


---



## 7. Sprzątanie (ważne przy €80)

```powershell
helm uninstall grafana -n observability
helm uninstall promtail -n observability
helm uninstall loki -n observability
kubectl delete namespace observability
# PVC mogą zostać — sprawdź:
kubectl get pvc -A
```

Albo cały klaster: `az aks stop` / `terraform destroy` gdy nie demoujesz.

---



## 8. Co commitnąć do repo (opcjonalnie, po udanym install)

```text
k8s/observability/
  loki-values.yaml
  explanation.md      # skrót „dlaczego ten stack”
OBSERVABILITY_WALKTHROUGH.md   # ten plik
```

Nie commituj haseł admina w plaintext w README — hasło tylko lokalnie / Secret.

---



## 9. Co mówić na rozmowie

> „Do logów w Kubernetes wybrałem **Loki + Promtail + Grafana**: Promtail zbiera stdout z podów, Loki trzyma logi po labelach, Grafana służy do Explore.  
> Na małym AKS Students postawiłem **Loki monolithic + filesystem**, bez MinIO i bez ciężkich cache’y, żeby zmieścić się w RAM.  
> W prod dałbym object storage (np. Azure Blob), retencję, HA i raczej **Alloy** zamiast Promtail.”

---



## 10. Jeśli coś padnie


| Objaw                           | Co sprawdzić                                                                       |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| `Pending` / Insufficient memory | Zmniejsz limits, wyłącz cache/canary, usuń zbędne pody                             |
| Promtail nie pushuje            | URL gateway, logi Promtail, NetworkPolicy (u Ciebie zwykle brak)                   |
| Grafana „Data source error”     | Nazwa Service Loki, namespace, port-forward vs in-cluster URL                      |
| Helm values invalid             | `helm show values` i porównaj z wersją chartu                                      |
| Chart za ciężki mimo values     | Ostateczność: odłóż observability; opisz jako next step — projekt i tak jest mocny |


---



## 11. Kolejność „jak portal → Terraform”

1. Ty robisz to **ręcznie Helm** (ten dokument).
2. Jak działa — wtedy values w repo + krótki explanation.
3. (Później) można owinąć w Terraform `helm_release` — **nie musisz** przed rozmową.


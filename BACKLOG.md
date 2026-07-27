# StatMaster backlog

## Done
- [x] Azure for Students + RG `rg-statmaster` (Poland Central)
- [x] ACR `statmasteracrab` (Basic)
- [x] AKS `aks-statmaster` (1 × B2als_v2, ACR attached, monitoring off)
- [x] Namespaces `statmaster-dev` / `statmaster-prod`
- [x] GitHub `ialexbpl/Educational-Azure-CI-CD-Pipeline`
- [x] Dockerfile + nginx + local smoke test
- [x] K8s manifests + explanations
- [x] GitHub Actions `ci-cd.yml` + explanation
- [x] Entra app + Contributor + secret `AZURE_CREDENTIALS`
- [x] `develop` branch + green Actions → dev pod + LoadBalancer IP
- [x] `WALKTHROUGH.md` updated through live CI/CD
- [x] Polished `README.md` with workalong screenshots

## Next
- [x] Terraform clean start — `apply` OK (RG + ACR + AKS + AcrPull)
- [x] Namespaces + Actions deploy on new cluster (dev)
- [x] Terraform workalong screenshots moved + mostly redacted
- [ ] Re-blur Subscription ID on `Workalong images terraform/login_to_azure_cli.png`
- [ ] **Later:** Terraform Entra app + SP/OIDC + Contributor for CI/CD
- [ ] Optional: Jenkins on Azure VM
- [ ] Budget: `terraform destroy` or `az aks stop` when idle
- [ ] Prod deploy on new TF cluster (`main`) if not done yet

## Notes
- Terraform now: RG + ACR + AKS + AcrPull only
- CI/CD “robot user” still portal for now — planned as later Terraform (`azuread`)
- GitHub Actions remains the reliable app deploy path


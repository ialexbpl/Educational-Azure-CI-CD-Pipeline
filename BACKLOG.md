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
- [ ] Merge `develop` → `main` → verify `statmaster-prod` (if not done)
- [ ] Optional: GitHub Environment `production` with required reviewers
- [ ] Budget alert + destroy AKS when idle
- [ ] Later: Terraform/Bicep IaC
- [ ] Later: Jenkins / Azure DevOps remake

## Notes
- Keep remote `develop` — do not delete after merging to main
- Budget ~€80 — AKS node is the main burn
- Promote via branch: develop=dev, main=prod
- README images use `Workalong images/` (Subscription IDs blurred in screenshots)

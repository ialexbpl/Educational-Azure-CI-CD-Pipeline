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
- [ ] Jenkins path — follow `JENKINS_WALKTHROUGH.md` (Step 1: container)
- [ ] Optional: GitHub Environment `production` with required reviewers
- [ ] Budget alert + destroy AKS when idle
- [ ] Later: Terraform/Bicep IaC
- [ ] Later: Azure DevOps remake

## Notes
- Keep `WALKTHROUGH.md` for Actions; Jenkins lives only in `JENKINS_WALKTHROUGH.md`
- Budget ~€80 — AKS node is the main burn; Jenkins runs locally in Docker
- Promote via branch (Actions): develop=dev, main=prod


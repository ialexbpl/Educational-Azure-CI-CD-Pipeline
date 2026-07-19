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
- [ ] Optional: Jenkins on a small Azure VM (past the local Docker wall) — see `JENKINS_WALKTHROUGH.md` → WALL
- [ ] Optional: GitHub Environment `production` with required reviewers
- [ ] Budget alert + destroy AKS when idle
- [ ] Later: Terraform/Bicep IaC
- [ ] Later: Azure DevOps remake

## Notes
- Keep `WALKTHROUGH.md` for Actions; Jenkins lives in `JENKINS_WALKTHROUGH.md`
- Jenkins local path hit wall: Students block ACR Tasks; Docker-in-Jenkins on Windows deferred
- GitHub Actions remains the reliable deploy path
- Budget ~€80 — AKS is main burn; don’t leave a Jenkins VM running 24/7


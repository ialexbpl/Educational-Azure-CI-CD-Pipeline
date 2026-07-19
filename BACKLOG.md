# StatMaster backlog

## Done
- [x] Azure for Students subscription identified
- [x] Resource group `rg-statmaster` (Poland Central)
- [x] ACR `statmasteracrab` (Basic)
- [x] AKS `aks-statmaster` (1 × B2als_v2 system pool, ACR attached, monitoring off)
- [x] Namespaces `statmaster-dev` / `statmaster-prod`
- [x] GitHub remote `ialexbpl/Educational-Azure-CI-CD-Pipeline`
- [x] Walkthrough through Docker/nginx (`WALKTHROUGH.md`)
- [x] Dockerfile + nginx.conf + .dockerignore
- [x] Local docker build smoke test

## In progress
- [x] `.github/workflows/ci-cd.yml` + explanation
- [x] Azure SP + GitHub secret `AZURE_CREDENTIALS`
- [ ] `develop` branch + production environment approval
- [ ] First green Actions run → `statmaster-dev`

## Next
- [ ] First green Actions run → deploy to `statmaster-dev`
- [ ] Gated deploy to `statmaster-prod`
- [ ] Budget alert + destroy cluster when idle
- [ ] Later: Terraform/Bicep IaC
- [ ] Later: Jenkins / Azure DevOps remake

## Notes
- Budget ~€80 — AKS node is the main burn
- Promote same image digest from dev → prod when possible
- Local remote may need `git remote set-url` if it still says `frontend-StatMaster`

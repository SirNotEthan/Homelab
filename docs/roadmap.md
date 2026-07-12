# Roadmap

Milestones describe capabilities and evidence, not target dates. A milestone is
complete only when its documentation and recovery path match the implementation.

## v0.1 - Repository foundation

- [x] Repository structure and project standards
- [x] Hardware inventory
- [x] Target architecture and initial ADRs
- [x] Security, storage, backup, and disaster-recovery plans
- [x] Contribution and release workflow

## v0.2 - Host and network baseline

- [x] Remove double NAT and establish the LAN addressing plan
- [x] Decide DNS and certificate approach
- [x] Define and automate the Ubuntu host baseline
- [x] Automate Tailscale and host configuration
- [x] Rebuild one pilot node from a clean installation
- [x] Record a timed node-rebuild exercise

## v0.3 - k3s foundation

- [x] Bootstrap the control plane and workers
- [ ] Configure ingress and certificate management
  - [x] Install and validate Traefik ingress
  - [x] Install cert-manager and issue the wildcard certificate
- [x] Deploy and test persistent storage
- [ ] Define namespaces, resource limits, and network policies
- [ ] Back up and restore the k3s datastore
  - [x] Create and copy first manual k3s SQLite backup
  - [x] Automate daily local and backup-host k3s SQLite backups
  - [ ] Test k3s datastore restore
- [x] Record a repeatable cluster status check

## v0.4 - Platform services

- [x] Deploy Homepage
- [ ] Deploy metrics, dashboards, alerting, and logs
  - [x] Deploy metrics, dashboards, and alerting
  - [x] Deploy cluster log collection and storage
  - [x] Reconcile logging from `main`
- [x] Deploy Authentik and document break-glass access
  - [x] Deploy Authentik
  - [x] Reconcile Authentik from `main`
  - [x] Document break-glass access
    - [x] Record emergency access paths
    - [x] Create local private notes file for sensitive storage locations
    - [x] Run initial connectivity test
    - [x] Test local admin logins
- [x] Add health checks and backup plans for every platform service

## v0.5 - GitOps and automated recovery

- [x] Deploy Argo CD
- [ ] Reconcile platform and applications from `main`
  - [x] Reconcile Argo CD access configuration from `main`
  - [x] Reconcile Homepage from `main`
  - [x] Reconcile cert-manager issuer and certificate configuration from `main`
  - [x] Reconcile monitoring from `main`
  - [x] Reconcile logging from `main`
  - [x] Reconcile Authentik from `main`
- [ ] Implement encrypted secrets management
  - [x] Choose GitOps-compatible encrypted secret approach
  - [x] Document Sealed Secrets operating process
  - [x] Add Sealed Secrets GitOps definition
  - [x] Install Sealed Secrets controller
  - [x] Back up Sealed Secrets controller private key
  - [ ] Migrate manually-created platform Secrets
    - [x] Migrate Grafana admin Secret
    - [x] Migrate Cloudflare API token Secret
- [ ] Automate local and off-site backups
  - [x] Automate local k3s datastore backup
  - [ ] Add off-site encrypted backup target
- [ ] Test application and volume restores

## v1.0 - Reliable personal cloud

- [ ] Critical services meet their backup and monitoring requirements
- [ ] No undocumented manual deployment steps remain
- [ ] Full disaster-recovery exercise completed successfully
- [ ] Security and access review completed
- [ ] Operational documentation matches the running platform

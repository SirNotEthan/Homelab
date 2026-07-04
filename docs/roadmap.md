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
- [ ] Decide DNS and certificate approach
- [x] Define and automate the Ubuntu host baseline
- [x] Automate Tailscale and host configuration
- [x] Rebuild one pilot node from a clean installation
- [x] Record a timed node-rebuild exercise

## v0.3 - k3s foundation

- [ ] Bootstrap the control plane and workers
- [ ] Configure ingress and certificate management
- [ ] Deploy and test persistent storage
- [ ] Define namespaces, resource limits, and network policies
- [ ] Back up and restore the k3s datastore

## v0.4 - Platform services

- [ ] Deploy Homepage
- [ ] Deploy metrics, dashboards, alerting, and logs
- [ ] Deploy Authentik and document break-glass access
- [ ] Add health checks and backup plans for every platform service

## v0.5 - GitOps and automated recovery

- [ ] Deploy Argo CD
- [ ] Reconcile platform and applications from `main`
- [ ] Implement encrypted secrets management
- [ ] Automate local and off-site backups
- [ ] Test application and volume restores

## v1.0 - Reliable personal cloud

- [ ] Critical services meet their backup and monitoring requirements
- [ ] No undocumented manual deployment steps remain
- [ ] Full disaster-recovery exercise completed successfully
- [ ] Security and access review completed
- [ ] Operational documentation matches the running platform

# Disaster recovery

## Objectives

- Rebuild a failed node from documented steps in under one hour.
- Recreate cluster desired state from Git.
- Restore critical application data from an independent backup.
- Recover required DNS, certificates, and credentials.

These are target objectives and remain unverified until timed recovery exercises
are completed.

## Recovery priority

1. Network, DNS, Tailscale, and administrative access
2. k3s control plane and cluster networking
3. GitOps controller, ingress, certificates, and storage
4. Identity and observability
5. Critical stateful applications
6. Non-critical and experimental workloads

## Failed worker node

1. Confirm the failure and preserve useful logs when safe.
2. Drain and remove the node from k3s if it is still reachable.
3. Replace or repair the hardware and verify disk health.
4. Install the documented Ubuntu version and establish Tailscale access.
5. Run the host bootstrap and join the node as a k3s agent.
6. Confirm scheduling, storage replica health, and monitoring.
7. Record any undocumented step as a repository change.

## Failed control-plane node

The initial topology has one control-plane node, so this is a full control-plane
recovery rather than an automatic failover.

1. Provision `m910q-01` or replacement hardware from the host baseline.
2. Restore the most recent verified k3s datastore snapshot.
3. Confirm cluster API access before allowing broad reconciliation.
4. Restore GitOps and platform services in recovery-priority order.
5. Verify persistent volumes and restore application-aware backups as needed.
6. Rotate credentials if compromise, rather than hardware failure, caused the
   incident.

Exact commands will be added alongside bootstrap and backup automation. Until
then, this procedure is a plan, not a tested runbook.

## Complete site loss

Recovery requires a fresh trusted device, access to the Git remote, off-site
backup data, password-manager recovery, and domain/DNS control. Recreate the
minimum control plane first, then restore platform and application state in the
priority order above.

## Recovery test record

| Date | Scenario | Recovery time | Result | Follow-up |
|---|---|---:|---|---|
| Not yet tested | - | - | - | Schedule after backup automation exists |

## After every incident or exercise

- Confirm service health and data consistency.
- Rotate exposed credentials.
- Re-enable backup jobs and verify a new recovery point.
- Update this runbook and relevant ADRs.
- Record the incident, its cause, and prevention work without including secrets.

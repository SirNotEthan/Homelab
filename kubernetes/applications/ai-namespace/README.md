# AI namespace policy

This directory owns shared policy for the `ai` namespace.

Individual applications such as Ollama, Open WebUI, and SearXNG own their own
deployments. This shared application owns namespace-level guardrails that should
apply to every AI workload.

## Resource quota

The namespace quota prevents AI experiments from consuming the whole cluster:

| Resource | Limit |
|---|---:|
| CPU requests | `3` |
| Memory requests | `6Gi` |
| CPU limits | `6` |
| Memory limits | `12Gi` |
| Storage requests | `40Gi` |
| PersistentVolumeClaims | `4` |
| Pods | `8` |

## Default container limits

Containers without explicit resources receive conservative defaults:

| Setting | Value |
|---|---:|
| Default CPU request | `100m` |
| Default memory request | `256Mi` |
| Default CPU limit | `1` |
| Default memory limit | `1Gi` |
| Maximum CPU limit | `4` |
| Maximum memory limit | `8Gi` |

Ollama has explicit resources and is intentionally allowed to use more than the
default container limit.

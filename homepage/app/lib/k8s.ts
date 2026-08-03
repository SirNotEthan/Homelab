import * as k8s from "@kubernetes/client-node";

// Loads from the in-cluster ServiceAccount token when running as a pod, or
// falls back to the caller's kubeconfig when running `next dev` locally.
let kc: k8s.KubeConfig | null = null;

function getKubeConfig(): k8s.KubeConfig {
  if (!kc) {
    kc = new k8s.KubeConfig();
    try {
      kc.loadFromCluster();
    } catch {
      kc.loadFromDefault();
    }
  }
  return kc;
}

export function coreApi() {
  return getKubeConfig().makeApiClient(k8s.CoreV1Api);
}

export function customApi() {
  return getKubeConfig().makeApiClient(k8s.CustomObjectsApi);
}

export function metricsApi() {
  return new k8s.Metrics(getKubeConfig());
}

export const ARGOCD_GROUP = "argoproj.io";
export const ARGOCD_VERSION = "v1alpha1";
export const ARGOCD_NAMESPACE = "argocd";

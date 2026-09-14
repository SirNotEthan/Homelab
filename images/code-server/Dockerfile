FROM docker.io/library/node:22.22.0-bookworm-slim AS node
FROM docker.io/alpine/helm:3.19.0 AS helm
FROM registry.k8s.io/kubectl:v1.36.2 AS kubectl

FROM ghcr.io/coder/code-server:4.136.2

USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      build-essential \
      ca-certificates \
      curl \
      git \
      jq \
      less \
      openssh-client \
      python3 \
      python3-pip \
      python3-venv \
      ripgrep \
    && rm -rf /var/lib/apt/lists/*

COPY --from=node /usr/local/ /usr/local/
COPY --from=helm /usr/bin/helm /usr/local/bin/helm
COPY --from=kubectl /bin/kubectl /usr/local/bin/kubectl

RUN npm install --global pnpm@10.17.1 --force \
    && node --version \
    && npm --version \
    && pnpm --version \
    && python3 --version \
    && kubectl version --client=true \
    && helm version --short

USER 1000:1000

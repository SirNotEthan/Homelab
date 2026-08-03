import type { ApplicationsPayload } from "../lib/api-types";

export const APPLICATIONS: ApplicationsPayload = {
  apps: [
    { id: "jellyfin", name: "Jellyfin", group: "Media & Home", status: "healthy", detail: "Running", url: "https://jellyfin.apps.lab.sirnotethan.uk" },
    { id: "frigate", name: "Frigate", group: "Media & Home", status: "attention", detail: "Camera not yet configured", url: "https://frigate.apps.lab.sirnotethan.uk" },
    { id: "vaultwarden", name: "Vaultwarden", group: "Security", status: "attention", detail: "Account not yet created", url: "https://vault.apps.lab.sirnotethan.uk" },
    { id: "adguard-home", name: "AdGuard Home", group: "Security", status: "healthy", detail: "Running - 192.168.1.11", url: "https://adguard.apps.lab.sirnotethan.uk" },
    { id: "forgejo", name: "Forgejo", group: "Dev & Ops", status: "attention", detail: "Admin account pending", url: "https://git.apps.lab.sirnotethan.uk" },
    { id: "uptime-kuma", name: "Uptime Kuma", group: "Dev & Ops", status: "healthy", detail: "Running", url: "https://status.apps.lab.sirnotethan.uk" },
    { id: "stirling-pdf", name: "Stirling PDF", group: "Dev & Ops", status: "healthy", detail: "Running", url: "https://pdf.apps.lab.sirnotethan.uk" },
    { id: "pterodactyl", name: "Pterodactyl", group: "Dev & Ops", status: "attention", detail: "Wings not yet installed", url: "https://panel.apps.lab.sirnotethan.uk" }
  ]
};

# Ansible

Ansible applies the repeatable Ubuntu host baseline. The controller runs from
Ubuntu 24.04 under WSL2; managed nodes are Ubuntu Server systems reached over
key-only SSH.

## Controller installation

Install the pinned controller version in WSL:

```bash
sudo apt update
sudo apt install -y pipx
pipx ensurepath
pipx install ansible-core==2.21.1
```

The same version is recorded in `requirements.txt` for future rebuilds.

## Private inventory

Exact LAN addresses are intentionally excluded from this public repository.
Create the ignored local inventory from the example:

```bash
cd /mnt/c/Users/ethnb/Documents/Homelab/ansible
cp inventory/hosts.example.yml inventory/hosts.yml
nano inventory/hosts.yml
```

Replace `CHANGE_ME` with the address from the private inventory. Never force-add
`inventory/hosts.yml` to Git.

## SSH key

The inventory expects the dedicated controller key at:

```text
~/.ssh/homelab_ansible
```

Load its passphrase-protected private key into an agent for the current WSL
session:

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/homelab_ansible
```

Only public keys may be copied to managed nodes.

## Validate connectivity

The repository is stored on a Windows-mounted filesystem, so specify the config
file explicitly rather than relying on Ansible's current-directory discovery:

```bash
cd /mnt/c/Users/ethnb/Documents/Homelab/ansible
export ANSIBLE_CONFIG="$PWD/ansible.cfg"

ansible-inventory --graph
ansible homelab -m ansible.builtin.ping
```

## Apply the baseline

Start with check mode and review the proposed changes:

```bash
ansible-playbook playbooks/baseline.yml --check --diff --ask-become-pass
```

Apply only after check mode is understood:

```bash
ansible-playbook playbooks/baseline.yml --diff --ask-become-pass
```

The play runs one host at a time. Keep an existing SSH session open during the
first application of SSH policy.

## Install Tailscale

Tailscale package installation is automated separately from account enrolment.
First validate the playbook syntax, then install from Tailscale's official
repository:

```bash
ansible-playbook playbooks/tailscale.yml --syntax-check
ansible-playbook playbooks/tailscale.yml --diff --ask-become-pass
```

The first run intentionally does not support check mode because the package is
not available until its external repository has actually been configured.
On an installed host, the repository download tasks can still report changes in
check mode because Ansible only probes their URLs. A normal second application
is the authoritative idempotence test and should report `changed=0`.

Enrol each new host interactively over its existing LAN SSH connection:

```bash
sudo tailscale up --hostname=m700-03
```

Open the displayed authentication URL and sign in to the intended tailnet. No
Tailscale auth key, access token, or device address belongs in this repository.
Confirm the connection afterwards with `tailscale status`.

## Configure private DNS

Private DNS is served by `dnsmasq` on the host in the `dns_resolvers` inventory
group. Exact resolver, upstream, and service addresses are private inventory
data and must stay in `inventory/hosts.yml`.

Example private inventory shape:

```yaml
dns_resolvers:
  hosts:
    hp-utility-01:
  vars:
    homelab_dns_listen_addresses:
      - <resolver-lan-address>
      - <resolver-tailscale-address>
    homelab_dns_interfaces:
      - <lan-interface>
      - tailscale0
    homelab_dns_upstream_servers:
      - <router-or-upstream-dns-address>
    homelab_dns_wildcard_records:
      - name: apps
        address: <kubernetes-ingress-address>
```

Validate, preview, and apply:

```bash
ansible-playbook playbooks/dns.yml --syntax-check
ansible-playbook playbooks/dns.yml --check --diff --ask-become-pass
ansible-playbook playbooks/dns.yml --diff --ask-become-pass
```

Then test resolution from the controller:

```bash
dig @<resolver-lan-address> apps.lab.sirnotethan.uk
dig @<resolver-lan-address> test.apps.lab.sirnotethan.uk
```

Windows clients can test the same resolver from PowerShell:

```powershell
Resolve-DnsName dns-test.lab.sirnotethan.uk -Server <resolver-lan-address>
Resolve-DnsName dns-test.lab.sirnotethan.uk -Server <resolver-tailscale-address>
```

The public Cloudflare zone must not contain private application A or AAAA
records. Certificate automation uses DNS-01 challenge records only.

## Managed baseline

- Hostname matches the inventory name.
- Timezone is `Europe/London` and chrony time synchronisation is enabled.
- Common diagnostic and administration packages are installed.
- Unattended security updates are enabled.
- SSH permits public keys only and denies direct root login.

Network addresses, firmware, storage layout, and k3s are deliberately outside
this initial role. Tailscale installation has a separate role because enrolment
requires an account-authorisation step.

# Node rebuild runbook

## Purpose

Rebuild a homelab node from clean installation media into a known host baseline.
This runbook records the manual pilot process used for `m700-03`; automation
should replace repeatable steps without removing the recovery documentation.

## Prerequisites

- Confirm the target host and that no required data remains on its disk.
- Confirm its hostname and address in [the network plan](../network.md).
- Create verified Ubuntu Server 26.04 LTS installation media.
- Connect a monitor, wired keyboard, Ethernet, and reliable power.
- Have an SSH public key available; do not place private keys on the server.
- Obtain vendor firmware only from the vendor's support page.

## Install Ubuntu

1. Start the recovery timer immediately before powering on the target. Record
   both start and finish timestamps; terminal timestamps are not a substitute.
2. Set UEFI-only boot, disable CSM, enable Secure Boot, and boot the installer
   entry explicitly labelled UEFI.
3. Set the planned hostname.
4. Keep Ethernet connected and confirm the installer enables IPv4 DHCP.
5. Use DHCP during installation; apply the static address only after SSH works.
6. Use the entire intended system disk and confirm the destructive selection.
7. Create the administrative user and enable OpenSSH Server.
8. Do not install optional featured snaps.
9. Reboot, remove the installation media, and confirm local login.
10. Before continuing, verify that `/sys/firmware/efi` exists, Secure Boot is
    enabled, and `/boot/efi` is mounted.

## Verify the initial system

```bash
hostnamectl
ip -br address
ip route
cat /etc/os-release
free -h
lsblk
```

Confirm the model, CPU architecture, memory, system disk, hostname, OS release,
and that an address was obtained on the intended interface.

## Expand the installer-created LVM volume

The Ubuntu installer may leave free space in the volume group. Inspect it first:

```bash
sudo vgs
sudo lvs
```

If the root logical volume is intentionally using only part of the system disk,
extend it and its filesystem:

```bash
sudo lvextend -l +100%FREE -r /dev/ubuntu-vg/ubuntu-lv
df -h /
```

This expansion is not required when `VFree` is already zero or the free space is
reserved for another documented purpose.

## Establish wired networking

1. Enable DHCP on the Ethernet interface in the existing Netplan file.
2. Run `sudo netplan generate` and `sudo netplan try`.
3. Connect over SSH using the temporary DHCP address.
4. Confirm that the planned static address is not in use.
5. Replace DHCP with the host address, prefix, gateway, and DNS values from the
   private inventory.
6. Generate and apply the configuration, then reconnect at the static address.
7. Remove the Wi-Fi configuration and any stored wireless credential.

Example static Netplan structure:

```yaml
network:
  version: 2
  ethernets:
    eno1:
      addresses:
        - <host-ip>/<prefix-length>
      routes:
        - to: default
          via: <gateway-ip>
      nameservers:
        addresses:
          - <dns-server-ip>
```

Preserve any interface matching and naming declarations produced by the
installer. Never copy a Netplan file containing Wi-Fi credentials into Git or a
support transcript.

## Update and verify firmware

1. Record the installed firmware with `hostnamectl`.
2. Check LVFS safely with `fwupdmgr get-updates`.
3. When LVFS does not provide the required system BIOS, download the package for
   the exact machine type from the vendor.
4. Verify its checksum and follow the vendor's update instructions.
5. Use reliable power and never interrupt an active firmware write.
6. Remove update media after successful completion to avoid a boot loop.
7. Restore UEFI-only boot and Secure Boot if the update process changed them.

For the ThinkCentre M700 Tiny pilot, firmware `FWKTBFA` was installed using
Lenovo's USB drive package.

## Final validation

```bash
test -d /sys/firmware/efi && echo "UEFI boot confirmed"
mokutil --sb-state
hostnamectl
ip -4 -br address
ip route
getent hosts ubuntu.com
df -h /
```

Also verify SSH from an administrative workstation and confirm that Wi-Fi is
down. Record firmware, OS, address, storage, and validation date in
`docs/hardware.md`.

## Pilot record

| Date | Host | Result | Duration |
|---|---|---|---|
| 2026-07-04 | `m700-03` | Successful manual rebuild | Not timed |
| 2026-07-04 | `m910q-01` | Successful automated baseline and Tailscale recovery | Not captured; at least two hours observed |
| 2026-07-04 | `m700-01` | Successful automated baseline and Tailscale recovery | 29 minutes 40 seconds |

The `m910q-01` exercise required a reinstall after the first installation was
found to use Legacy BIOS mode. IPv4 DHCP was also absent from the initial
Netplan configuration, the installer-created LVM volume required expansion,
and current Lenovo firmware required a manually prepared DOS USB. The USB had
to contain both the FreeDOS boot files and every file from Lenovo's firmware
package; it was removed immediately after flashing to prevent an update loop.
UEFI-only boot and Secure Boot were restored and verified afterwards.

The Ansible baseline and Tailscale roles completed successfully and were
idempotent. LAN and Tailscale SSH, time synchronisation, service health, DNS,
storage capacity, and NVMe SMART health were verified.

Because no start timestamp or timer was captured, this does not satisfy the
timed-recovery roadmap item. The later `m700-01` exercise recorded exact start
and finish timestamps and satisfied that requirement without an unplanned
intervention. Its detailed evidence is in
[`2026-07-04-m700-01.md`](../recovery-exercises/2026-07-04-m700-01.md).

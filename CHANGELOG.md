# Changelog

All notable changes to this project are documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions
follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Initial Ansible controller configuration and Ubuntu common role.
- Verified IPv4 address plan and single-router network topology.
- Initial M700 node rebuild runbook.
- ADR-0005 documenting the LAN topology and address allocation.

### Changed

- Rebuilt `m700-03` with Ubuntu Server 26.04 LTS, current Lenovo firmware,
  Ethernet-only networking, and a static LAN address.

## [0.1.0] - 2026-07-03

### Added

- Initial repository structure and contribution workflow.
- Hardware inventory and architecture documentation.
- Network, security, storage, backup, and recovery plans.
- Project conventions and initial architecture decision records.
- GitHub issue templates, pull request template, ownership, and validation.

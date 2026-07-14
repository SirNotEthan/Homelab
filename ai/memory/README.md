# Memory

This directory defines memory rules for the future Home AI assistant.

## Memory classes

| Class | Examples | Storage |
|---|---|---|
| Project facts | Host roles, service names, architecture decisions | Git documentation |
| Preferences | Preferred style, workflow choices, naming conventions | Git documentation or private notes |
| Sensitive memory | Credentials, recovery keys, private identity details | Never in Git |
| Working memory | Current task state and temporary reasoning | Runtime only |

## Default policy

- Store durable project facts in documentation.
- Store sensitive facts only in private notes or a password manager.
- Do not store secrets in model prompts, skill files, or Git.
- Prefer explicit user confirmation before promoting a temporary observation
  into durable memory.

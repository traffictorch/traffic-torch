FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:20-bookworm

# Required by workerd (Cloudflare's local runtime)
RUN apt-get update && apt-get -y install libc++-dev libc++abi-dev

# Useful tools
RUN apt-get install -y curl git jq

WORKDIR /workspace

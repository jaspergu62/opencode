FROM --platform=linux/amd64 oven/bun:1.3.14 AS bun-runtime

FROM --platform=linux/amd64 node:22-bookworm-slim

ARG OPENCODE_VERSION=1.17.14
ARG RIPGREP_VERSION=14.1.1

ENV npm_config_prefix=/opt/pact-runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl xz-utils \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /opt/pact-runtime/bin \
    && cp /usr/local/bin/node /opt/pact-runtime/bin/node

COPY --from=bun-runtime /usr/local/bin/bun /opt/pact-runtime/bin/bun

RUN npm install --global "opencode-ai@${OPENCODE_VERSION}" \
    && curl -fsSL "https://github.com/BurntSushi/ripgrep/releases/download/${RIPGREP_VERSION}/ripgrep-${RIPGREP_VERSION}-x86_64-unknown-linux-musl.tar.gz" \
      | tar -xz --strip-components=1 -C /opt/pact-runtime/bin "ripgrep-${RIPGREP_VERSION}-x86_64-unknown-linux-musl/rg" \
    && /opt/pact-runtime/bin/bun --version \
    && /opt/pact-runtime/bin/opencode --version \
    && /opt/pact-runtime/bin/rg --version

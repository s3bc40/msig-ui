
# See https://containers.dev/ for full reference
FROM mcr.microsoft.com/playwright:v1.48.2-noble

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential

# Install graphical environment for browser UI (headed mode)
# - xvfb: virtual framebuffer to run graphical applications without a display
RUN apt-get update && apt-get install -y xvfb


# Set pnpm store directory inside ubuntu's home
ENV PNPM_HOME="/home/ubuntu/.pnpm-store"
ENV PATH="$PNPM_HOME:$PATH"

# Install corepack (for pnpm support)
RUN npm install -g corepack

# Switch to ubuntu for pnpm and foundry/anvil setup
USER ubuntu
# Enable corepack and activate pnpm for ubuntu
RUN corepack enable && corepack prepare pnpm@latest --activate
# Setup pnpm store directory as ubuntu
RUN mkdir -p $PNPM_HOME && pnpm config set store-dir $PNPM_HOME/store
# Install foundry/anvil as ubuntu
RUN curl -L https://foundry.paradigm.xyz | bash && /home/ubuntu/.foundry/bin/foundryup

# Switch to root to create symlink for anvil
USER root
RUN ln -s /home/ubuntu/.foundry/bin/anvil /usr/local/bin/anvil
# Switch back to ubuntu for the rest of the build
USER ubuntu

# Setup workspace and ports
WORKDIR /workspace
COPY . .
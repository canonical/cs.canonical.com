# Build stage: Build static files
# ===
FROM node:20 AS build
WORKDIR /srv
ADD . .
RUN export NODE_ENV=docker
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn yarn install
RUN yarn build

# Build the production image
# ===
FROM ubuntu:noble

# Set up environment
ENV LANG=C.UTF-8
WORKDIR /srv
COPY . .

# Install python and import python dependencies
RUN apt-get update \
    && apt-get install --no-install-recommends --yes ca-certificates python3-venv python3-pip python3-psycopg2 git
RUN python3 -m venv .venv \
    && . .venv/bin/activate \
    && pip install --no-cache-dir -r requirements.txt

ENV PATH="/srv/.venv/bin:$PATH"

# Install Node.js and yarn for running lint and format commands
RUN apt-get update && apt-get install --no-install-recommends --yes \
    curl gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install --no-install-recommends --yes nodejs \
    && npm install -g yarn \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install node dependencies (including devDependencies for linting tools)
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn yarn install

# Import code, build assets
RUN rm -rf requirements.txt
COPY --from=build /srv/static/build /srv/static/build

# Set build ID
ARG BUILD_ID
ENV TALISKER_REVISION_ID="${BUILD_ID}"

# Setup commands to run web service
RUN chmod +x ./entrypoint
ENTRYPOINT ["./entrypoint"]
CMD ["0.0.0.0:80"]

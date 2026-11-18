# Sandbox image for JUDGE_MODE=docker. Build from the repo root:
#   docker build -t labyrinth-judge:latest -f Backend/judge/Dockerfile Backend/services/judge
# (the build context is the folder that holds runner.py)
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential python3 default-jdk-headless nodejs ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir /judge
COPY runner.py /judge/runner.py
USER 65534:65534
WORKDIR /work

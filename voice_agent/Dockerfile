# ------------------------------------------------------------------------------
# Dockerfile for LiveKit AI Voice Debt Collection Agent
# ------------------------------------------------------------------------------

FROM python:3.11-slim

WORKDIR /app

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system audio and build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    ffmpeg \
    libasound2-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent application files
COPY . .

# Set non-root user
RUN useradd -m -u 1001 agentuser && \
    chown -R agentuser:agentuser /app
USER agentuser

RUN python -m livekit.agents download-files

CMD ["python", "agent.py", "start"]


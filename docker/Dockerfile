# =========================================
# Multi-APP_LANGUAGE Dockerfile (Production-ready)
# Supports: .NET, Java, Node.js, Python
# =========================================

# ---------- Stage 1: Base runtime images ----------
ARG APP_LANGUAGE=dotnet
ARG LANGUAGE_VERSION=8.0
ARG ENVIRONMENT=dev

FROM ghcr.io/crbg-phoenixpoc/dotnet-8:${LANGUAGE_VERSION}-runtime AS dotnet-runtime
FROM ghcr.io/crbg-phoenixpoc/java-17:${LANGUAGE_VERSION} AS java-runtime
# FROM node:${LANGUAGE_VERSION}-alpine AS node-runtime
# FROM python:${LANGUAGE_VERSION}-slim AS python-runtime

# ---------- Stage 2: Final image ----------
FROM ${APP_LANGUAGE}-runtime AS final
WORKDIR /app

# Copy built artifacts from CI/CD workflow
ARG APP_PATH=./output
COPY ${APP_PATH}/ ./

# ---------- Stage 3: General environment variables ----------
# Only truly immutable defaults (safe for all languages)
ENV PORT=8080

# ---------- Stage 4: Non-root user ----------
# Note: If base image already uses non-root user, skip user creation
# The base image determines the runtime user

# ---------- Stage 5: Healthcheck ----------
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl --fail http://localhost:$PORT/health || exit 1

EXPOSE $PORT

# ---------- Stage 6: Dynamic entrypoint ----------
CMD ["sh", "-c", "\
if [ \"$APP_LANGUAGE\" = 'dotnet' ]; then \
    DLL_FILE=$(ls *.dll | head -n 1); \
    exec dotnet $DLL_FILE; \
elif [ \"$APP_LANGUAGE\" = 'java' ]; then \
    JAR_FILE=$(ls *.jar | head -n 1); \
    PROFILE=${ENVIRONMENT:-default}; \
    exec java -jar $JAR_FILE --spring.profiles.active=$PROFILE; \
elif [ \"$APP_LANGUAGE\" = 'node' ]; then \
    ENTRY_FILE=$(ls *.js | head -n 1); \
    exec node $ENTRY_FILE; \
elif [ \"$APP_LANGUAGE\" = 'python' ]; then \
    ENTRY_FILE=$(ls *.py | head -n 1); \
    exec python $ENTRY_FILE; \
else \
    echo \"Unsupported language: $APP_LANGUAGE\"; exit 1; \
fi"]

#!/bin/bash

environments=("development" "deployment")
ENV="$1"


build="$2"


found=false
for item in "${environments[@]}"; do
  if [[ "$item" == "$ENV" ]]; then
    found=true
    break
  fi
done


if [ "$found" = false ]; then
  echo "❌ Error: '$ENV' is not an allowed value."
  echo "✅ Allowed values are: ${environments[*]}"
  exit 1
else
  export NODE_ENV="$ENV"
  ENV_FILE="$(dirname "$0")/../.$ENV.env"
  if [ "$build" == "build" ]; then
    docker compose --env-file "$ENV_FILE" up --build
  else 
    docker compose --env-file "$ENV_FILE" up
  fi
fi

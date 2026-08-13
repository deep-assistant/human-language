#!/usr/bin/env bash
# Verify that GHCR grants an anonymous pull token for the package just pushed.
# Deliberately do not add credentials: authenticated access would make a private
# package look public and defeat this release gate.
set -euo pipefail

GHCR_IMAGE="${GHCR_IMAGE:-}"
GHCR_TOKEN_ENDPOINT="${GHCR_TOKEN_ENDPOINT:-https://ghcr.io/token}"
retries="${VERIFY_GHCR_VISIBILITY_RETRIES:-3}"
delay="${VERIFY_GHCR_VISIBILITY_DELAY:-5}"

if [ -z "$GHCR_IMAGE" ]; then
  echo "::error::GHCR_IMAGE is not set; nothing to verify"
  exit 1
fi

repository="${GHCR_IMAGE#ghcr.io/}"
repository="${repository%%@*}"
repository="${repository%%:*}"
url="${GHCR_TOKEN_ENDPOINT}?service=ghcr.io&scope=repository:${repository}:pull"
body="$(mktemp)"
trap 'rm -f "$body"' EXIT

attempt=1
while :; do
  status="000"
  # -q must be first: ignore user curl configuration that could add credentials.
  if response_status="$(curl -q -sS -o "$body" -w '%{http_code}' "$url")"; then
    status="$response_status"
  fi

  case "$status" in
    200)
      if ! grep -Eq '"token"[[:space:]]*:[[:space:]]*"[^"]+"' "$body"; then
        echo "::error::GHCR returned HTTP 200 without an anonymous pull token for ${GHCR_IMAGE}"
        exit 1
      fi
      echo "OK: ${GHCR_IMAGE} is public (GHCR issued an anonymous pull token)"
      exit 0
      ;;
    401)
      echo "::error::${GHCR_IMAGE} is PRIVATE; anonymous pulls are unauthorized."
      echo "An organization owner must open the package settings, choose Danger Zone -> Change visibility -> Public, then rerun this job."
      exit 1
      ;;
    403)
      echo "::error::${GHCR_IMAGE} is missing or DENIED to anonymous callers; the push may not have completed."
      exit 1
      ;;
    000 | 5??)
      if [ "$attempt" -ge "$retries" ]; then
        echo "::error::The GHCR token endpoint failed for ${GHCR_IMAGE} (last status ${status}) after ${retries} attempt(s)"
        exit 1
      fi
      attempt=$((attempt + 1))
      sleep "$delay"
      ;;
    *)
      echo "::error::Unexpected HTTP ${status} from the GHCR token endpoint for ${GHCR_IMAGE}"
      exit 1
      ;;
  esac
done

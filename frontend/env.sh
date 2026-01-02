#!/bin/sh

cat <<EOF > /app/public/env.js
window.__ENV__ = {
  NEXT_PUBLIC_API_BASE_URL: "${NEXT_PUBLIC_API_BASE_URL}"
};
EOF

exec "$@"

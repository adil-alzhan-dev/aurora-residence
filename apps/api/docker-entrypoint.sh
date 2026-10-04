#!/bin/sh
set -e

./node_modules/.bin/prisma migrate deploy
node dist/prisma/seed.js --if-empty
exec node dist/src/main.js

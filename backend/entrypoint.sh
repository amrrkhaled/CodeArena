#!/bin/sh
echo "🌱 Running seed..."
node seed/seed.js
echo "🚀 Starting server..."
exec node server.js

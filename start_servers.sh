#!/bin/bash

echo "Starting Django server on port 8000..."
python manage.py migrate --noinput
python manage.py seed_data 2>/dev/null || true
python manage.py runserver 0.0.0.0:8000 &
DJANGO_PID=$!

sleep 3

echo "Starting Node.js/Vite server on port 5000..."
npm run dev &
NODE_PID=$!

cleanup() {
    echo "Shutting down servers..."
    kill $DJANGO_PID 2>/dev/null
    kill $NODE_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

wait

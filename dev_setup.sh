#!/bin/bash

# Setup Script for RH-Booking Local Development (Stripe Sync Engine)

# --- Logging Functions ---
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# --- Cleanup Function ---
cleanup() {
    echo " "
    log_info "Shutting down..."
    if [ -n "$SUPABASE_LOG_PID" ]; then kill "$SUPABASE_LOG_PID" 2>/dev/null; fi
    if [ -n "$STRIPE_LOG_PID" ]; then kill "$STRIPE_LOG_PID" 2>/dev/null; fi
    if [ -n "$STRIPE_LISTEN_PID" ]; then
        kill -0 "$STRIPE_LISTEN_PID" 2>/dev/null && kill "$STRIPE_LISTEN_PID"
    fi
    if [ -n "$SUPABASE_FUNCTIONS_PID" ]; then
        kill -0 "$SUPABASE_FUNCTIONS_PID" 2>/dev/null && kill "$SUPABASE_FUNCTIONS_PID"
    fi
    if [ -n "$CONTAINER_ID" ]; then
        log_info "Stopping Docker container ($CONTAINER_ID)..."
        docker stop "$CONTAINER_ID" >/dev/null
    fi
    log_success "Cleanup complete. Bye!"
    trap - EXIT INT TERM HUP
    exit
}

trap cleanup EXIT INT TERM HUP

# --- Prerequisites Check ---
check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 could not be found. Please install it to proceed."
        exit 1
    fi
}

log_info "Checking prerequisites..."
check_command supabase
check_command stripe
check_command docker

# --- Load .env.local ---
if [ -f .env.local ]; then
    STRIPE_SECRET_KEY=$(grep '^STRIPE_SECRET_KEY=' .env.local | cut -d '=' -f2-)
    if [ -z "$STRIPE_SECRET_KEY" ]; then
        log_error "STRIPE_SECRET_KEY not found in .env.local"
        exit 1
    fi
    log_success "Loaded STRIPE_SECRET_KEY from .env.local"
else
    log_error ".env.local not found. Create it with STRIPE_SECRET_KEY=sk_test_..."
    exit 1
fi

# --- API Key for sync engine (generate a random one if not set) ---
SYNC_API_KEY="${SYNC_API_KEY:-rh-booking-local-sync-key}"
log_info "Sync engine API_KEY: $SYNC_API_KEY"

# --- 1. Supabase Start ---
log_info "Checking Supabase status..."
if supabase status > /dev/null 2>&1; then
    log_info "Supabase is already started."
else
    log_info "Supabase is not started. Starting now..."
    if supabase start; then
        log_success "Supabase started successfully."
    else
        log_error "Failed to start Supabase."
        exit 1
    fi
fi

# --- 2. Supabase Edge Functions ---
log_info "Starting Supabase functions serve in background..."
supabase functions serve > supabase_functions.log 2>&1 &
SUPABASE_FUNCTIONS_PID=$!
log_success "Supabase functions serve started (PID: $SUPABASE_FUNCTIONS_PID). Logs at supabase_functions.log"

# --- 3. Stripe Listen ---
log_info "Starting Stripe listen..."
> stripe_listen.log
stripe listen --forward-to localhost:8080/webhooks > stripe_listen.log 2>&1 &
STRIPE_LISTEN_PID=$!

log_info "Waiting for Stripe Webhook Signing Secret..."
STRIPE_WEBHOOK_SECRET=""
MAX_RETRIES=30
COUNT=0

while [ -z "$STRIPE_WEBHOOK_SECRET" ]; do
    if [ $COUNT -ge $MAX_RETRIES ]; then
        log_error "Timed out waiting for Stripe Webhook Secret. Check stripe_listen.log"
        exit 1
    fi
    sleep 1
    if ! kill -0 $STRIPE_LISTEN_PID 2>/dev/null; then
        log_error "Stripe listen process died. Check stripe_listen.log"
        exit 1
    fi
    if grep -q "whsec_" stripe_listen.log; then
        STRIPE_WEBHOOK_SECRET=$(grep -o 'whsec_[a-zA-Z0-9]*' stripe_listen.log | head -n 1)
    fi
    ((COUNT++))
done

log_success "Stripe Webhook Secret captured: $STRIPE_WEBHOOK_SECRET"

# --- 4. Run stripe-sync-engine Docker Container ---
log_info "Running Docker container: supabase/stripe-sync-engine:latest"

CONTAINER_ID=$(docker run --rm -d \
  -e DATABASE_URL=postgres://postgres:postgres@host.docker.internal:54322/postgres \
  -e STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
  -e STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
  -e API_KEY="$SYNC_API_KEY" \
  -e STRIPE_API_VERSION="2025-11-17.clover" \
  -p 8080:8080 \
  supabase/stripe-sync-engine:latest)

if [ $? -eq 0 ]; then
    log_success "Docker container started (ID: ${CONTAINER_ID:0:12})"
else
    log_error "Failed to start Docker container. Is port 8080 free?"
    exit 1
fi

# --- 5. Initial Sync ---
log_info "Waiting for container to initialize..."
sleep 5

log_info "Triggering initial Stripe sync..."
curl -s -o /dev/null -w "%{http_code}" --location --request POST 'http://localhost:8080/sync' \
  --header "Authorization: $SYNC_API_KEY" \
  --header 'Content-Type: application/json' \
  --data '{"object": "all"}' | {
    read HTTP_CODE
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        log_success "Initial sync triggered (HTTP $HTTP_CODE)"
    else
        log_error "Sync returned HTTP $HTTP_CODE. You may need to run it manually."
    fi
}

log_success "Setup complete! Services running:"
echo -e "  ${CYAN}Supabase DB${NC}        postgres://localhost:54322"
echo -e "  ${CYAN}Edge Functions${NC}     http://localhost:54321/functions/v1"
echo -e "  ${CYAN}Sync Engine${NC}        http://localhost:8080"
echo -e "  ${MAGENTA}Stripe Listen${NC}      forwarding to localhost:8080/webhooks"
echo ""
log_info "Press Ctrl+C to stop all services."

# --- 6. Stream Logs ---
tail -f -n 0 supabase_functions.log | awk -v color="$CYAN" -v nc="$NC" '{print color "[SUPABASE]:" nc, $0; fflush()}' &
SUPABASE_LOG_PID=$!

tail -f -n 0 stripe_listen.log | awk -v color="$MAGENTA" -v nc="$NC" '{print color "[STRIPE]:" nc, $0; fflush()}' &
STRIPE_LOG_PID=$!

wait

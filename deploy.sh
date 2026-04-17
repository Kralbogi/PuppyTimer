#!/usr/bin/env bash
# =============================================================================
# PawLand — Tek tıkla deploy scripti
# Kullanım: bash deploy.sh
# =============================================================================

set -e

FIREBASE="$HOME/.local/bin/firebase"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "  PawLand Deploy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Firebase login kontrolü ───────────────────────────────────────────────
echo ""
echo "1/5  Firebase oturumu kontrol ediliyor..."
if ! $FIREBASE projects:list --project pawland3448 &>/dev/null; then
    echo "     → Firebase'e giriş yapılıyor..."
    $FIREBASE login
fi
echo "     ✓ Firebase bağlantısı tamam"

# ── 2. Cloud Functions bağımlılıkları ────────────────────────────────────────
echo ""
echo "2/5  Functions bağımlılıkları yükleniyor..."
cd "$PROJECT_DIR/functions"
npm install --silent
npm run build --silent
echo "     ✓ Functions derlendi"

# ── 3. Gizli anahtarları ayarla (sadece ilk kurulumda) ──────────────────────
echo ""
echo "3/5  Gizli anahtarlar kontrol ediliyor..."
cd "$PROJECT_DIR"

setup_secret() {
    local NAME="$1"
    local DESC="$2"
    # Mevcut mi diye kontrol et
    if $FIREBASE functions:secrets:access "$NAME" --project pawland3448 &>/dev/null; then
        echo "     ✓ $NAME zaten ayarlı"
    else
        echo ""
        echo "     ► $DESC"
        echo "     $NAME değerini girin (gizli tutulacak):"
        $FIREBASE functions:secrets:set "$NAME" --project pawland3448
    fi
}

setup_secret "ANTHROPIC_API_KEY" "Anthropic API anahtarı (https://console.anthropic.com/)"
setup_secret "STRIPE_SECRET_KEY" "Stripe gizli anahtar (https://dashboard.stripe.com/apikeys)"
setup_secret "STRIPE_WEBHOOK_SECRET" "Stripe webhook gizli anahtarı (https://dashboard.stripe.com/webhooks)"

# ── 4. Web uygulaması build ──────────────────────────────────────────────────
echo ""
echo "4/5  Web uygulaması derleniyor..."
cd "$PROJECT_DIR/PuppyTimerWeb"
npm install --silent
npm run build --silent
echo "     ✓ Web uygulaması derlendi"

# ── 5. Firebase'e deploy ─────────────────────────────────────────────────────
echo ""
echo "5/5  Firebase'e deploy ediliyor..."
cd "$PROJECT_DIR"
$FIREBASE deploy --project pawland3448

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Deploy tamamlandı!"
echo "  Web: https://pawland3448.web.app"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

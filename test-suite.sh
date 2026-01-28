#!/bin/bash

# =====================================
# TEST SUITE - Planckeel Bike
# =====================================

# Détecte si on est dans le container ou sur le host
if [ -f /.dockerenv ]; then
    # On est dans le container
    BASE_URL="http://localhost"
else
    # On est sur le host
    BASE_URL="http://localhost:8080"
fi

ADMIN_TOKEN=""
USER_TOKEN=""
RESERVATION_ID=""
USER_ID=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  PLANCKEEL BIKE - TEST SUITE${NC}"
echo -e "${BLUE}========================================${NC}\n"

# ==========================================
# TEST 1: Register User
# ==========================================
echo -e "${YELLOW}[TEST 1] Enregistrement utilisateur...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/php/admin_api.php?action=register" \
  -H "Content-Type: application/json" \
  -d '{
    "prenom": "Test",
    "nom": "User",
    "email": "testuser@example.com",
    "telephone": "0612345678",
    "password": "TestPassword123!"
  }')

echo "Response: $REGISTER_RESPONSE"

if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Enregistrement réussi${NC}\n"
else
    echo -e "${RED}✗ Enregistrement échoué${NC}\n"
fi

# ==========================================
# TEST 2: Register Admin
# ==========================================
echo -e "${YELLOW}[TEST 2] Enregistrement admin...${NC}"
ADMIN_REGISTER=$(curl -s -X POST "$BASE_URL/php/admin_api.php?action=register" \
  -H "Content-Type: application/json" \
  -d '{
    "prenom": "Admin",
    "nom": "Test",
    "email": "admin@planckeel.com",
    "telephone": "0687654321",
    "password": "AdminPass123!",
    "role": "admin"
  }')

echo "Response: $ADMIN_REGISTER"

if echo "$ADMIN_REGISTER" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Admin créé${NC}\n"
else
    echo -e "${RED}✗ Admin échoué${NC}\n"
fi

# ==========================================
# TEST 3: Login User
# ==========================================
echo -e "${YELLOW}[TEST 3] Connexion utilisateur...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/php/admin_api.php?action=login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPassword123!"
  }')

echo "Response: $LOGIN_RESPONSE"

USER_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
USER_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"user_id":[0-9]*' | cut -d':' -f2)

if [ ! -z "$USER_TOKEN" ]; then
    echo -e "${GREEN}✓ Connexion réussie${NC}"
    echo "  Token: ${USER_TOKEN:0:20}..."
    echo "  User ID: $USER_ID\n"
else
    echo -e "${RED}✗ Connexion échouée${NC}\n"
fi

# ==========================================
# TEST 4: Login Admin
# ==========================================
echo -e "${YELLOW}[TEST 4] Connexion admin...${NC}"
ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/php/admin_api.php?action=login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@planckeel.com",
    "password": "AdminPass123!"
  }')

echo "Response: $ADMIN_LOGIN"

ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$ADMIN_TOKEN" ]; then
    echo -e "${GREEN}✓ Admin connecté${NC}"
    echo "  Token: ${ADMIN_TOKEN:0:20}...\n"
else
    echo -e "${RED}✗ Connexion admin échouée${NC}\n"
fi

# ==========================================
# TEST 5: Check Availability
# ==========================================
echo -e "${YELLOW}[TEST 5] Vérification disponibilités...${NC}"
AVAILABILITY=$(curl -s "$BASE_URL/php/admin_api.php?action=check-availability&date=2026-02-05&time=10:00")

echo "Response: $AVAILABILITY"

if echo "$AVAILABILITY" | grep -q '"available"'; then
    echo -e "${GREEN}✓ Disponibilités vérifiées${NC}\n"
else
    echo -e "${RED}✗ Erreur vérification disponibilités${NC}\n"
fi

# ==========================================
# TEST 6: Create Booking
# ==========================================
echo -e "${YELLOW}[TEST 6] Création de réservation...${NC}"
BOOKING_RESPONSE=$(curl -s -X POST "$BASE_URL/php/booking.php" \
  -d "service=Sortie VTT Découverte" \
  -d "date=2026-02-10" \
  -d "time=14:00" \
  -d "duration=2h" \
  -d "price=35€" \
  -d "name=Test User" \
  -d "email=testuser@example.com" \
  -d "phone=0612345678" \
  -d "message=Test de réservation automatique")

echo "Response: $BOOKING_RESPONSE"

RESERVATION_ID=$(echo "$BOOKING_RESPONSE" | grep -o '"reservation_id":[0-9]*' | cut -d':' -f2)

if [ ! -z "$RESERVATION_ID" ] && [ "$RESERVATION_ID" != "null" ]; then
    echo -e "${GREEN}✓ Réservation créée${NC}"
    echo "  Reservation ID: $RESERVATION_ID"
    echo "  Client email sent: $(echo "$BOOKING_RESPONSE" | grep -o '"client_email_sent":[^,}]*')\n"
else
    echo -e "${RED}✗ Création réservation échouée${NC}\n"
fi

# ==========================================
# TEST 7: Get User Reservations
# ==========================================
if [ ! -z "$USER_TOKEN" ] && [ ! -z "$USER_ID" ]; then
    echo -e "${YELLOW}[TEST 7] Récupération réservations utilisateur...${NC}"
    USER_BOOKINGS=$(curl -s -X GET "$BASE_URL/php/admin_api.php?action=user-reservations&user_id=$USER_ID" \
      -H "Authorization: Bearer $USER_TOKEN")

    echo "Response: $USER_BOOKINGS"

    if echo "$USER_BOOKINGS" | grep -q '"id"'; then
        echo -e "${GREEN}✓ Réservations récupérées${NC}\n"
    else
        echo -e "${RED}✗ Erreur récupération réservations${NC}\n"
    fi
fi

# ==========================================
# TEST 8: Get All Reservations (Admin)
# ==========================================
if [ ! -z "$ADMIN_TOKEN" ]; then
    echo -e "${YELLOW}[TEST 8] Récupération tous les réservations (Admin)...${NC}"
    ALL_BOOKINGS=$(curl -s -X GET "$BASE_URL/php/admin_api.php?action=reservations" \
      -H "Authorization: Bearer $ADMIN_TOKEN")

    echo "Response: $ALL_BOOKINGS"

    if echo "$ALL_BOOKINGS" | grep -q '"id"'; then
        echo -e "${GREEN}✓ Toutes les réservations récupérées${NC}\n"
    else
        echo -e "${RED}✗ Erreur récupération réservations${NC}\n"
    fi
fi

# ==========================================
# TEST 9: Confirm Booking (Admin)
# ==========================================
if [ ! -z "$ADMIN_TOKEN" ] && [ ! -z "$RESERVATION_ID" ]; then
    echo -e "${YELLOW}[TEST 9] Confirmation de réservation (Admin)...${NC}"
    CONFIRM=$(curl -s -X PUT "$BASE_URL/php/admin_api.php?action=confirm-booking&id=$RESERVATION_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{}')

    echo "Response: $CONFIRM"

    if echo "$CONFIRM" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ Réservation confirmée${NC}\n"
    else
        echo -e "${RED}✗ Erreur confirmation réservation${NC}\n"
    fi
fi

# ==========================================
# TEST 10: Cancel Booking (Admin)
# ==========================================
if [ ! -z "$ADMIN_TOKEN" ] && [ ! -z "$RESERVATION_ID" ]; then
    echo -e "${YELLOW}[TEST 10] Annulation de réservation (Admin)...${NC}"
    CANCEL=$(curl -s -X DELETE "$BASE_URL/php/admin_api.php?action=cancel-booking&id=$RESERVATION_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN")

    echo "Response: $CANCEL"

    if echo "$CANCEL" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ Réservation annulée${NC}\n"
    else
        echo -e "${RED}✗ Erreur annulation réservation${NC}\n"
    fi
fi

# ==========================================
# Summary
# ==========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  RÉSUMÉ DES TESTS${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "📧 ${YELLOW}Vérifiez les emails reçus à :${NC}"
echo -e "   • testuser@example.com (confirmation réservation)"
echo -e "   • merciervictor4@gmail.com (notification admin)\n"

echo -e "🔍 ${YELLOW}Vérifiez dans Brevo :${NC}"
echo -e "   • https://app.brevo.com/email-transactional/\n"

echo -e "💾 ${YELLOW}Données de test créées :${NC}"
echo -e "   • User: testuser@example.com / TestPassword123!"
echo -e "   • Admin: admin@planckeel.com / AdminPass123!"
echo -e "   • Reservation ID: $RESERVATION_ID\n"

echo -e "${GREEN}✓ Suite de tests terminée!${NC}\n"

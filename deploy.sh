#!/bin/bash
# ═══ Photo Delivery — Deploy via IP ═══
# Uso: copie a pasta pra VPS, configure .env e rode ./deploy.sh

set -e

echo "══════════════════════════════════════════"
echo " Photo Delivery — Deploy Docker (IP)"
echo "══════════════════════════════════════════"
echo ""

if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado."
    echo "   cp .env.docker .env"
    echo "   nano .env  (preencha SERVER_IP, DB_PASSWORD, SECRET_KEY)"
    exit 1
fi

source .env

if [ "$SERVER_IP" = "0.0.0.0" ] || [ -z "$SERVER_IP" ]; then
    echo "❌ Configure SERVER_IP no arquivo .env com o IP real da VPS."
    echo "   Exemplo: SERVER_IP=192.168.1.100"
    exit 1
fi

echo "📋 Configuração:"
echo "   IP:    $SERVER_IP"
echo "   URL:   http://$SERVER_IP"
echo ""

echo "🔨 Buildando containers..."
docker compose build

echo ""
echo "🚀 Subindo containers..."
docker compose up -d

sleep 4

echo ""
echo "📊 Status:"
docker compose ps

echo ""
echo "══════════════════════════════════════════"
echo "✅ Deploy concluído!"
echo ""
echo "   Frontend:  http://$SERVER_IP"
echo "   API:       http://$SERVER_IP/api/v1"
echo "   API Docs:  http://$SERVER_IP/docs"
echo ""
echo "   Login:     comunica@dacom.ufu / ativacao@123"
echo ""
echo "   Logs:      docker compose logs -f"
echo "   Parar:     docker compose down"
echo "══════════════════════════════════════════"

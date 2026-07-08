# Photo Delivery — Guia Rápido do Evento

## 1. Configurar o PC do Fotógrafo (primeiro uso)

```bash
# Instalar dependências
pip3 install watchdog requests

# Entrar na pasta do uploader
cd photographer-uploader

# Criar o .env
cat > .env << 'EOF'
API_URL=http://31.97.85.110
API_TOKEN=<TOKEN-GERADO-NO-LOGIN>
WATCH_FOLDER=/Users/samuelamorim/Desktop/Teste - Foto evento
EOF
```

### Gerar o TOKEN (fazer login no servidor)

```bash
curl -s http://<IP>/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@photodelivery.com","password":"1234"}'
```
Copia o `access_token` e cola no `.env`.

---

## 2. Iniciar o Evento

### No servidor — Já deve estar rodando do Docker:

```bash
cd /home/repos/photo-delivery
docker compose up -d
```

### No PC do fotógrafo — Iniciar o uploader:

```bash
cd photographer-uploader
python3 uploader.py
```

Deixa esse terminal aberto o evento inteiro. Vai aparecer:

```
✓ Conectado como Admin
▶ Monitorando novas fotos...
```

---

## 3. Durante o Evento (fluxo por visitante)

### Painel do Operador: http://<IP>/operator

```
1. Visitante chega no stand
2. Operador clica "Nova Sessão" → preenche nome → seleciona evento → cria
3. Fotógrafo tira as fotos → exporta JPGs do Lightroom pra pasta monitorada
4. Uploader detecta → envia automaticamente → terminal mostra "✓ OK"
5. Quando terminar as fotos do visitante, Operador clica "Finalizar"
6. Sistema gera QR Code → visitante escaneia → acessa suas fotos
7. Próximo visitante → volta ao passo 2
```

**Importante:** só finalizar a sessão depois que TODAS as fotos do visitante subiram. O terminal do uploader mostra cada envio.

---

## 4. Encerrar o Evento

```bash
# No PC do fotógrafo: Ctrl+C no terminal do uploader

# No servidor (opcional, só se quiser desligar tudo):
cd /home/repos/photo-delivery
docker compose down
```

---

## 5. Comandos Úteis

```bash
# Ver sessões ativas
docker exec photo-delivery-db-1 psql -U photodelivery -d photodelivery \
  -c "SELECT code, visitor_name, status, created_at FROM sessions ORDER BY created_at DESC LIMIT 10;"

# Ver fotos enviadas
docker exec photo-delivery-db-1 psql -U photodelivery -d photodelivery \
  -c "SELECT original_name, created_at FROM photos ORDER BY created_at DESC LIMIT 10;"

# Ver logs do backend
docker logs --tail=30 photo-delivery-backend-1

# Ver status dos containers
docker ps -a
```

---

## 6. Problemas Comuns

| Problema | Solução |
|----------|---------|
| Uploader mostra "Nenhuma sessao ativa" | Criar sessão no `/operator` antes de exportar fotos |
| Uploader mostra "Token inválido" | Fazer login de novo e atualizar o TOKEN no `.env` |
| Uploader mostra "Sem conexão" | Verificar se servidor está online e IP no `.env` |
| Fotos não aparecem na galeria | Verificar se a sessão certa está ativa (`/operator`) |
| Visitante perdeu QR Code | Reabrir sessão no painel admin, código fica visível |

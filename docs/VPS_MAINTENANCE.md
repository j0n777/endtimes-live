# 🛠️ VPS Maintenance & Deployment Guide

## ⚠️ AVISO CRÍTICO DE INFRAESTRUTURA — LEIA ANTES DE QUALQUER DEPLOY

**Este projeto roda via Docker. Cada `docker-compose up --build` gera uma nova imagem (~400MB).**
**Imagens antigas ficam como "dangling" e acumulam GB silenciosamente no disco da VPS.**

**OBRIGATÓRIO após qualquer rebuild:**
```bash
docker image prune -f        # remove imagens dangling (~400MB por build esquecido)
docker builder prune -f      # limpa build cache (pode acumular 30+ GB)
```

Em 2026-03-07, por exemplo, o disco chegou a **99% de uso** por causa desse acúmulo.
Ver relatório completo: `/home/docker-sites/STORAGE_REPORT.md` (no servidor)

**Nunca instale `node_modules` localmente** — o Docker constrói internamente. Remova se existir:
```bash
rm -rf /home/docker-sites/endtimesmonitor/node_modules
```

## Setup do Banco de Dados / Supabase
Para detalhes do ambiente de produção e configuração, acesse:
- [Guia do RLS (Segurança)](RLS_IMPLEMENTATION_GUIDE.md)
- [Guia do Local Development](LOCAL_DEVELOPMENT.md)

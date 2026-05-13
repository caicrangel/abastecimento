# Abastecimento - Controle de Frota e Bombas

Webapp para controle de abastecimento de frota de onibus, com lancamento diario de iniciante/encerrante das bombas e registro de abastecimento dos veiculos (com leitura de QRCode para evitar erros).

## Stack

- **Next.js 14** (frontend + API routes, JavaScript)
- **MySQL 8** (BD com fotos armazenadas como BLOB)
- **Docker Compose** para subir tudo junto (app + mysql + adminer)
- **bcrypt** + **iron-session** para autenticacao
- **QRCode** server-side + **BarcodeDetector** API no navegador para leitura

## Funcionalidades

- Login com perfis **Administrador** e **Operador** (JWT em cookie HttpOnly)
- Aba **Abastecimento**: registra abastecimentos dos veiculos (odometro, diesel, arla32, foto do odometro), com scan obrigatorio do QRCode do veiculo. Scanner usa `jsQR` (funciona em iOS Safari, Android, etc.) e tem fallback "tirar foto" + entrada manual.
- Aba **Bombas**: fluxo em dois momentos:
  - **Abrir leitura** no inicio do expediente (iniciante + foto)
  - **Fechar leitura** no fim do expediente (encerrante + foto)
  - **Alerta automatico** no topo da tela a cada 20 minutos quando ha leituras pendentes (com Notification API e som curto)
- Aba **Relatorios**: resumo do periodo, consumo por veiculo (km/L), veiculos sem abastecer, consumo diario (30d) e conferencia bomba x abastecimentos
- Modulo **Admin** (apenas administradores):
  - CRUD de veiculos com geracao de QRCode imprimivel
  - CRUD de bombas
  - CRUD de usuarios (admin/operador)
- Datas e numeros formatados em pt-BR (timezone America/Sao_Paulo)
- Fotos armazenadas no MySQL (LONGBLOB), servidas via endpoint autenticado

## Como rodar

### 1. Pre-requisitos

- Docker + Docker Compose instalados
- Porta 3000 (app), 3306 (mysql) e 8080 (adminer) livres

### 2. Configurar variaveis

```bash
cp .env.example .env
# Edite .env e troque ao menos: MYSQL_ROOT_PASSWORD, MYSQL_PASSWORD,
# SESSION_SECRET (>= 32 chars), ADMIN_PASSWORD
```

### 3. Subir a infra

```bash
docker compose up -d --build
```

Na primeira execucao:
- O MySQL cria o BD `abastecimento` e roda `sql/init.sql` (tabelas)
- O app sobe e ao primeiro login cria o usuario administrador definido em `.env` (`ADMIN_USERNAME`/`ADMIN_PASSWORD`)

### 4. Acessar

- App: http://localhost:3000
- Adminer (gerenciar BD): http://localhost:8080 (server: `mysql`, user/pass do `.env`)

### 5. Primeiro uso

1. Acesse o app, faca login como admin
2. Em **Cad. Bombas**, cadastre as 3 bombas (codigo + combustivel: diesel ou arla32)
3. Em **Veiculos**, cadastre cada onibus; clique no botao **QR** para gerar o QRCode e imprima para colar no veiculo
4. Em **Usuarios**, crie contas para os operadores
5. Operadores podem:
   - Lancar leituras diarias em **Bombas** (iniciante/encerrante + 2 fotos)
   - Registrar abastecimentos em **Abastecimento** (scan do QR -> dados + foto do odometro)

## Estrutura

```
abastecimento/
  docker-compose.yml      # mysql + app + adminer
  Dockerfile              # build do Next.js
  sql/init.sql            # schema MySQL
  src/
    lib/                  # db, sessao, auth, helpers
    components/           # Layout, FotoCaptura, QRScanner
    pages/                # paginas + API routes
      api/                # endpoints REST
      abastecimento/      # guia abastecimento
      bombas/             # guia bombas
      admin/              # CRUD admin
```

## Notas tecnicas

- **Fotos no BD**: como solicitado, fotos sao armazenadas como `LONGBLOB` no MySQL. Antes do upload o navegador comprime para JPEG (max 1280px, qualidade 75%) reduzindo bastante o tamanho. Caso o volume cresca muito, considere migrar para storage de arquivos.
- **max_allowed_packet** ja esta em 64M no `docker-compose.yml` para acomodar imagens.
- **QRCode**: o scanner usa a API nativa `BarcodeDetector` (suportada em Chrome/Android e Safari recentes). Em dispositivos sem suporte, o campo de entrada manual permite digitar/colar o token.
- **Producao**: gere um `SESSION_SECRET` aleatorio com pelo menos 32 caracteres e troque as senhas padrao antes de expor o sistema.
- Para usar HTTPS (necessario para camera em alguns navegadores), coloque o app atras de um proxy reverso (nginx, Caddy, Traefik).

## Comandos uteis

```bash
docker compose logs -f app          # logs do app
docker compose logs -f mysql        # logs do mysql
docker compose exec mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} abastecimento  # CLI mysql
docker compose down                  # para tudo (mantem dados)
docker compose down -v               # para e apaga volume do BD
```

## Migracao para BD existente

Se voce ja tem um BD em uso (versao anterior do app, com iniciante + encerrante obrigatorios na mesma leitura), rode a migration uma vez:

```bash
docker compose exec -T mysql \
  mysql -u${MYSQL_USER} -p${MYSQL_PASSWORD} ${MYSQL_DATABASE} \
  < sql/migrations/001_separar_iniciante_encerrante.sql
```

Ela e idempotente para os campos novos mas falha se rodada duas vezes (FK duplicada). Rode somente uma vez.

## Diagnostico

Endpoint de saude (sem autenticacao, mostra status do BD e config sem expor segredos):

```bash
curl http://localhost:3000/api/debug/health
```

Testar login manualmente:

```bash
# Recebe o cookie de sessao
curl -i -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -c cookies.txt

# Usa o cookie para validar sessao
curl -b cookies.txt http://localhost:3000/api/auth/me
```

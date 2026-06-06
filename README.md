# AutoMatch-Back

API REST do AutoMatch — backend em Node.js + Express + TypeScript + Prisma.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Node.js + TypeScript |
| Framework | Express |
| ORM | Prisma 5 |
| Database | SQLite |
| Auth | JWT + bcrypt |
| Validação | Zod |

## Pré-requisitos

- Node.js >= 18
- npm

## Setup

```bash
# Instalar dependências
npm install

# Criar banco e aplicar migrations
npx prisma migrate dev

# Popular com dados iniciais (3 carros + admin)
npx tsx prisma/seed.ts
```

## Desenvolvimento

```bash
npm run dev
```

O servidor inicia em `http://localhost:3000/api`.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia com hot-reload (tsx watch) |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Sobe em produção a partir de `dist/` |
| `npm run db:migrate` | Cria nova migration |
| `npm run db:seed` | Popula o banco |
| `npm run db:reset` | Reset completo do banco |

## Estrutura

```
src/
├── index.ts                # Entry point
├── lib/prisma.ts           # PrismaClient singleton
├── middleware/
│   ├── auth.ts             # requireAuth + requireAdmin
│   └── error.ts            # AppError + error handler
└── routes/
    ├── auth.ts             # POST /api/auth/register, POST /api/auth/login
    ├── cars.ts             # GET /api/cars, GET /api/cars/:id
    ├── matches.ts          # GET/POST/DELETE /api/matches
    └── admin/
        ├── cars.ts         # CRUD /api/admin/cars
        └── users.ts        # GET /api/admin/users, PUT /api/admin/users/:id/role
prisma/
├── schema.prisma           # User, Car, SavedMatch
└── seed.ts                 # Dados iniciais
```

## Rotas da API

### Públicas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/cars` | Lista todos os carros |
| GET | `/api/cars/:id` | Carro por ID |
| POST | `/api/auth/register` | Cadastro de usuário |
| POST | `/api/auth/login` | Login (retorna JWT) |

### Autenticadas (requer header `Authorization: Bearer <token>`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/matches` | Matches salvos do usuário |
| POST | `/api/matches` | Salvar um match |
| DELETE | `/api/matches/:id` | Remover match |

### Admin (requer token de admin)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/admin/cars` | Listar carros |
| POST | `/api/admin/cars` | Criar carro |
| PUT | `/api/admin/cars/:id` | Atualizar carro |
| DELETE | `/api/admin/cars/:id` | Excluir carro |
| GET | `/api/admin/users` | Listar usuários |
| PUT | `/api/admin/users/:id/role` | Alterar role (`USER` ou `ADMIN`) |

## Admin padrão (seed)

```
Email: admin@automatch.com
Senha: admin123
```

## Modelo de dados

### User

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Primary key |
| firstName | String | Primeiro nome |
| surname | String | Sobrenome |
| email | String (único) | Email de acesso |
| password | String | Hash bcrypt |
| role | String | `USER` ou `ADMIN` |
| createdAt | DateTime | Data de criação |

### Car

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String | Identificador amigável (ex: `kwid-iconic-2026`) |
| name | String | Nome do carro |
| year | Int | Ano |
| price | Float | Preço em R$ |
| category | String | Categoria (Popular, Clássico, etc.) |
| engine/power/consumption/weight | String | Especificações |
| ipva/insurance/maintenance | Float | Custos |
| features | String (JSON) | Array de características |
| mainImage | String | URL da imagem principal |
| thumbnailImages | String (JSON) | Array de URLs das thumbnails |

### SavedMatch

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Primary key |
| userId | String | FK para User |
| carId | String | FK para Car |
| matchPercentage | Float | % de match |
| savedAt | DateTime | Data em que foi salvo |

## Frontend

O frontend Angular consome esta API em `http://localhost:3000/api`.

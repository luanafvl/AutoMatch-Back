# ⚙️ AutoMatch - Backend (Orchestrator)

O **AutoMatch-Back** é o coração do ecossistema, responsável por gerenciar os dados dos veículos, usuários e atuar como o orquestrador entre o Frontend e o Motor de Recomendação (IA).

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| **Runtime** | Node.js (v22+) + TypeScript |
| **Framework** | Express.js |
| **ORM** | Prisma 5 |
| **Database** | SQLite (Local & Fast) |
| **Auth** | JWT + bcrypt |
| **IA Bridge** | Fetch API (Native Node.js) |

## 🔄 Fluxo de Dados (Orquestração)

O backend possui uma lógica especial para recomendações:
1. O **Frontend** envia as `UserPreferences` (perfil do Novo Match com 4 etapas).
2. O **Backend** busca todos os carros disponíveis no banco de dados (com `Car.id` em hash SHA-256).
3. O **Backend** envia o par `(User + Cars)` para o microsserviço de **Deep Learning** (Python).
4. O **Motor de IA** retorna o score híbrido: modelo two-tower + preference boost (uso principal e ambiente).
5. O **Backend** ordena os resultados, persiste o melhor match para o usuário e retorna a lista completa.
6. O **Frontend** recebe a recomendação final processada com match percentage.

## 🚀 Como Iniciar

### Pré-requisitos
- Node.js >= 18
- npm

### Instalação e Setup
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Configure o banco de dados (SQLite):
   ```bash
   npx prisma migrate dev
   ```
3. (Opcional) Popule o banco com dados iniciais:
   ```bash
   npm run db:seed
   ```
4. Inicie em modo de desenvolvimento:
   ```bash
   npm run dev
   ```

## 📡 API Endpoints Principais

### Recomendações (O Diferencial)
- `POST /api/matches/recommendations`: Recebe o Quiz e retorna o melhor match via IA.

### Autenticação
- `POST /api/auth/register`: Cadastro de novos usuários.
- `POST /api/auth/login`: Login e obtenção do token JWT.

### Catálogo
- `GET /api/cars`: Lista todos os veículos.
- `GET /api/admin/cars`: Gestão administrativa do catálogo.

## 📝 Dados do Novo Match

O backend recebe e valida:
- **Demographics:** tamanho do grupo (2, 3-4, 5+), uso principal, ambiente
- **Financials:** orçamento máximo
- **Technical:** categorias (Hatch, Sedan, SUV, Picape, Eletrico, Premium), faixa de ano, câmbio
- **Priorities:** economia e potência (1-5)

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` na raiz:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="sua_chave_secreta_aqui"
AI_SERVICE_URL="http://localhost:8000"
```

## 🔐 Banco de Dados

Todos os `Car.id` estão em formato hash SHA-256 para segurança e unicidade. O seed mantém esse padrão automaticamente.

---
Desenvolvido como parte do ecossistema **AutoMatch**.

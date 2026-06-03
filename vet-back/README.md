# 🐾 Sistema Clínica Veterinária — Backend API

API REST construída com **Node.js + Fastify + Prisma + PostgreSQL**.

---

## Pré-requisitos

- [Node.js 20+](https://nodejs.org/)
- [PostgreSQL 15+](https://www.postgresql.org/download/)

---

## Instalação

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar o banco de dados
Copie o arquivo de variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o `.env` com os dados do seu PostgreSQL:
```
DATABASE_URL="postgresql://postgres:suasenha@localhost:5432/vet_clinic"
JWT_SECRET="uma-chave-secreta-longa-e-aleatoria"
```

### 3. Criar o banco e as tabelas
```bash
npm run db:migrate
```
> Quando pedir um nome para a migration, escreva: `inicio`

### 4. Criar o primeiro usuário (veterinária)
```bash
# Rode o servidor e faça uma requisição POST para criar o login:
curl -X POST http://localhost:3333/auth/registrar \
  -H "Content-Type: application/json" \
  -d '{"nome":"Dra. Nome","email":"email@clinica.com","senha":"senha123","crmv":"12345-SP"}'
```

### 5. Iniciar o servidor
```bash
# Modo desenvolvimento (reinicia ao salvar)
npm run dev

# Modo produção
npm start
```

O servidor sobe em: **http://localhost:3333**

---

## Rotas disponíveis

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/login` | Login |
| GET  | `/dashboard` | Resumo do dia |
| GET/POST | `/tutores` | Gerenciar tutores |
| GET/POST | `/animais` | Gerenciar animais/pacientes |
| GET/POST | `/consultas` | Agendamentos |
| GET  | `/consultas/hoje` | Agenda do dia |
| GET/POST/PUT | `/prontuarios` | Prontuário eletrônico |
| POST | `/prontuarios/:id/finalizar` | Concluir consulta |
| GET  | `/pdf/prontuario/:id` | **Gerar PDF do prontuário** |
| GET  | `/pdf/receita/:id` | **Gerar receita para impressão** |
| GET  | `/vacinas/alertas` | Vacinas a vencer |
| POST | `/vacinas` | Registrar vacina |

---

## Banco de dados (Prisma Studio)
Visualize e edite os dados diretamente no navegador:
```bash
npm run db:studio
```
Abre em: http://localhost:5555

---

## Estrutura do projeto
```
vet-clinic/
├── prisma/
│   └── schema.prisma      # Estrutura do banco de dados
├── src/
│   ├── server.js           # Servidor principal
│   └── routes/
│       ├── auth.js         # Login / autenticação
│       ├── tutores.js      # Donos dos animais
│       ├── animais.js      # Pacientes
│       ├── consultas.js    # Agendamentos e atendimentos
│       ├── prontuarios.js  # Prontuário eletrônico
│       ├── vacinas.js      # Controle de vacinas
│       ├── dashboard.js    # Resumos e métricas
│       └── pdf.js          # Geração de PDF (prontuário e receita)
├── .env.example
└── package.json
```

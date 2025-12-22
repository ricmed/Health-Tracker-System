# Sistema de Registro e Monitoramento de Problemas de Saúde

Um sistema abrangente de registro e monitoramento de problemas de saúde, construído com Django (backend) e React (frontend). O sistema suporta registro e monitoramento de diversos tipos de problemas de saúde com construtor de formulários dinâmicos (esquemas JSONB), gerenciamento de pacientes, controle de acesso baseado em funções e requisitos de campos condicionais.

## 📋 Descrição do Projeto

Este sistema foi desenvolvido para facilitar o registro, monitoramento e acompanhamento de diversos problemas de saúde em ambiente clínico. Oferece funcionalidades avançadas como:

- **Registro dinâmico de problemas de saúde**: Suporta vários tipos de problemas com características únicas
- **Construtor de formulários dinâmicos**: Administradores podem criar formulários personalizados para cada tipo de problema de saúde
- **Gerenciamento de pacientes**: Dados pessoais completos, endereços e histórico de saúde
- **Controle de acesso baseado em funções**: Usuários podem registrar apenas os problemas de saúde para os quais têm permissão
- **Campos condicionais**: Suporte para campos que se tornam obrigatórios com base em valores de outros campos
- **Design de nível empresarial**: Interface clínica e profissional seguindo padrões healthcare

## 🏗️ Arquitetura

### Estrutura Geral

A aplicação é dividida em três camadas principais:

```
┌─────────────────────────────────────────────────────┐
│         Frontend (React + Vite)                     │
│         Porta: 5000                                 │
│  (Componentes shadcn/ui + TailwindCSS + wouter)    │
└──────────────┬──────────────────────────────────────┘
               │
     ┌─────────┴──────────┐
     │ Express Server     │
     │ (Proxy + Assets)   │
     └─────────┬──────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│    Backend (Django REST Framework)                  │
│    Porta: 8000                                      │
│    (Autenticação via sessão + PostgreSQL)           │
└─────────────────────────────────────────────────────┘
```

### Backend (Django)

**Tecnologias:**
- Django REST Framework para endpoints de API
- PostgreSQL com abordagem híbrida relacional + JSONB
- Autenticação baseada em sessão (não JWT)
- Comando de seed para dados iniciais

**Aplicações Django:**

1. **accounts** - Gerenciamento de usuários e autorização
   - `User` - Modelo de usuário personalizado com email como username
   - `Role` - Funções/papéis de usuário
   - Relação many-to-many com tipos de problemas de saúde (permissões)

2. **patients** - Gerenciamento de pacientes
   - `Patient` - Dados demográficos e informações de contato completas
   - `PatientAddress` - Endereços dos pacientes

3. **health_problems** - Tipos de problemas de saúde e formulários dinâmicos
   - `HealthProblemType` - Define tipos de problemas (ex: Diabetes, Hipertensão) com esquemas JSONB
   - `PatientHealthProblem` - Links entre pacientes e tipos de problemas
   - `FormQuestion` - Questões de formulário individuais
   - `FormResponse` - Respostas do paciente aos formulários dinâmicos
   - `AuditLog` - Registro de auditoria de todas as ações

4. **core** - Utilitários centrais
   - Comandos de gerenciamento (seed data)

### Frontend (React)

**Tecnologias:**
- Vite para desenvolvimento e build
- TanStack Query (React Query) para fetching de dados
- shadcn/ui para componentes reutilizáveis
- TailwindCSS para styling
- wouter para roteamento client-side
- React Hook Form com validação Zod
- Lucide React para ícones

**Estrutura de pastas:**

```
client/src/
├── components/          # Componentes reutilizáveis
├── pages/              # Páginas da aplicação
│   ├── dashboard/      # Dashboard principal
│   ├── patients/       # Gerenciamento de pacientes
│   ├── health-problems/ # Registro de problemas
│   └── form-builder/   # Construtor de formulários
├── context/            # Contexto da aplicação
├── hooks/              # Hooks customizados
├── lib/                # Utilitários e configurações
├── types/              # Tipos TypeScript
└── App.tsx             # Componente raiz
```

### Express Server

- Funciona como proxy para encaminhar requisições `/api` para Django
- Serve os arquivos estáticos do frontend Vite
- Gerencia a integração entre frontend e backend

## 📊 Modelos de Dados

### User (accounts.User)
```
- id: Integer (PK)
- email: String (unique)
- first_name: String
- last_name: String
- is_active: Boolean
- is_staff: Boolean
- created_at: DateTime
- updated_at: DateTime
- roles: ManyToMany
- health_problem_permissions: ManyToMany
```

### Patient (patients.Patient)
```
- id: Integer (PK)
- full_name: String
- date_of_birth: Date
- gender: String
- email: String
- phone: String
- medical_record_id: String (unique)
- created_at: DateTime
- updated_at: DateTime
- addresses: OneToMany (PatientAddress)
```

### HealthProblemType (health_problems.HealthProblemType)
```
- id: Integer (PK)
- name: String
- code: String (unique)
- description: String
- color: String (hex color)
- icon: String
- is_active: Boolean
- question_schema: JSONB (contém perguntas dinâmicas)
- schema_version: Integer
- created_by: ForeignKey (User)
- created_at: DateTime
- updated_at: DateTime
```

### PatientHealthProblem (health_problems.PatientHealthProblem)
```
- id: Integer (PK)
- patient: ForeignKey
- health_problem_type: ForeignKey
- status: String (active/resolved/monitoring)
- severity: String (mild/moderate/severe)
- diagnosis_date: Date
- resolution_date: Date (nullable)
- registered_by: ForeignKey (User)
- created_at: DateTime
- updated_at: DateTime
```

### FormResponse (health_problems.FormResponse)
```
- id: Integer (PK)
- patient_health_problem: ForeignKey
- answers: JSONB (respostas do formulário)
- schema_version: Integer
- submitted_by: ForeignKey (User)
- created_at: DateTime
- updated_at: DateTime
```

## 🔌 Endpoints da API

### Autenticação
- `POST /api/auth/login/` - Login do usuário
- `POST /api/auth/logout/` - Logout do usuário
- `GET /api/auth/profile/` - Obter dados do usuário atual

### Usuários
- `GET /api/auth/users/` - Listar usuários
- `POST /api/auth/users/{id}/toggle_active/` - Ativar/desativar usuário
- `POST /api/auth/users/{id}/assign_health_problems/` - Atribuir permissões

### Pacientes
- `GET /api/patients/patients/` - Listar pacientes
- `POST /api/patients/patients/` - Criar novo paciente
- `GET /api/patients/patients/{id}/` - Obter detalhes do paciente
- `PUT /api/patients/patients/{id}/` - Atualizar paciente

### Tipos de Problemas de Saúde
- `GET /api/health-problems/types/` - Listar tipos
- `POST /api/health-problems/types/` - Criar novo tipo
- `GET /api/health-problems/types/{id}/` - Obter detalhes do tipo
- `PUT /api/health-problems/types/{id}/` - Atualizar tipo
- `GET /api/health-problems/types/permitted/` - Obter tipos permitidos para o usuário
- `POST /api/health-problems/types/{id}/toggle_active/` - Ativar/desativar tipo

### Problemas de Saúde do Paciente
- `GET /api/health-problems/patient-problems/` - Listar
- `POST /api/health-problems/patient-problems/` - Criar novo
- `GET /api/health-problems/patient-problems/{id}/` - Obter detalhes
- `POST /api/health-problems/patient-problems/{id}/update_status/` - Atualizar status
- `POST /api/health-problems/patient-problems/{id}/add_response/` - Adicionar resposta de formulário

### Respostas de Formulário
- `GET /api/health-problems/form-responses/` - Listar respostas
- `POST /api/health-problems/form-responses/` - Criar nova resposta

## 🚀 Como Executar

### Pré-requisitos
- Node.js (v18+)
- Python (v3.9+)
- PostgreSQL (incluído no Replit)

### Instalação e Execução

1. **Clonar e instalar dependências**
   ```bash
   npm install
   pip install -r requirements.txt
   ```

2. **Configurar banco de dados**
   ```bash
   python manage.py migrate
   python manage.py seed_data
   ```

3. **Iniciar a aplicação**
   ```bash
   npm run dev
   ```

   Isto irá:
   - Iniciar o servidor Django na porta 8000
   - Iniciar o servidor Express/Vite na porta 5000
   - Disponibilizar a aplicação em http://localhost:5000

### Credenciais Padrão

- **Email**: admin@health.com
- **Senha**: admin123
- **Função**: Administrador do Sistema

## 🎨 Design e Interface

- **Fonte**: Inter
- **Tema**: Suporte para modo claro e escuro
- **Componentes**: shadcn/ui com TailwindCSS
- **Design**: Limpo e clínico, seguindo padrões healthcare de nível empresarial

## 🔐 Segurança

- Autenticação baseada em sessão
- Proteção CSRF habilitada
- Validação de dados via Zod
- Controle de acesso baseado em funções
- Registro de auditoria de todas as ações

## 📁 Estrutura do Projeto

```
/
├── manage.py                 # Django management
├── requirements.txt          # Dependências Python
├── package.json             # Dependências Node
├── vite.config.ts           # Configuração Vite
├── tailwind.config.ts       # Configuração TailwindCSS
├── health_system/           # Configurações Django
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── accounts/                # App de autenticação/usuários
├── patients/                # App de gerenciamento de pacientes
├── health_problems/         # App de problemas de saúde
├── core/                    # App com utilitários
├── client/                  # Aplicação React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── index.html
└── server/                  # Servidor Express
    ├── index.ts
    ├── routes.ts
    └── vite.ts
```

## 🔄 Fluxo de Dados

1. **Usuário interage com o frontend** → Componente React
2. **Frontend faz requisição** → TanStack Query
3. **Express proxy encaminha** → Django API
4. **Django processa** → Valida, autentica, executa lógica
5. **Django retorna dados** → JSON response
6. **Frontend atualiza estado** → Re-render componentes
7. **UI atualizada** → Usuário vê resultado

## 🛠️ Stack Técnico Resumido

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18, Vite, TypeScript |
| UI | shadcn/ui, TailwindCSS, Lucide Icons |
| Data Fetching | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Routing | wouter |
| Backend | Django REST Framework |
| Database | PostgreSQL |
| Server | Express, Vite |
| Autenticação | Session-based |

## 📝 Licença

Projeto desenvolvido para fins educacionais e de saúde.

---

**Desenvolvido com ❤️ para a gestão eficiente de problemas de saúde**

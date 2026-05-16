# 🌟 Restaurando Vidas — Sistema de Gestão Clínica

> *"Ser moldado dói, mas vale a pena!"*
> Cuidado da Alma · Apoio Psicológico Gratuito

---


## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + React Router 6 |
| Backend | Firebase Firestore + Auth + Storage |
| PDF | jsPDF + jspdf-autotable |
| Deploy | Firebase Hosting via GitHub Actions |
| Design | Dark Mode + Gold (#D4AF37) |

---

## 🚀 Setup em 5 Passos

### 1. Clone e instale
```bash
git clone https://github.com/SEU_USER/restaurando-vidas.git
cd restaurando-vidas
npm install
```

### 2. Configure o Firebase
1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Crie um projeto chamado `restaurando-vidas`
3. Ative: **Authentication** (Email/Senha), **Firestore**, **Storage**, **Hosting**
4. Em Configurações do Projeto → Seus apps → Adicione um app Web
5. Copie as credenciais

```bash
cp .env.example .env
# Edite .env com suas credenciais Firebase
```

### 3. Configure as Regras do Firestore
No Console Firebase → Firestore → Rules, cole o conteúdo de `firestore.rules`

### 4. Crie a primeira conta (Gestora — Lúcia)
```bash
# Com o app rodando localmente:
npm start
# Abra o app, faça login com Firebase Authentication diretamente no console
# Ou use a página /usuarios após criar manualmente no Firebase Console
```

**No Firebase Console (Auth):**
1. Authentication → Users → Add user
2. Email: `lucia@restaurandovidas.com.br` / Senha: sua escolha
3. Copie o UID gerado

**No Firestore, crie o documento:**
```
Collection: users
Document ID: [UID copiado acima]
Fields:
  nome: "Lúcia Kratz"
  role: "gestora"
  email: "lucia@restaurandovidas.com.br"
  active: true
  createdAt: [timestamp atual]
```

Após isso, a Gestora pode criar outros usuários pelo sistema.

### 5. Deploy
```bash
# Instale Firebase CLI
npm install -g firebase-tools
firebase login
firebase init hosting

# Deploy manual
npm run build
firebase deploy
```

---

## 🔐 Hierarquia de Acesso (RBAC)

| Perfil | role | Permissões |
|---|---|---|
| **Gestora (Lúcia)** | `gestora` | Acesso total: triagem, prontuários, interconsultas, relatórios, usuários, PDF |
| **Pastor / ADM** | `pastor` | Dashboard geral + Indicar Pacientes (sem dados clínicos) |
| **Estagiário** | `aluno` | Atendimentos, Solicitar Especialista, Criar/Ver Relatórios próprios |
| **Prof. de Saúde** | `profissional` | Indicar pacientes, Ver seus pacientes, Ver relatórios aprovados |

---

## 📋 Fluxos Críticos Implementados

### Fluxo 1: Triagem de Pacientes
```
Pastor indica → Firestore: pacientes (status: pendente)
→ Gestora vê no Dashboard → Atribui aluno/profissional → status: ativo
```

### Fluxo 2: Interconsulta (Funcionalidade Crítica)
```
Aluno: botão "Solicitar Profissional de Saúde"
→ Firestore: interconsultas (status: pendente)
→ Gestora recebe alerta no sidebar → Revisa e aprova
→ Atribui profissional específico → status: aprovada
```

### Fluxo 3: Relatórios Editáveis (Funcionalidade Crítica)
```
Aluno: preenche relatório → status: pendente_revisao
→ Gestora: abre em modo edição → edita campos + adiciona Obs. Supervisão
→ Clica "Validar e Aprovar" → status: aprovado
→ PDF fica disponível para todos os envolvidos
→ Download gera PDF dark/gold profissional
```

---

## ⚙️ GitHub Actions — Deploy Automático

Adicione estes **Secrets** no repositório (Settings → Secrets):

| Secret | Valor |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | JSON completo da Service Account |
| `REACT_APP_FIREBASE_API_KEY` | Da configuração do app Firebase |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | idem |
| `REACT_APP_FIREBASE_PROJECT_ID` | idem |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | idem |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | idem |
| `REACT_APP_FIREBASE_APP_ID` | idem |

**Para obter a Service Account:**
Firebase Console → Configurações → Contas de serviço → Gerar nova chave privada

Após configurar, cada `git push` na branch `main` faz deploy automático! 🚀

---

## 📁 Estrutura de Arquivos

```
restaurando-vidas/
├── .github/
│   └── workflows/
│       └── deploy.yml          ← CI/CD GitHub Actions
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Layout.js           ← Wrapper com sidebar
│   │   ├── Sidebar.js          ← Navegação RBAC
│   │   └── ProtectedRoute.js   ← Guard de rotas
│   ├── contexts/
│   │   └── AuthContext.js      ← Auth + RBAC
│   ├── pages/
│   │   ├── LoginPage.js
│   │   ├── DashboardPage.js
│   │   ├── IndicarPacientePage.js
│   │   ├── InterconsultasPage.js    ← Aprovação Gestora
│   │   ├── RelatoriosPage.js        ← Revisão + PDF
│   │   ├── MeusRelatoriosPage.js    ← Aluno cria relatório
│   │   ├── SolicitarEspecialistaPage.js
│   │   └── UsuariosPage.js
│   ├── services/
│   │   └── firebase.js
│   ├── utils/
│   │   └── gerarPDF.js         ← jsPDF dark/gold
│   ├── App.js
│   ├── index.css               ← Design system dark/gold
│   └── index.js
├── .env.example
├── .gitignore
├── firebase.json
├── firestore.rules             ← Regras de segurança
└── package.json
```

---

## 🎨 Design System

- **Background:** `#0A0A0A` (base) / `#111111` (surface) / `#161616` (card)
- **Gold:** `#D4AF37` (primário) / `#F0D060` (hover) / `#A88A20` (dark)
- **Fonts:** Cinzel (títulos) + Raleway (corpo)
- **PDF:** Dark theme com asssinaturas e validação da Gestora

---

## 📝 Próximos Módulos (Em Desenvolvimento)

- [ ] **Prontuários** — Registro completo do histórico clínico
- [ ] **Atendimentos** — Agenda e evolução semanal (Qui/Sex)
- [ ] **Meus Pacientes (Profissional)** — View do Prof. de Saúde
- [ ] **Notificações push** — Firebase Cloud Messaging
- [ ] **Frequência QR Code** — Registro de presença

---

*Desenvolvido com ❤️ para o projeto Restaurando Vidas*
*Stack: React + Firebase + GitHub Actions*

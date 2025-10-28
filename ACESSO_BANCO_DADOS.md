# Guia de Acesso ao Banco de Dados - Açaí Prime

## 📊 3 Formas de Acessar o Banco de Dados

### 1. Painel Administrativo (RECOMENDADO) 🎯

O jeito mais fácil de visualizar e gerenciar seus dados:

**Acesso:**
- URL: `https://seu-site.replit.app/admin/login`
- Email: `admin@acaiprime.com`
- Senha: `admin123`

**O que você pode fazer:**
- ✅ Ver dashboard com analytics (vendas, visualizações, conversões)
- ✅ Gerenciar produtos (adicionar, editar, ativar/desativar)
- ✅ Ver todos os pedidos e detalhes dos clientes
- ✅ Visualizar transações de pagamento (PIX e Cartão)
- ✅ Gerenciar avaliações (aprovar, editar, moderar)

**⚠️ IMPORTANTE:** Altere a senha do admin em produção!

---

### 2. Database Pane do Replit 🔧

Para executar queries SQL diretamente:

**Como acessar:**
1. Na barra lateral esquerda do Replit, clique no ícone **"Database"** 🗄️
2. Você verá todas as tabelas do seu banco de dados
3. Pode executar queries SQL diretamente no console

**Exemplos de queries úteis:**

```sql
-- Ver todos os produtos
SELECT * FROM products;

-- Ver pedidos recentes
SELECT * FROM orders ORDER BY "createdAt" DESC LIMIT 10;

-- Ver total de vendas
SELECT SUM(total) as total_vendas FROM orders;

-- Ver transações PIX
SELECT * FROM transactions WHERE "paymentMethod" = 'pix';

-- Estatísticas de produtos mais vendidos
SELECT p.name, COUNT(o.id) as total_pedidos
FROM products p
JOIN orders o ON o."productId" = p.id
GROUP BY p.name
ORDER BY total_pedidos DESC;
```

---

### 3. Variáveis de Ambiente (Programático) 💻

Para conectar via código ou ferramentas externas:

**Credenciais disponíveis:**
```
DATABASE_URL=postgresql://postgres:password@helium/heliumdb?sslmode=disable
PGHOST=helium
PGPORT=5432
PGUSER=postgres
PGPASSWORD=password
PGDATABASE=heliumdb
```

**Usar com ferramenta externa (ex: TablePlus, DBeaver):**
- Host: `helium`
- Port: `5432`
- Database: `heliumdb`
- Username: `postgres`
- Password: `password`

---

## 📋 Estrutura do Banco de Dados

### Tabelas Principais:

1. **products** - Catálogo de produtos
   - id, name, description, price, image, size, etc.

2. **orders** - Pedidos dos clientes
   - id, customerName, customerPhone, address, total, status, etc.

3. **transactions** - Pagamentos (PIX e Cartão)
   - id, orderId, paymentMethod, status, pixCode, cardData, etc.

4. **users** - Usuários admin
   - id, email, passwordHash, name, role

5. **analytics_events** - Eventos de tracking
   - id, eventType, sessionId, metadata, etc.

6. **session** - Sessões de autenticação
   - sid, sess, expire

---

## 🛡️ Segurança

- Todas as senhas são armazenadas com hash bcrypt
- Sessões são persistidas no PostgreSQL (não em memória)
- Rate limiting ativo no admin (máx 5 tentativas de login)
- Em produção, sempre use HTTPS e altere credenciais padrão

---

## 🚀 Comandos Úteis

```bash
# Sincronizar schema do banco
npm run db:push

# Popular produtos iniciais
curl -X POST http://localhost:5000/api/seed-products

# Criar usuário admin
curl -X POST http://localhost:5000/api/seed-admin
```

---

## 📞 Suporte

Se tiver dúvidas sobre o banco de dados, consulte:
- `replit.md` - Documentação completa do projeto
- `shared/schema.ts` - Schema do banco de dados
- `/admin` - Painel administrativo com interface visual

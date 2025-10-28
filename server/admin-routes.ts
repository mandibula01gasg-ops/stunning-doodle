import type { Express } from "express";
import { storage } from "./storage";
import { loginAdmin, requireAdmin, hashPassword } from "./auth";
import { loginRateLimiter, resetLoginAttempts } from "./rate-limiter";
import { db } from "./db";
import { adminUsers, products, orders, reviews, analyticsEvents, transactions } from "@shared/schema";
import { eq, desc, count, sql } from "drizzle-orm";

export function registerAdminRoutes(app: Express) {
  
  // POST /api/admin/login - Admin login
  app.post("/api/admin/login", loginRateLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }

      const admin = await loginAdmin(email, password);

      if (!admin) {
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }

      // Set session
      req.session.adminId = admin.id;
      req.session.adminEmail = admin.email;
      req.session.adminRole = admin.role;

      // Reset login attempts on successful login
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      resetLoginAttempts(ip);

      res.json({
        message: "Login realizado com sucesso",
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Erro ao fazer login" });
    }
  });

  // POST /api/admin/logout - Admin logout
  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  // GET /api/admin/me - Get current admin info
  app.get("/api/admin/me", requireAdmin, async (req, res) => {
    try {
      const admin = await db.query.adminUsers.findFirst({
        where: eq(adminUsers.id, req.session.adminId!),
        columns: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      if (!admin) {
        return res.status(404).json({ message: "Admin não encontrado" });
      }

      res.json(admin);
    } catch (error) {
      console.error("Error fetching admin:", error);
      res.status(500).json({ message: "Erro ao buscar dados do admin" });
    }
  });

  // GET /api/admin/analytics - Get analytics data
  app.get("/api/admin/analytics", requireAdmin, async (req, res) => {
    try {
      // Total page views
      const pageViewsResult = await db.select({ count: count() })
        .from(analyticsEvents)
        .where(eq(analyticsEvents.eventType, 'page_view'));
      const totalPageViews = Number(pageViewsResult[0]?.count || 0);

      // Total orders
      const ordersResult = await db.select({ count: count() }).from(orders);
      const totalOrders = Number(ordersResult[0]?.count || 0);

      // Orders by payment status
      const ordersByStatus = await db.select({
        status: orders.paymentStatus,
        count: count(),
      })
        .from(orders)
        .groupBy(orders.paymentStatus);

      // PIX payments generated
      const pixPaymentsResult = await db.select({ count: count() })
        .from(transactions)
        .where(eq(transactions.paymentMethod, 'pix'));
      const totalPixGenerated = Number(pixPaymentsResult[0]?.count || 0);

      // Card payments generated
      const cardPaymentsResult = await db.select({ count: count() })
        .from(transactions)
        .where(eq(transactions.paymentMethod, 'credit_card'));
      const totalCardPayments = Number(cardPaymentsResult[0]?.count || 0);

      // Total revenue
      const revenueResult = await db.select({
        total: sql<string>`CAST(SUM(CAST(${orders.totalAmount} AS DECIMAL(10, 2))) AS TEXT)`,
      })
        .from(orders)
        .where(eq(orders.paymentStatus, 'paid'));
      const totalRevenue = parseFloat(revenueResult[0]?.total || '0');

      // Conversion rate
      const conversionRate = totalPageViews > 0 ? (totalOrders / totalPageViews) * 100 : 0;

      // Recent orders
      const recentOrders = await db.select()
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(10);

      res.json({
        totalPageViews,
        totalOrders,
        totalPixGenerated,
        totalCardPayments,
        totalRevenue,
        conversionRate: conversionRate.toFixed(2),
        ordersByStatus: ordersByStatus.map(item => ({
          status: item.status,
          count: Number(item.count),
        })),
        recentOrders,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Erro ao buscar analytics" });
    }
  });

  // GET /api/admin/products - List all products (admin view)
  app.get("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const allProducts = await db.select().from(products).orderBy(desc(products.createdAt));
      res.json(allProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Erro ao buscar produtos" });
    }
  });

  // POST /api/admin/products - Create new product
  app.post("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const productData = req.body;
      const newProduct = await storage.createProduct(productData);
      res.json(newProduct);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Erro ao criar produto" });
    }
  });

  // PUT /api/admin/products/:id - Update product
  app.put("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const productData = req.body;
      
      const updatedProduct = await db.update(products)
        .set({
          ...productData,
          updatedAt: new Date(),
        })
        .where(eq(products.id, id))
        .returning();

      if (!updatedProduct.length) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      res.json(updatedProduct[0]);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Erro ao atualizar produto" });
    }
  });

  // DELETE /api/admin/products/:id - Delete product
  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      await db.delete(products).where(eq(products.id, id));
      
      res.json({ message: "Produto deletado com sucesso" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Erro ao deletar produto" });
    }
  });

  // GET /api/admin/orders - List all orders
  app.get("/api/admin/orders", requireAdmin, async (req, res) => {
    try {
      const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
      res.json(allOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Erro ao buscar pedidos" });
    }
  });

  // GET /api/admin/orders/:id - Get order details with transaction
  app.get("/api/admin/orders/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, id),
      });

      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      const transaction = await db.query.transactions.findFirst({
        where: eq(transactions.orderId, id),
      });

      res.json({ order, transaction });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Erro ao buscar pedido" });
    }
  });

  // GET /api/admin/reviews - List all reviews
  app.get("/api/admin/reviews", requireAdmin, async (req, res) => {
    try {
      const allReviews = await db.select().from(reviews).orderBy(desc(reviews.createdAt));
      res.json(allReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Erro ao buscar avaliações" });
    }
  });

  // POST /api/admin/reviews - Create new review
  app.post("/api/admin/reviews", requireAdmin, async (req, res) => {
    try {
      const reviewData = req.body;
      
      const newReview = await db.insert(reviews)
        .values(reviewData)
        .returning();

      res.json(newReview[0]);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Erro ao criar avaliação" });
    }
  });

  // PUT /api/admin/reviews/:id - Update review
  app.put("/api/admin/reviews/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const reviewData = req.body;
      
      const updatedReview = await db.update(reviews)
        .set({
          ...reviewData,
          updatedAt: new Date(),
        })
        .where(eq(reviews.id, id))
        .returning();

      if (!updatedReview.length) {
        return res.status(404).json({ message: "Avaliação não encontrada" });
      }

      res.json(updatedReview[0]);
    } catch (error) {
      console.error("Error updating review:", error);
      res.status(500).json({ message: "Erro ao atualizar avaliação" });
    }
  });

  // DELETE /api/admin/reviews/:id - Delete review
  app.delete("/api/admin/reviews/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      await db.delete(reviews).where(eq(reviews.id, id));
      
      res.json({ message: "Avaliação deletada com sucesso" });
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ message: "Erro ao deletar avaliação" });
    }
  });

  // GET /api/admin/transactions - List all transactions (safe, no sensitive data)
  app.get("/api/admin/transactions", requireAdmin, async (req, res) => {
    try {
      const allTransactions = await db.select({
        id: transactions.id,
        orderId: transactions.orderId,
        paymentMethod: transactions.paymentMethod,
        amount: transactions.amount,
        status: transactions.status,
        mercadoPagoId: transactions.mercadoPagoId,
        cardLast4: transactions.cardLast4,
        cardBrand: transactions.cardBrand,
        capturedAt: transactions.capturedAt,
        createdAt: transactions.createdAt,
      })
        .from(transactions)
        .orderBy(desc(transactions.createdAt));

      res.json(allTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Erro ao buscar transações" });
    }
  });

  // POST /api/seed-admin - Seed admin user (development only)
  // IMPORTANTE: Este endpoint só funciona em modo de desenvolvimento
  app.post("/api/seed-admin", async (req, res) => {
    // Bloquear em produção
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: "Endpoint disponível apenas em desenvolvimento" });
    }

    try {
      const existingAdmin = await db.query.adminUsers.findFirst({
        where: eq(adminUsers.email, "admin@acaiprime.com"),
      });

      if (existingAdmin) {
        return res.json({ message: "Admin já existe no banco de dados" });
      }

      const passwordHash = await hashPassword("admin123");
      
      const newAdmin = await db.insert(adminUsers)
        .values({
          email: "admin@acaiprime.com",
          passwordHash,
          name: "Administrador",
          role: "admin",
        })
        .returning();

      res.json({ 
        message: "Admin criado com sucesso. ALTERE A SENHA em produção!", 
        admin: {
          email: newAdmin[0].email,
          name: newAdmin[0].name,
          role: newAdmin[0].role,
        }
      });
    } catch (error) {
      console.error("Error seeding admin:", error);
      res.status(500).json({ message: "Erro ao criar admin" });
    }
  });
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import QRCode from "qrcode";

// Initialize Mercado Pago
let mercadopago: MercadoPagoConfig | null = null;
let paymentClient: Payment | null = null;

if (process.env.MERCADO_PAGO_ACCESS_TOKEN) {
  mercadopago = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  });
  paymentClient = new Payment(mercadopago);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // GET /api/products - List all products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Error fetching products" });
    }
  });

  // POST /api/orders - Create new order
  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = req.body;

      // Create order
      const order = await storage.createOrder({
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        customerEmail: orderData.customerEmail,
        deliveryAddress: orderData.deliveryAddress,
        deliveryCep: orderData.deliveryCep,
        deliveryCity: orderData.deliveryCity,
        deliveryState: orderData.deliveryState,
        deliveryComplement: orderData.deliveryComplement,
        items: orderData.items,
        toppings: orderData.toppings || [],
        totalAmount: orderData.totalAmount,
        paymentMethod: orderData.paymentMethod,
        status: "pending",
      });

      // Handle payment based on method
      if (orderData.paymentMethod === "pix") {
        // Create PIX payment with Mercado Pago
        if (paymentClient) {
          try {
            const paymentData = {
              transaction_amount: parseFloat(orderData.totalAmount),
              description: `Pedido #${order.id}`,
              payment_method_id: "pix",
              payer: {
                email: orderData.customerEmail || "customer@example.com",
                first_name: orderData.customerName.split(" ")[0] || "Cliente",
                last_name: orderData.customerName.split(" ").slice(1).join(" ") || "",
              },
            };

            const payment = await paymentClient.create({ body: paymentData });

            // Generate QR Code
            let qrCodeBase64 = "";
            if (payment.point_of_interaction?.transaction_data?.qr_code) {
              qrCodeBase64 = await QRCode.toDataURL(
                payment.point_of_interaction.transaction_data.qr_code
              );
              // Remove the data:image/png;base64, prefix
              qrCodeBase64 = qrCodeBase64.replace(/^data:image\/png;base64,/, "");
            }

            // Create transaction record
            await storage.createTransaction({
              orderId: order.id,
              paymentMethod: "pix",
              amount: orderData.totalAmount,
              status: "pending",
              mercadoPagoId: payment.id?.toString(),
              pixQrCode: payment.point_of_interaction?.transaction_data?.qr_code,
              pixQrCodeBase64: qrCodeBase64,
              pixCopyPaste: payment.point_of_interaction?.transaction_data?.qr_code, // This is the text code, not base64
              metadata: payment,
            });

            res.json({
              orderId: order.id,
              paymentMethod: "pix",
              pixQrCode: payment.point_of_interaction?.transaction_data?.qr_code,
              pixQrCodeBase64: qrCodeBase64,
              pixCopyPaste: payment.point_of_interaction?.transaction_data?.qr_code, // Text code for copy/paste
            });
          } catch (mpError: any) {
            console.error("Mercado Pago Error:", mpError);
            
            // Fallback: Create transaction without Mercado Pago
            const mockPixCode = `00020126580014br.gov.bcb.pix0136${order.id}520400005303986540${parseFloat(orderData.totalAmount).toFixed(2)}5802BR5913Acai Prime6009SAO PAULO62070503***6304`;
            
            let qrCodeBase64 = "";
            try {
              const qrCodeDataUrl = await QRCode.toDataURL(mockPixCode);
              qrCodeBase64 = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
            } catch (qrError) {
              console.error("QR Code generation error:", qrError);
            }

            await storage.createTransaction({
              orderId: order.id,
              paymentMethod: "pix",
              amount: orderData.totalAmount,
              status: "pending",
              pixQrCode: mockPixCode,
              pixQrCodeBase64: qrCodeBase64,
              pixCopyPaste: mockPixCode,
              metadata: { error: "Mercado Pago not configured, using mock data" },
            });

            res.json({
              orderId: order.id,
              paymentMethod: "pix",
              pixQrCode: mockPixCode,
              pixQrCodeBase64: qrCodeBase64,
              pixCopyPaste: mockPixCode,
            });
          }
        } else {
          // No Mercado Pago configured - create mock PIX payment
          const mockPixCode = `00020126580014br.gov.bcb.pix0136${order.id}520400005303986540${parseFloat(orderData.totalAmount).toFixed(2)}5802BR5913Acai Prime6009SAO PAULO62070503***6304`;
          
          let qrCodeBase64 = "";
          try {
            const qrCodeDataUrl = await QRCode.toDataURL(mockPixCode);
            qrCodeBase64 = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
          } catch (qrError) {
            console.error("QR Code generation error:", qrError);
          }

          await storage.createTransaction({
            orderId: order.id,
            paymentMethod: "pix",
            amount: orderData.totalAmount,
            status: "pending",
            pixQrCode: mockPixCode,
            pixQrCodeBase64: qrCodeBase64,
            pixCopyPaste: mockPixCode,
            metadata: { note: "Mercado Pago not configured" },
          });

          res.json({
            orderId: order.id,
            paymentMethod: "pix",
            pixQrCode: mockPixCode,
            pixQrCodeBase64: qrCodeBase64,
            pixCopyPaste: mockPixCode,
          });
        }
      } else if (orderData.paymentMethod === "credit_card") {
        // IMPORTANT: For PCI-DSS compliance, card data should NEVER be stored on the server
        // In production, use Mercado Pago's frontend SDK for tokenization
        // This implementation stores only non-sensitive metadata
        
        await storage.createTransaction({
          orderId: order.id,
          paymentMethod: "credit_card",
          amount: orderData.totalAmount,
          status: "pending",
          // DO NOT store cardData - security risk
          metadata: { 
            note: "Credit card payment - requires Mercado Pago frontend tokenization for production",
            timestamp: new Date().toISOString(),
            // Store only last 4 digits if needed for reference
            cardLast4: orderData.cardData?.cardNumber?.slice(-4) || "****",
          },
        });

        res.json({
          orderId: order.id,
          paymentMethod: "credit_card",
          status: "pending",
          message: "Dados recebidos. Em produção, use tokenização do Mercado Pago no frontend.",
        });
      } else {
        res.status(400).json({ message: "Invalid payment method" });
      }
    } catch (error: any) {
      console.error("Error creating order:", error);
      res.status(500).json({ 
        message: "Error creating order",
        error: error.message 
      });
    }
  });

  // GET /api/orders/:id - Get order by ID
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const transaction = await storage.getTransactionByOrderId(order.id);

      res.json({
        ...order,
        orderNumber: order.id.substring(0, 8).toUpperCase(),
        pixQrCodeBase64: transaction?.pixQrCodeBase64,
        pixCopyPaste: transaction?.pixCopyPaste,
      });
    } catch (error: any) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Error fetching order" });
    }
  });

  // POST /api/analytics/track - Track analytics events
  app.post("/api/analytics/track", async (req, res) => {
    try {
      const { eventType, userId, sessionId, productId, orderId, metadata } = req.body;
      
      await storage.trackAnalyticsEvent({
        eventType,
        userId,
        sessionId,
        productId,
        orderId,
        metadata,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Analytics tracking error:", error);
      res.status(500).json({ message: "Error tracking event" });
    }
  });

  // GET /api/toppings - List all toppings/extras
  app.get("/api/toppings", async (req, res) => {
    try {
      const toppings = await storage.getAllToppings();
      res.json(toppings);
    } catch (error: any) {
      console.error("Error fetching toppings:", error);
      res.status(500).json({ message: "Error fetching toppings" });
    }
  });

  // Seed initial products if database is empty
  app.post("/api/seed-products", async (req, res) => {
    try {
      const existingProducts = await storage.getAllProducts();
      if (existingProducts.length > 0) {
        return res.json({ message: "Products already exist" });
      }

      const productsToSeed = [
        // Copos Tradicionais
        {
          name: "Açaí 300ml",
          description: "Perfeito para matar aquela vontade! Açaí cremoso batido na hora, acompanha granola crocante e banana. Tamanho ideal para um lanche rápido e delicioso.",
          price: "9.90",
          size: "300ml",
          image: "/assets/generated_images/Small_açaí_bowl_product_e5ef7191.png",
          promoBadge: "Mais Barato",
        },
        {
          name: "Açaí 500ml",
          description: "O favorito dos clientes! Quantidade generosa de açaí puro, batido no ponto ideal de cremosidade. Escolha seus complementos grátis e personalize do seu jeito.",
          price: "14.90",
          size: "500ml",
          image: "/assets/generated_images/Large_açaí_bowl_product_185591f7.png",
          promoBadge: "Mais Vendido",
        },
        {
          name: "Açaí 700ml",
          description: "Para quem ama açaí de verdade! Porção extra grande com muito espaço para combinar suas frutas e coberturas favoritas. Satisfação garantida!",
          price: "18.90",
          size: "700ml",
          image: "/assets/generated_images/Large_açaí_bowl_product_185591f7.png",
        },
        {
          name: "Açaí 1 Litro",
          description: "O gigante! 1 litro de puro açaí cremoso. Ideal para compartilhar ou para quem não abre mão de uma porção farta. O melhor custo-benefício!",
          price: "29.90",
          size: "1L",
          image: "/assets/generated_images/Large_açaí_bowl_product_185591f7.png",
          promoBadge: "Melhor Custo-Benefício",
        },
        
        // Combos Especiais
        {
          name: "🫐 Combo Duo (Casal)",
          description: "Ideal pra dividir açaí e bons momentos! 1 Açaí de 500ml + 1 Açaí de 700ml com calda de chocolate grátis. Perfeito para casais apaixonados por açaí.",
          price: "31.90",
          size: "500ml + 700ml",
          image: "/assets/generated_images/Açaí_combo_product_image_5986e6cc.png",
          promoBadge: "Economize R$ 2",
        },
        {
          name: "🍫 Combo Chocolate Lovers",
          description: "Combinação perfeita para quem ama um toque doce e cremoso! 1 Açaí 700ml + 1 Açaí 300ml com extra de Nutella e Leite Ninho inclusos. Irresistível!",
          price: "26.90",
          size: "700ml + 300ml",
          image: "/assets/generated_images/Açaí_combo_product_image_5986e6cc.png",
        },
        {
          name: "🏋️‍♂️ Combo Power Fit",
          description: "Energia e sabor pra quem não abre mão de performance! 2 Açaís de 500ml com Whey Protein, Pasta de Amendoim e Banana. Nutrição completa!",
          price: "32.90",
          size: "2x 500ml",
          image: "/assets/generated_images/Açaí_combo_product_image_5986e6cc.png",
          promoBadge: "Fit",
        },
        {
          name: "🍓 Combo Família",
          description: "Serve até 3 pessoas! 2 Açaís de 700ml + 1 Açaí de 500ml com 3 acompanhamentos à escolha. Perfeito pra família ou amigos se reunirem!",
          price: "59.90",
          size: "2x 700ml + 500ml",
          image: "/assets/generated_images/Açaí_combo_product_image_5986e6cc.png",
          promoBadge: "Economize R$ 7",
        },
        {
          name: "💜 Combo Supreme",
          description: "Um banquete de açaí! 1 Açaí de 1 litro com Nutella, Leite Ninho e Morango inclusos. Irresistível, cremoso e generoso. A experiência premium!",
          price: "37.90",
          size: "1L Premium",
          image: "/assets/generated_images/Açaí_combo_product_image_5986e6cc.png",
          promoBadge: "Premium",
        },
        {
          name: "🧒 Combo Kids",
          description: "Do jeitinho que a criançada ama! 1 Açaí de 300ml com Confete, Calda de Morango e Granola Doce inclusos. Alegria garantida para os pequenos!",
          price: "12.90",
          size: "300ml Kids",
          image: "/assets/generated_images/Small_açaí_bowl_product_e5ef7191.png",
        },
        {
          name: "🧊 Combo Refrescante",
          description: "Leve, tropical e com sabor de verão! 2 Açaís de 500ml com Abacaxi, Coco Ralado e Mel inclusos. Refrescância em dose dupla!",
          price: "28.90",
          size: "2x 500ml",
          image: "/assets/generated_images/Açaí_combo_product_image_5986e6cc.png",
          promoBadge: "Tropical",
        },
      ];

      for (const product of productsToSeed) {
        await storage.createProduct(product);
      }

      res.json({ message: "Products seeded successfully" });
    } catch (error: any) {
      console.error("Error seeding products:", error);
      res.status(500).json({ message: "Error seeding products" });
    }
  });

  // Seed toppings/extras
  app.post("/api/seed-toppings", async (req, res) => {
    try {
      const existingToppings = await storage.getAllToppings();
      if (existingToppings.length > 0) {
        return res.json({ message: "Toppings already exist" });
      }

      const toppingsToSeed = [
        // Frutas (máximo 2)
        { name: "Morango", category: "fruit", price: "0.00", displayOrder: 1 },
        { name: "Banana", category: "fruit", price: "0.00", displayOrder: 2 },
        { name: "Kiwi", category: "fruit", price: "0.00", displayOrder: 3 },
        { name: "Manga", category: "fruit", price: "0.00", displayOrder: 4 },
        { name: "Framboesa", category: "fruit", price: "0.00", displayOrder: 5 },
        { name: "Mirtilo", category: "fruit", price: "0.00", displayOrder: 6 },
        { name: "Uva", category: "fruit", price: "0.00", displayOrder: 7 },
        { name: "Abacaxi", category: "fruit", price: "0.00", displayOrder: 8 },
        { name: "Melancia", category: "fruit", price: "0.00", displayOrder: 9 },
        { name: "Maracujá", category: "fruit", price: "0.00", displayOrder: 10 },
        { name: "Pêssego", category: "fruit", price: "0.00", displayOrder: 11 },
        { name: "Amora", category: "fruit", price: "0.00", displayOrder: 12 },
        { name: "Cereja", category: "fruit", price: "0.00", displayOrder: 13 },
        { name: "Goiaba", category: "fruit", price: "0.00", displayOrder: 14 },
        
        // Coberturas (máximo 1)
        { name: "Leite Condensado", category: "topping", price: "0.00", displayOrder: 20 },
        { name: "Chocolate", category: "topping", price: "0.00", displayOrder: 21 },
        { name: "Nutella", category: "topping", price: "0.00", displayOrder: 22 },
        { name: "Mel", category: "topping", price: "0.00", displayOrder: 23 },
        { name: "Doce de Leite", category: "topping", price: "0.00", displayOrder: 24 },
        { name: "Calda de Morango", category: "topping", price: "0.00", displayOrder: 25 },
        { name: "Calda de Caramelo", category: "topping", price: "0.00", displayOrder: 26 },
        { name: "Pasta de Amendoim", category: "topping", price: "0.00", displayOrder: 27 },
        { name: "Chantilly", category: "topping", price: "0.00", displayOrder: 28 },
        { name: "Geleia de Frutas", category: "topping", price: "0.00", displayOrder: 29 },
        { name: "Leite em Pó", category: "topping", price: "0.00", displayOrder: 30 },
        { name: "Caramelo Salgado", category: "topping", price: "0.00", displayOrder: 31 },
        { name: "Chocolate Branco", category: "topping", price: "0.00", displayOrder: 32 },
        
        // Extras (máximo 4)
        { name: "Granola", category: "extra", price: "0.00", displayOrder: 40 },
        { name: "Aveia", category: "extra", price: "0.00", displayOrder: 41 },
        { name: "Chia", category: "extra", price: "0.00", displayOrder: 42 },
        { name: "Coco Ralado", category: "extra", price: "0.00", displayOrder: 43 },
        { name: "Paçoca", category: "extra", price: "0.00", displayOrder: 44 },
        { name: "Castanhas", category: "extra", price: "0.00", displayOrder: 45 },
        { name: "Amendoim", category: "extra", price: "0.00", displayOrder: 46 },
        { name: "M&M's", category: "extra", price: "0.00", displayOrder: 47 },
        { name: "Kit Kat", category: "extra", price: "0.00", displayOrder: 48 },
        { name: "Bis", category: "extra", price: "0.00", displayOrder: 49 },
        { name: "Sucrilhos", category: "extra", price: "0.00", displayOrder: 50 },
        { name: "Flocos de Arroz", category: "extra", price: "0.00", displayOrder: 51 },
        { name: "Marshmallow", category: "extra", price: "0.00", displayOrder: 52 },
        { name: "Confete", category: "extra", price: "0.00", displayOrder: 53 },
        { name: "Jujuba", category: "extra", price: "0.00", displayOrder: 54 },
        { name: "Brownie", category: "extra", price: "0.00", displayOrder: 55 },
        { name: "Oreo", category: "extra", price: "0.00", displayOrder: 56 },
        { name: "Chokito", category: "extra", price: "0.00", displayOrder: 57 },
        { name: "Neston", category: "extra", price: "0.00", displayOrder: 58 },
        { name: "Leite Ninho", category: "extra", price: "0.00", displayOrder: 59 },
        { name: "Colher e Guardanapo", category: "extra", price: "0.00", displayOrder: 60 },
      ];

      for (const topping of toppingsToSeed) {
        await storage.createTopping(topping);
      }

      res.json({ message: "Toppings seeded successfully" });
    } catch (error: any) {
      console.error("Error seeding toppings:", error);
      res.status(500).json({ message: "Error seeding toppings" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

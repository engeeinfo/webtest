const { serve } = require("@hono/node-server");
const { Hono } = require("hono");
const { cors } = require("hono/cors");
const { logger } = require("hono/logger");
const kv = require("./kv_store.js");

const app = new Hono();

// Enable logger
app.use("*", logger());

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Root route to check if server is running
app.get("/", (c) => {
  return c.text("Restaurant API Server is Running!");
});

// ==================== INITIALIZATION ====================

// Initialize demo data on first run
async function initializeDemoData() {
  try {
    const initialized = await kv.get("system:initialized");

    if (!initialized) {
      console.log("Initializing demo data...");

      // Create demo users
      const users = [
        {
          id: "user-admin-1",
          email: "admin@restaurant.com",
          password: "admin123",
          role: "admin",
          name: "Admin User",
        },
        {
          id: "user-kitchen-1",
          email: "kitchen@restaurant.com",
          password: "kitchen123",
          role: "kitchen",
          name: "Kitchen Staff",
        },
        {
          id: "user-waiter-1",
          email: "waiter@restaurant.com",
          password: "waiter123",
          role: "waiter",
          name: "Waiter",
        },
        {
          id: "user-customer-1",
          email: "customer@restaurant.com",
          password: "customer123",
          role: "customer",
          name: "Valued Customer",
        },
      ];

      for (const user of users) {
        await kv.set(`user:${user.email}`, user);
        console.log(`Created user: ${user.email}`);
      }

      // Create tables (12 tables)
      const tables = [];
      for (let i = 1; i <= 12; i++) {
        const table = {
          id: `table-${i}`,
          number: i,
          status: "empty",
          capacity: i % 3 === 0 ? 6 : i % 2 === 0 ? 4 : 2,
          sessionId: null,
        };
        tables.push(table);
        await kv.set(`table:${table.id}`, table);
      }
      console.log(`Created ${tables.length} tables`);

      // Create menu items
      const menuItems = [
        // Appetizers
        {
          id: "menu-1",
          name: "Caesar Salad",
          category: "Appetizers",
          price: 8.99,
          description: "Fresh romaine lettuce with parmesan and croutons",
          image:
            "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400",
          available: true,
        },
        {
          id: "menu-2",
          name: "Garlic Bread",
          category: "Appetizers",
          price: 5.99,
          description: "Toasted bread with garlic butter",
          image:
            "https://images.unsplash.com/photo-1573140401552-3fab0b24f0e6?w=400",
          available: true,
        },
        {
          id: "menu-3",
          name: "Mozzarella Sticks",
          category: "Appetizers",
          price: 7.99,
          description: "Crispy fried mozzarella with marinara sauce",
          image:
            "https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=400",
          available: true,
        },

        // Main Courses
        {
          id: "menu-4",
          name: "Grilled Salmon",
          category: "Main Courses",
          price: 18.99,
          description: "Fresh Atlantic salmon with vegetables",
          image:
            "https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=400",
          available: true,
        },
        {
          id: "menu-5",
          name: "Beef Steak",
          category: "Main Courses",
          price: 24.99,
          description: "Premium ribeye steak cooked to perfection",
          image:
            "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
          available: true,
        },
        {
          id: "menu-6",
          name: "Chicken Alfredo",
          category: "Main Courses",
          price: 15.99,
          description: "Creamy pasta with grilled chicken",
          image:
            "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400",
          available: true,
        },
        {
          id: "menu-7",
          name: "Margherita Pizza",
          category: "Main Courses",
          price: 12.99,
          description: "Classic pizza with fresh mozzarella and basil",
          image:
            "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400",
          available: true,
        },
        {
          id: "menu-8",
          name: "Veggie Burger",
          category: "Main Courses",
          price: 11.99,
          description: "Plant-based burger with lettuce and tomato",
          image:
            "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400",
          available: true,
        },

        // Desserts
        {
          id: "menu-9",
          name: "Chocolate Cake",
          category: "Desserts",
          price: 6.99,
          description: "Rich chocolate cake with ganache",
          image:
            "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400",
          available: true,
        },
        {
          id: "menu-10",
          name: "Tiramisu",
          category: "Desserts",
          price: 7.99,
          description: "Classic Italian dessert",
          image:
            "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400",
          available: true,
        },
        {
          id: "menu-11",
          name: "Ice Cream",
          category: "Desserts",
          price: 4.99,
          description: "Three scoops of your choice",
          image:
            "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400",
          available: true,
        },

        // Beverages
        {
          id: "menu-12",
          name: "Fresh Orange Juice",
          category: "Beverages",
          price: 3.99,
          description: "Freshly squeezed orange juice",
          image:
            "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400",
          available: true,
        },
        {
          id: "menu-13",
          name: "Coffee",
          category: "Beverages",
          price: 2.99,
          description: "Freshly brewed coffee",
          image:
            "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400",
          available: true,
        },
        {
          id: "menu-14",
          name: "Iced Tea",
          category: "Beverages",
          price: 2.99,
          description: "Refreshing iced tea",
          image:
            "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400",
          available: true,
        },
      ];

      for (const item of menuItems) {
        await kv.set(`menu:${item.id}`, item);
      }
      console.log(`Created ${menuItems.length} menu items`);

      await kv.set("system:initialized", true);
      console.log("Demo data initialized successfully");
    } else {
      console.log("Demo data already initialized");
    }
  } catch (error) {
    console.error("Error initializing demo data:", error);
  }
}

// Initialize on startup
initializeDemoData().catch((err) => console.error("Init error:", err));

// ==================== AUTH ENDPOINTS ====================

// Check initialization status
app.get("/make-server-21f56fa4/init-status", async (c) => {
  try {
    const initialized = await kv.get("system:initialized");
    const users = await kv.getByPrefix("user:");
    return c.json({
      initialized: !!initialized,
      userCount: users.length,
      users: users.map((u) => ({ email: u.email, role: u.role })),
    });
  } catch (error) {
    console.error("Error checking init status:", error);
    return c.json({ initialized: false, error: error.message });
  }
});

// Force re-initialization (for debugging)
app.post("/make-server-21f56fa4/force-init", async (c) => {
  try {
    await kv.del("system:initialized");
    await initializeDemoData();
    return c.json({ success: true, message: "Re-initialized" });
  } catch (error) {
    console.error("Error forcing init:", error);
    return c.text("Error forcing init: " + error.message, 500);
  }
});

app.post("/make-server-21f56fa4/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    console.log(`Login attempt for: ${email}`);

    // Ensure initialization is complete - wait for it
    let initialized = await kv.get("system:initialized");
    if (!initialized) {
      console.log("System not initialized, initializing now...");
      await initializeDemoData();
      // Give it a moment to complete
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    const user = await kv.get(`user:${email}`);

    console.log(
      `User lookup result for ${email}:`,
      user ? "found" : "not found",
    );

    if (!user) {
      console.log(`User not found for email: ${email}`);
      // Try one more time with re-initialization
      console.log("Forcing re-initialization...");
      await kv.del("system:initialized");
      await initializeDemoData();
      await new Promise((resolve) => setTimeout(resolve, 500));

      const userRetry = await kv.get(`user:${email}`);
      if (!userRetry) {
        console.log(`User still not found after retry: ${email}`);
        return c.text("Invalid credentials", 401);
      }

      if (userRetry.password !== password) {
        console.log(`Invalid password for email: ${email}`);
        return c.text("Invalid credentials", 401);
      }

      const { password: _, ...userWithoutPassword } = userRetry;
      console.log(
        `Login successful for: ${email} with role: ${userRetry.role}`,
      );
      return c.json(userWithoutPassword);
    }

    if (user.password !== password) {
      console.log(`Invalid password for email: ${email}`);
      return c.text("Invalid credentials", 401);
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    console.log(`Login successful for: ${email} with role: ${user.role}`);
    return c.json(userWithoutPassword);
  } catch (error) {
    console.error("Login error:", error);
    return c.text("Login error: " + error.message, 500);
  }
});

// ==================== TABLE ENDPOINTS ====================

app.get("/make-server-21f56fa4/tables", async (c) => {
  try {
    const tables = await kv.getByPrefix("table:");
    return c.json(tables.sort((a, b) => a.number - b.number));
  } catch (error) {
    console.error("Error fetching tables:", error);
    return c.text("Error fetching tables: " + error.message, 500);
  }
});

app.post("/make-server-21f56fa4/reserve-table", async (c) => {
  try {
    const { tableId } = await c.req.json();

    const table = await kv.get(`table:${tableId}`);
    if (!table) {
      return c.text("Table not found", 404);
    }

    if (table.status !== "empty") {
      return c.text("Table is not available", 400);
    }

    // Mark table as reserved
    table.status = "reserved";
    await kv.set(`table:${tableId}`, table);

    return c.json({ success: true, table });
  } catch (error) {
    console.error("Error reserving table:", error);
    return c.text("Error reserving table: " + error.message, 500);
  }
});

app.post("/make-server-21f56fa4/unreserve-table", async (c) => {
  try {
    const { tableId } = await c.req.json();

    const table = await kv.get(`table:${tableId}`);
    if (!table) {
      return c.text("Table not found", 404);
    }

    if (table.status !== "reserved") {
      return c.text("Table is not reserved", 400);
    }

    // Mark table as empty
    table.status = "empty";
    await kv.set(`table:${tableId}`, table);

    return c.json({ success: true, table });
  } catch (error) {
    console.error("Error unreserving table:", error);
    return c.text("Error unreserving table: " + error.message, 500);
  }
});

app.post("/make-server-21f56fa4/add-table", async (c) => {
  try {
    const { number, capacity } = await c.req.json();

    if (!number || !capacity) {
      return c.text("Table number and capacity are required", 400);
    }

    // Check if table number already exists
    const existingTables = await kv.getByPrefix("table:");
    const existingTableNumbers = existingTables.map((t) => t.number);

    if (existingTableNumbers.includes(number)) {
      return c.text("Table number already exists", 400);
    }

    const tableId = `table-${number}`;
    const table = {
      id: tableId,
      number: parseInt(number),
      status: "empty",
      capacity: parseInt(capacity),
      sessionId: null,
    };

    await kv.set(`table:${tableId}`, table);

    return c.json({ success: true, table });
  } catch (error) {
    console.error("Error adding table:", error);
    return c.text("Error adding table: " + error.message, 500);
  }
});

app.post("/make-server-21f56fa4/remove-table", async (c) => {
  try {
    const { tableId } = await c.req.json();

    const table = await kv.get(`table:${tableId}`);
    if (!table) {
      return c.text("Table not found", 404);
    }

    // Check if table is currently in use
    if (table.status !== "empty") {
      return c.text(
        "Cannot remove table that is currently in use or reserved",
        400,
      );
    }

    await kv.del(`table:${tableId}`);

    return c.json({ success: true, message: "Table removed successfully" });
  } catch (error) {
    console.error("Error removing table:", error);
    return c.text("Error removing table: " + error.message, 500);
  }
});

app.post("/make-server-21f56fa4/init-session", async (c) => {
  try {
    const { tableId } = await c.req.json();

    const table = await kv.get(`table:${tableId}`);
    if (!table) {
      return c.text("Table not found", 404);
    }

    if (table.status !== "empty" && table.status !== "reserved") {
      return c.text("Table is not available", 400);
    }

    // Create new session
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const session = {
      id: sessionId,
      tableId: tableId,
      tableNumber: table.number,
      items: [],
      totalAmount: 0,
      paymentStatus: "pending",
      createdAt: new Date().toISOString(),
    };

    // Update table
    table.status = "occupied";
    table.sessionId = sessionId;

    await kv.set(`session:${sessionId}`, session);
    await kv.set(`table:${tableId}`, table);

    return c.json({ sessionId, session });
  } catch (error) {
    console.error("Error initializing session:", error);
    return c.text("Error initializing session: " + error.message, 500);
  }
});

app.post("/make-server-21f56fa4/complete-session", async (c) => {
  try {
    const { tableId } = await c.req.json();

    const table = await kv.get(`table:${tableId}`);
    if (!table) {
      return c.text("Table not found", 404);
    }

    if (table.sessionId) {
      const session = await kv.get(`session:${table.sessionId}`);

      // Archive session to history
      if (session) {
        const historyId = `history-${Date.now()}-${table.sessionId}`;
        await kv.set(`history:${historyId}`, {
          ...session,
          completedAt: new Date().toISOString(),
        });

        // Delete active session
        await kv.del(`session:${table.sessionId}`);

        // Delete kitchen order if exists
        await kv.del(`kitchen:${table.sessionId}`);
      }
    }

    // Reset table
    table.status = "empty";
    table.sessionId = null;
    await kv.set(`table:${tableId}`, table);

    return c.json({ success: true });
  } catch (error) {
    console.error("Error completing session:", error);
    return c.text("Error completing session: " + error.message, 500);
  }
});

// ==================== MENU ENDPOINTS ====================

app.get("/make-server-21f56fa4/menu", async (c) => {
  try {
    const menuItems = await kv.getByPrefix("menu:");
    return c.json(menuItems.sort((a, b) => a.name.localeCompare(b.name)));
  } catch (error) {
    console.error("Error fetching menu:", error);
    return c.text("Error fetching menu: " + error.message, 500);
  }
});

app.post("/make-server-21f56fa4/add-menu-item", async (c) => {
  try {
    const { name, category, price, description, image } = await c.req.json();

    const menuId = `menu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const menuItem = {
      id: menuId,
      name,
      category,
      price: parseFloat(price),
      description,
      image,
      available: true,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`menu:${menuId}`, menuItem);
    return c.json(menuItem);
  } catch (error) {
    console.error("Error adding menu item:", error);
    return c.text("Error adding menu item: " + error.message, 500);
  }
});

app.post("/make-server-21f56fa4/update-menu-item", async (c) => {
  try {
    const { id, name, category, price, description, image, available } =
      await c.req.json();

    const menuItem = await kv.get(`menu:${id}`);
    if (!menuItem) {
      return c.text("Menu item not found", 404);
    }

    const updatedItem = {
      ...menuItem,
      name: name !== undefined ? name : menuItem.name,
      category: category !== undefined ? category : menuItem.category,
      price: price !== undefined ? parseFloat(price) : menuItem.price,
      description:
        description !== undefined ? description : menuItem.description,
      image: image !== undefined ? image : menuItem.image,
      available: available !== undefined ? available : menuItem.available,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`menu:${id}`, updatedItem);
    return c.json(updatedItem);
  } catch (error) {
    console.error("Error updating menu item:", error);
    return c.text("Error updating menu item: " + error.message, 500);
  }
});

app.post("/make-server-21f56fa4/delete-menu-item", async (c) => {
  try {
    const { id } = await c.req.json();

    await kv.del(`menu:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return c.text("Error deleting menu item: " + error.message, 500);
  }
});

app.post("/make-server-21f56fa4/toggle-menu-availability", async (c) => {
  try {
    const { id, available } = await c.req.json();

    const menuItem = await kv.get(`menu:${id}`);
    if (!menuItem) {
      return c.text("Menu item not found", 404);
    }

    menuItem.available = available;
    menuItem.updatedAt = new Date().toISOString();

    await kv.set(`menu:${id}`, menuItem);
    return c.json(menuItem);
  } catch (error) {
    console.error("Error toggling menu availability:", error);
    return c.text("Error toggling menu availability: " + error.message, 500);
  }
});

// ==================== ORDER ENDPOINTS ====================

app.post("/make-server-21f56fa4/create-order", async (c) => {
  try {
    const { tableId, items } = await c.req.json();

    const table = await kv.get(`table:${tableId}`);
    if (!table) {
      return c.text("Table not found", 404);
    }

    let session;
    let sessionId;

    // If table has no session (or is empty), create one
    if (!table.sessionId || table.status === "empty") {
      if (table.status !== "empty" && table.status !== "reserved") {
        return c.text("Table is not available for new order", 400);
      }

      // Initialize new session
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      session = {
        id: sessionId,
        tableId: tableId,
        tableNumber: table.number,
        items: [],
        totalAmount: 0,
        paymentStatus: "pending",
        createdAt: new Date().toISOString(),
      };

      // Update table status
      table.status = "occupied";
      table.sessionId = sessionId;
      await kv.set(`table:${tableId}`, table);
    } else {
      // Use existing session
      session = await kv.get(`session:${table.sessionId}`);
      sessionId = table.sessionId;

      if (!session) {
        // Recovery if session is missing but table points to it
        sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        session = {
          id: sessionId,
          tableId: tableId,
          tableNumber: table.number,
          items: [],
          totalAmount: 0,
          paymentStatus: "pending",
          createdAt: new Date().toISOString(),
        };
        table.status = "occupied";
        table.sessionId = sessionId;
        await kv.set(`table:${tableId}`, table);
      }
    }

    // Add items to session with unique IDs and initial status
    const orderItems = items.map((item) => ({
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: "pending",
      sent: false,
    }));

    // If appending to existing session
    if (session.items && session.items.length > 0) {
      // Mark existing items as sent if the session was previously flagged as sent
      if (session.orderSent) {
        session.items = session.items.map((i) => ({ ...i, sent: true }));
      }
      session.items = [...session.items, ...orderItems];
    } else {
      session.items = orderItems;
    }

    // Reset orderSent flag specifically for new items
    session.orderSent = false;

    session.totalAmount = session.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    await kv.set(`session:${session.id}`, session);

    return c.json({ sessionId: session.id, session });
  } catch (error) {
    console.error("Error creating order:", error);
    return c.text("Error creating order: " + error.message, 500);
  }
});

app.get("/make-server-21f56fa4/session/:sessionId", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const session = await kv.get(`session:${sessionId}`);

    if (!session) {
      return c.text("Session not found", 404);
    }

    return c.json(session);
  } catch (error) {
    console.error("Error fetching session:", error);
    return c.text("Error fetching session: " + error.message, 500);
  }
});

app.post("/make-server-21f56fa4/update-order-item", async (c) => {
  try {
    const { sessionId, itemId, quantity } = await c.req.json();

    const session = await kv.get(`session:${sessionId}`);
    if (!session) {
      return c.text("Session not found", 404);
    }

    if (session.paymentStatus === "success") {
      return c.text("Cannot modify paid order", 400);
    }

    // Update item quantity
    session.items = session.items.map((item) =>
      item.id === itemId ? { ...item, quantity } : item,
    );

    // Recalculate total
    session.totalAmount = session.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    await kv.set(`session:${sessionId}`, session);

    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating item:", error);
    return c.text("Error updating item: " + error.message, 500);
  }
});

app.post("/make-server-21f56fa4/remove-order-item", async (c) => {
  try {
    const { sessionId, itemId } = await c.req.json();

    const session = await kv.get(`session:${sessionId}`);
    if (!session) {
      return c.text("Session not found", 404);
    }

    if (session.paymentStatus === "success") {
      return c.text("Cannot modify paid order", 400);
    }

    // Remove item
    session.items = session.items.filter((item) => item.id !== itemId);

    // Recalculate total
    session.totalAmount = session.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    await kv.set(`session:${sessionId}`, session);

    return c.json({ success: true });
  } catch (error) {
    console.error("Error removing item:", error);
    return c.text("Error removing item: " + error.message, 500);
  }
});

app.post("/make-server-21f56fa4/process-payment", async (c) => {
  try {
    const { sessionId, amount, paymentMethod } = await c.req.json();

    const session = await kv.get(`session:${sessionId}`);
    if (!session) {
      return c.text("Session not found", 404);
    }

    // Update session payment status
    session.paymentStatus = "success";
    session.paidAt = new Date().toISOString();
    session.paymentMethod = paymentMethod;

    await kv.set(`session:${sessionId}`, session);

    // Update table status
    const table = await kv.get(`table:${session.tableId}`);
    if (table) {
      table.status = "payment_confirmed";
      await kv.set(`table:${session.tableId}`, table);
    }

    // Create kitchen order only if not already sent
    if (!session.orderSent) {
      const kitchenOrder = {
        id: `kitchen-${sessionId}`,
        sessionId: sessionId,
        tableNumber: session.tableNumber,
        items: session.items,
        createdAt: new Date().toISOString(),
      };

      await kv.set(`kitchen:${sessionId}`, kitchenOrder);

      // Mark as sent
      session.orderSent = true;
      await kv.set(`session:${sessionId}`, session);
    }

    return c.json({ success: true, session });
  } catch (error) {
    console.error("Error processing payment:", error);
    return c.text("Error processing payment: " + error.message, 500);
  }
});

app.post("/make-server-21f56fa4/confirm-order", async (c) => {
  try {
    const { sessionId } = await c.req.json();

    const session = await kv.get(`session:${sessionId}`);
    if (!session) {
      return c.text("Session not found", 404);
    }

    // Update table status to indicate order sent but payment pending
    const table = await kv.get(`table:${session.tableId}`);
    if (table) {
      table.status = "payment_pending";
      // Ensure sessionId is preserved - redundant but safe
      if (!table.sessionId) {
        table.sessionId = sessionId;
      }
      await kv.set(`table:${session.tableId}`, table);
    }

    // Filter for unsent items
    // If 'sent' property is undefined, assume false unless specifically handled elsewhere.
    const unsentItems = session.items.filter((item) => !item.sent);

    // Create kitchen order only if there are unsent items
    if (unsentItems.length > 0) {
      const kitchenOrder = {
        id: `kitchen-${sessionId}-${Date.now()}`, // Unique ID for each batch
        sessionId: sessionId,
        tableNumber: session.tableNumber,
        items: unsentItems,
        createdAt: new Date().toISOString(),
        isUpdate: session.items.length > unsentItems.length, // Flag as update if not first batch
      };

      await kv.set(`kitchen:${sessionId}-${Date.now()}`, kitchenOrder);

      // Mark items as sent
      session.items = session.items.map((item) => ({ ...item, sent: true }));

      // Mark session as having order sent
      session.orderSent = true;
      await kv.set(`session:${sessionId}`, session);
    } else if (!session.orderSent) {
      // Fallback: If no items explicitly 'sent: false' but orderSent is false, send everything (legacy/safety)
      // This handles the case where items might not have the flag yet
      const kitchenOrder = {
        id: `kitchen-${sessionId}-${Date.now()}`,
        sessionId: sessionId,
        tableNumber: session.tableNumber,
        items: session.items,
        createdAt: new Date().toISOString(),
      };
      await kv.set(`kitchen:${sessionId}-${Date.now()}`, kitchenOrder);

      session.items = session.items.map((item) => ({ ...item, sent: true }));
      session.orderSent = true;
      await kv.set(`session:${sessionId}`, session);
    }

    return c.json({ success: true, session });
  } catch (error) {
    console.error("Error confirming order:", error);
    return c.text("Error confirming order: " + error.message, 500);
  }
});

// ==================== KITCHEN ENDPOINTS ====================

app.get("/make-server-21f56fa4/kitchen-orders", async (c) => {
  try {
    const orders = await kv.getByPrefix("kitchen:");
    return c.json(orders);
  } catch (error) {
    console.error("Error fetching kitchen orders:", error);
    return c.text("Error fetching kitchen orders: " + error.message, 500);
  }
});

app.post("/make-server-21f56fa4/update-item-status", async (c) => {
  try {
    const { orderId, itemId, status } = await c.req.json();

    // Try to find the order by full ID first
    let order = await kv.get(`kitchen:${orderId.replace("kitchen-", "")}`);
    let dbKey = `kitchen:${orderId.replace("kitchen-", "")}`;

    // If not found, try finding by suffix if orderId doesn't match keys exactly
    // (backward compatibility or full ID passed)
    if (!order && orderId.startsWith("kitchen-")) {
      // If orderId is "kitchen-session-xyz-123", key is likely "kitchen:session-xyz-123"
      // The REPLACE logic above works for "kitchen-session" -> "session"
      // BUT if the ID is complex, we might need direct access
      const rawKey = orderId.replace("kitchen-", "kitchen:");
      const directOrder = await kv.get(rawKey);
      if (directOrder) {
        order = directOrder;
        dbKey = rawKey;
      }
    }

    if (!order) {
      // Last resort: scan all kitchen orders for the item ID
      const allOrders = await kv.getByPrefix("kitchen:");
      const foundOrder = allOrders.find((o) =>
        o.items.some((i) => i.id === itemId),
      );
      if (foundOrder) {
        order = foundOrder;
        // Reconstruct key from ID or sessionId (assuming timestamp format)
        // The ID in order object is usually "kitchen-{sessionId}-{timestamp}"
        // The key is usually "kitchen:{sessionId}-{timestamp}"
        dbKey = order.id.replace("kitchen-", "kitchen:");
      }
    }

    if (!order) {
      return c.text("Order not found", 404);
    }

    // Update item status in kitchen order
    order.items = order.items.map((item) =>
      item.id === itemId ? { ...item, status } : item,
    );

    await kv.set(dbKey, order);

    // Also update in the session
    const session = await kv.get(`session:${order.sessionId}`);
    if (session) {
      session.items = session.items.map((item) =>
        item.id === itemId ? { ...item, status } : item,
      );
      await kv.set(`session:${order.sessionId}`, session);
    }

    // ALSO: Update ANY other kitchen tickets for this session that contain this item
    // This handles the "duplicate card" issue by keeping them in sync
    const allSessionOrders = await kv.getByPrefix(`kitchen:${order.sessionId}`);
    for (const otherOrder of allSessionOrders) {
      if (otherOrder.id !== order.id) {
        const updatedItems = otherOrder.items.map((item) =>
          item.id === itemId ? { ...item, status } : item,
        );
        if (JSON.stringify(updatedItems) !== JSON.stringify(otherOrder.items)) {
          otherOrder.items = updatedItems;
          await kv.set(
            otherOrder.id.replace("kitchen-", "kitchen:"),
            otherOrder,
          );
        }
      }
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating item status:", error);
    return c.text("Error updating item status: " + error.message, 500);
  }
});

app.post("/make-server-21f56fa4/update-all-items-status", async (c) => {
  try {
    const { orderId, sessionId, status } = await c.req.json();

    let lookupId = sessionId;

    // If we have a sessionId, we should update ALL kitchen tickets for this session
    if (sessionId) {
      // Find all kitchen orders for this session
      // Prefix search for "kitchen:" then filter would be safest, but kv might support "kitchen:{sessionIdPrefix}"?
      // Our KV store `getByPrefix` is simple string matching.
      // Keys are "kitchen:{sessionId}" OR "kitchen:{sessionId}-{timestamp}"
      // querying "kitchen:{sessionId}" should find both!

      const relevantOrders = await kv.getByPrefix(`kitchen:${sessionId}`);

      if (relevantOrders.length === 0) {
        return c.text("Order not found", 404);
      }

      for (const order of relevantOrders) {
        order.items = order.items.map((item) => ({ ...item, status }));
        // Key reconstruction:
        const key = order.id.replace("kitchen-", "kitchen:");
        await kv.set(key, order);
      }

      // Update Session
      const session = await kv.get(`session:${sessionId}`);
      if (session) {
        session.items = session.items.map((item) => ({ ...item, status }));
        await kv.set(`session:${sessionId}`, session);
      }

      return c.json({ success: true });
    }

    // Fallback if only orderId provided (legacy support)
    if (orderId) {
      lookupId = orderId.replace("kitchen-", "");
      // This is risky if ID has timestamps.
      // Better to just fetch the specific key if sessionId is missing.
      const key = orderId.replace("kitchen-", "kitchen:");
      const order = await kv.get(key);

      if (!order) {
        return c.text("Order not found", 404);
      }

      order.items = order.items.map((item) => ({ ...item, status }));
      await kv.set(key, order);

      // Try to update session too
      if (order.sessionId) {
        const session = await kv.get(`session:${order.sessionId}`);
        if (session) {
          session.items = session.items.map((item) => ({ ...item, status }));
          await kv.set(`session:${order.sessionId}`, session);
        }
      }
      return c.json({ success: true });
    }

    return c.text("Either sessionId or orderId is required", 400);
  } catch (error) {
    console.error("Error updating all items status:", error);
    return c.text("Error updating all items status: " + error.message, 500);
  }
});

// ==================== KITCHEN HELPER ENDPOINTS ====================

app.post("/make-server-21f56fa4/delete-kitchen-order", async (c) => {
  try {
    const { sessionId } = await c.req.json();

    // Find all orders for this session
    const orders = await kv.getByPrefix(`kitchen:${sessionId}`);

    for (const order of orders) {
      const key = order.id.replace("kitchen-", "kitchen:");
      await kv.del(key);
    }

    // Fallback
    await kv.del(`kitchen:${sessionId}`);

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting kitchen order:", error);
    return c.text("Error deleting kitchen order: " + error.message, 500);
  }
});

app.post("/make-server-21f56fa4/delete-all-completed-orders", async (c) => {
  try {
    const orders = await kv.getByPrefix("kitchen:");
    for (const order of orders) {
      if (order.items.every((i) => i.status === "ready")) {
        const key = order.id.replace("kitchen-", "kitchen:");
        await kv.del(key);
      }
    }
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting all completed orders:", error);
    return c.text("Error deleting all completed orders: " + error.message, 500);
  }
});

// ==================== HEALTH CHECK ====================

// Health check endpoint
app.get("/make-server-21f56fa4/health", (c) => {
  return c.json({ status: "ok" });
});

const port = 8080;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

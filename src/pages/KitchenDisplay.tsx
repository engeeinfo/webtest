import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  LogOut,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE, publicAnonKey } from "../utils/supabase/info";

interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  status: "pending" | "in-progress" | "ready";
  notes?: string;
  originalOrderId?: string; // Track which order this item belongs to
}

interface KitchenOrder {
  id: string;
  sessionId: string;
  tableNumber: number;
  items: OrderItem[];
  createdAt: string;
}

interface GroupedKitchenOrder extends Omit<KitchenOrder, "items"> {
  items: OrderItem[];
  originalOrderIds: string[];
}

interface MenuItem {
  id: string;
  name: string;
  category: string;
  available: boolean;
}

export function KitchenDisplay() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [rawOrders, setRawOrders] = useState<KitchenOrder[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isUpdatingRef = useRef(false);

  // Derived state: Group orders by sessionId (Table)
  const orders: GroupedKitchenOrder[] = [...rawOrders]
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .reduce((acc, order) => {
      const existingGroup = acc.find((g) => g.sessionId === order.sessionId);
      if (existingGroup) {
        // Merge items, assume item IDs are unique across the session's orders
        // or at least distinct enough to merge
        const newItems = order.items.map((item) => ({
          ...item,
          originalOrderId: order.id,
        }));

        // Filter out duplicates if any (defensive)
        const existingItemIds = new Set(existingGroup.items.map((i) => i.id));
        newItems.forEach((item) => {
          if (!existingItemIds.has(item.id)) {
            existingGroup.items.push(item);
          }
        });

        if (!existingGroup.originalOrderIds.includes(order.id)) {
          existingGroup.originalOrderIds.push(order.id);
        }

        // Keep earliest creation time
        if (new Date(order.createdAt) < new Date(existingGroup.createdAt)) {
          existingGroup.createdAt = order.createdAt;
        }
      } else {
        acc.push({
          ...order,
          items: order.items.map((item) => ({
            ...item,
            originalOrderId: order.id,
          })),
          originalOrderIds: [order.id],
        });
      }
      return acc;
    }, [] as GroupedKitchenOrder[]);

  const fetchOrders = async () => {
    // Skip fetching if an update is in progress to prevent overwriting optimistic UI
    if (isUpdatingRef.current) return;

    try {
      const response = await fetch(`${API_BASE}/kitchen-orders`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Check again before setting state
        if (!isUpdatingRef.current) {
          setRawOrders(data);
        }
      }
    } catch (error) {
      console.error("Error fetching kitchen orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(`${API_BASE}/menu-items`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMenuItems(data);
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchMenuItems();

    // Poll for updates every 1.5 seconds for real-time updates
    const interval = setInterval(() => {
      if (!isUpdatingRef.current) {
        fetchOrders();
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleUpdateItemStatus = async (
    orderId: string, // This is the ID of the specific sub-order or the group leader
    itemId: string,
    newStatus: string,
  ) => {
    isUpdatingRef.current = true;

    // Optimistic update
    setRawOrders((prevOrders) =>
      prevOrders.map((order) => {
        // Find the order that contains this item
        const hasItem = order.items.some((i) => i.id === itemId);
        if (hasItem) {
          return {
            ...order,
            items: order.items.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    status: newStatus as "pending" | "in-progress" | "ready",
                  }
                : item,
            ),
          };
        }
        return order;
      }),
    );

    try {
      const response = await fetch(`${API_BASE}/update-item-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ orderId, itemId, status: newStatus }),
      });

      if (response.ok) {
        await fetchOrders();
      }
    } catch (error) {
      console.error("Error updating item status:", error);
      fetchOrders();
    } finally {
      isUpdatingRef.current = false;
    }
  };

  const handleUpdateAllItemsStatus = async (
    orderId: string,
    sessionId: string,
    newStatus: string,
  ) => {
    isUpdatingRef.current = true;

    // Optimistic update
    setRawOrders((prevOrders) =>
      prevOrders.map((order) => {
        // Update if it matches the session
        if (order.sessionId === sessionId) {
          return {
            ...order,
            items: order.items.map((item) => ({
              ...item,
              status: newStatus as "pending" | "in-progress" | "ready",
            })),
          };
        }
        return order;
      }),
    );

    try {
      const response = await fetch(`${API_BASE}/update-all-items-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ orderId, sessionId, status: newStatus }),
      });

      if (response.ok) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        isUpdatingRef.current = false;
        await fetchOrders();
      }
    } catch (error) {
      console.error("Error updating all items status:", error);
      isUpdatingRef.current = false;
      fetchOrders();
    } finally {
      if (isUpdatingRef.current) isUpdatingRef.current = false;
    }
  };

  const handleDeleteOrder = async (orderId: string, sessionId: string) => {
    if (
      !window.confirm("Are you sure you want to delete this completed order?")
    )
      return;

    isUpdatingRef.current = true;

    // Optimistic update: remove all orders for this session
    setRawOrders((prevOrders) =>
      prevOrders.filter((o) => o.sessionId !== sessionId),
    );

    try {
      const response = await fetch(`${API_BASE}/delete-kitchen-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ sessionId }), // Pass sessionId to delete all related tickets
      });

      if (response.ok) {
        await fetchOrders();
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      fetchOrders();
    } finally {
      isUpdatingRef.current = false;
    }
  };

  const handleDeleteAllCompleted = async () => {
    if (
      !window.confirm("Are you sure you want to delete ALL completed orders?")
    )
      return;

    isUpdatingRef.current = true;

    setRawOrders((prevOrders) =>
      prevOrders.filter((o) => !o.items.every((i) => i.status === "ready")),
    );

    try {
      const response = await fetch(`${API_BASE}/delete-all-completed-orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        await fetchOrders();
      }
    } catch (error) {
      console.error("Error deleting all completed orders:", error);
      fetchOrders();
    } finally {
      isUpdatingRef.current = false;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Circle className="w-5 h-5 text-gray-400" />;
      case "in-progress":
        return <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />;
      case "ready":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-700 border-gray-300";
      case "in-progress":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "ready":
        return "bg-green-100 text-green-700 border-green-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const pendingOrders = orders.filter(
    (order) => !order.items.every((item) => item.status === "ready"),
  );
  const completedOrders = orders.filter((order) =>
    order.items.every((item) => item.status === "ready"),
  );

  const renderOrderCard = (order: GroupedKitchenOrder, index: number) => (
    <div
      key={order.sessionId} // Key by sessionId
      className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden relative"
    >
      {/* Priority Badge */}
      <div className="absolute top-0 center-1/2 -translate-x-1/2 bg-yellow-500 text-yellow-900 font-bold px-4 py-1 rounded-b-lg z-10 shadow-md">
        #{index + 1}
      </div>

      {/* Card Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">
              Table {order.tableNumber}
            </h3>
            <p className="text-sm text-purple-100">
              {new Date(order.createdAt).toLocaleTimeString()}
            </p>
          </div>

          <div className="text-center mr-5">
            <div className="text-xs text-purple-100 font-semibold uppercase">
              Items
            </div>
            <div className="text-2xl font-bold text-white leading-none">
              {order.items.length}
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="p-4 space-y-3">
        {order.items.map((item) => (
          <div
            key={item.id}
            className={`border-2 rounded-lg p-3 ${getStatusColor(item.status)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="font-semibold text-sm">{item.name}</div>
                <div className="text-xs opacity-75">
                  Quantity: {item.quantity}
                </div>
                {item.notes && (
                  <div className="text-xs mt-1 italic">Note: {item.notes}</div>
                )}
              </div>
              <div>{getStatusIcon(item.status)}</div>
            </div>

            {/* Status Buttons */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <button
                onClick={() =>
                  handleUpdateItemStatus(
                    item.originalOrderId || order.id,
                    item.id,
                    "pending",
                  )
                }
                disabled={item.status === "pending"}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  item.status === "pending"
                    ? "bg-gray-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Pending
              </button>

              <button
                onClick={() =>
                  handleUpdateItemStatus(
                    item.originalOrderId || order.id,
                    item.id,
                    "in-progress",
                  )
                }
                disabled={item.status === "in-progress"}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  item.status === "in-progress"
                    ? "bg-yellow-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-yellow-600"
                }`}
              >
                Cooking
              </button>

              <button
                onClick={() =>
                  handleUpdateItemStatus(
                    item.originalOrderId || order.id,
                    item.id,
                    "ready",
                  )
                }
                disabled={item.status === "ready"}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  item.status === "ready"
                    ? "bg-green-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-green-600"
                }`}
              >
                Ready
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Card Footer */}
      <div className="bg-gray-700 px-4 py-3">
        {order.items.every((i) => i.status === "ready") ? (
          <button
            onClick={() => handleDeleteOrder(order.id, order.sessionId)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 font-bold rounded shadow-md transition-all text-sm bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border border-red-500"
          >
            <Trash2 className="w-4 h-4" />
            Delete Order
          </button>
        ) : (
          <button
            onClick={() =>
              handleUpdateAllItemsStatus(order.id, order.sessionId, "ready")
            }
            className="w-full px-4 py-2 font-bold rounded shadow-md transition-all text-sm bg-green-600 text-white hover:bg-green-700"
          >
            Ready All Items
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-xl text-white">Loading kitchen display...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4">
                {user?.role === "admin" && (
                  <button
                    onClick={() => navigate("/admin")}
                    className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    title="Back to Dashboard"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <h1 className="text-2xl font-bold text-white">
                  Kitchen Display System
                </h1>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Active Orders: {orders.length}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>

              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Orders Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Orders Column */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-700">
              <Clock className="w-6 h-6 text-yellow-500" />
              Pending Orders ({pendingOrders.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pendingOrders.length === 0 ? (
                <div className="col-span-full text-center">
                  <p className="text-gray-500 italic">No pending orders</p>
                </div>
              ) : (
                pendingOrders.map((order, index) =>
                  renderOrderCard(order, index),
                )
              )}
            </div>
          </div>

          {/* Completed Orders Column */}
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                Completed Orders ({completedOrders.length})
              </h2>
              {completedOrders.length > 0 && (
                <button
                  onClick={handleDeleteAllCompleted}
                  className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete All
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {completedOrders.length === 0 ? (
                <div className="col-span-full text-center">
                  <p className="text-gray-500 italic">No completed orders</p>
                </div>
              ) : (
                completedOrders.map((order, index) =>
                  renderOrderCard(order, index),
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

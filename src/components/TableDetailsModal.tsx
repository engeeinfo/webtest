import { Minus, Plus, Printer, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { API_BASE, publicAnonKey } from "../utils/supabase/info";

interface TableDetailsModalProps {
  table: {
    id: string;
    number: number;
    capacity: number;
    sessionId?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export function TableDetailsModal({
  table,
  isOpen,
  onClose,
  isAdmin = false,
}: TableDetailsModalProps) {
  const [session, setSession] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [showAddItems, setShowAddItems] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && table) {
      fetchSessionDetails();
      fetchMenuItems();
    }
  }, [isOpen, table]);

  const fetchSessionDetails = async () => {
    if (!table || !table.sessionId) return;
    try {
      const sessionRes = await fetch(`${API_BASE}/session/${table.sessionId}`, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        setSession(sessionData);
      }
    } catch (error) {
      console.error("Error fetching session details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const menuRes = await fetch(`${API_BASE}/menu`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });
      if (menuRes.ok) {
        const menuData = await menuRes.json();
        setMenuItems(menuData);
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const res = await fetch(`${API_BASE}/update-order-item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          sessionId: session.id,
          itemId,
          quantity: newQuantity,
        }),
      });

      if (res.ok) {
        fetchSessionDetails();
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const res = await fetch(`${API_BASE}/remove-order-item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          sessionId: session.id,
          itemId,
        }),
      });

      if (res.ok) {
        fetchSessionDetails();
      }
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const handleAddItemToOrder = async (menuItem: any) => {
    if (!table) return;
    try {
      // Get current session items
      const currentItems = session?.items || [];

      // Add new item to the list
      const newItems = [
        ...currentItems,
        {
          menuId: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
          image: menuItem.image,
        },
      ];

      const res = await fetch(`${API_BASE}/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          tableId: table.id,
          items: newItems,
        }),
      });

      if (res.ok) {
        fetchSessionDetails();
      }
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const updateItemStatus = async (
    orderId: string,
    itemId: string,
    status: "pending" | "preparing" | "ready",
  ) => {
    try {
      const res = await fetch(`${API_BASE}/update-item-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          orderId,
          itemId,
          status,
        }),
      });

      if (res.ok) {
        fetchSessionDetails();
      }
    } catch (error) {
      console.error("Error updating item status:", error);
    }
  };

  const markAsServed = async (sessionId: string) => {
    try {
      const res = await fetch(`${API_BASE}/mark-served`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          sessionId,
        }),
      });

      if (res.ok) {
        fetchSessionDetails();
      }
    } catch (error) {
      console.error("Error marking as served:", error);
    }
  };

  const completeKitchenOrder = async (sessionId: string) => {
    try {
      const res = await fetch(`${API_BASE}/complete-kitchen-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          sessionId,
        }),
      });

      if (res.ok) {
        fetchSessionDetails();
      }
    } catch (error) {
      console.error("Error completing kitchen order:", error);
    }
  };

  const categories = [
    "All",
    ...new Set(menuItems.map((item) => item.category)),
  ];
  const filteredMenuItems =
    selectedCategory === "All"
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  const canModifyOrder = session?.paymentStatus !== "success";

  if (!isOpen || !table) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Table {table?.number}</h2>
            <p className="text-gray-600">Capacity: {table?.capacity} people</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : !session ? (
            <div className="text-center py-8 text-gray-500">
              No active session for this table
            </div>
          ) : (
            <div className="space-y-6">
              {/* Session Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Session Status</h3>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Payment Status</p>
                    <p
                      className={`font-semibold ${
                        session.paymentStatus === "success"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {session.paymentStatus === "success" ? "PAID" : "PENDING"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Ordered Items</h3>
                  {isAdmin && canModifyOrder && (
                    <button
                      onClick={() => setShowAddItems(!showAddItems)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <Printer className="w-4 h-4" />
                      Add Items
                    </button>
                  )}
                </div>

                {session.items?.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No items ordered yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {session.items?.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.name}</h4>
                          <p className="text-gray-600">
                            ₹{item.price.toFixed(2)}
                          </p>
                          {item.status && (
                            <p className="text-xs text-gray-500 mt-1">
                              Status: {item.status}
                            </p>
                          )}
                        </div>

                        {canModifyOrder && !isAdmin ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleUpdateQuantity(item.id, item.quantity - 1)
                              }
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleUpdateQuantity(item.id, item.quantity + 1)
                              }
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1 ml-2 hover:bg-red-100 text-red-600 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-right">
                            <p className="font-semibold">
                              Qty: {item.quantity}
                            </p>
                            <p className="text-sm text-gray-600">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Total */}
                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total Amount:</span>
                    <span className="text-green-600">
                      ₹{session.totalAmount?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Add Items Section (Admin only) */}
              {isAdmin && showAddItems && canModifyOrder && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-lg mb-4">
                    Add Items to Order
                  </h3>

                  {/* Category Filter */}
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                          selectedCategory === cat
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Menu Items */}
                  <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                    {filteredMenuItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{item.name}</h4>
                          <p className="text-gray-600 text-sm">
                            ₹{item.price.toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAddItemToOrder(item)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

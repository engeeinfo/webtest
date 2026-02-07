import {
  ArrowLeft,
  CheckCircle,
  Clock,
  CreditCard,
  Minus,
  Plus,
  QrCode,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
=======
import { CopyrightFooter } from "../components/CopyrightFooter";
>>>>>>> ff40e0f079c428a1ab1e18f6e586876db6206689
import { useAuth } from "../contexts/AuthContext";
import { API_BASE, publicAnonKey } from "../utils/supabase/info";

interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  status: string;
  notes?: string;
}

interface Session {
  id: string;
  tableId: string;
  tableNumber: number;
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
  orderSent?: boolean;
}

export function OrderReview() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  const fetchSession = async () => {
    try {
      const response = await fetch(`${API_BASE}/session/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSession(data);
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();

    // Poll for updates
    const interval = setInterval(fetchSession, 2000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (session?.paymentStatus === "success") {
      toast.error("Cannot modify order after payment");
      return;
    }

    if (newQuantity < 1) return;

    try {
      const response = await fetch(`${API_BASE}/update-order-item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ sessionId, itemId, quantity: newQuantity }),
      });

      if (response.ok) {
        fetchSession();
      }
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (session?.paymentStatus === "success") {
      toast.error("Cannot modify order after payment");
      return;
    }

    if (!window.confirm("Are you sure you want to remove this item?")) return;

    try {
      const response = await fetch(`${API_BASE}/remove-order-item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ sessionId, itemId }),
      });

      if (response.ok) {
        fetchSession();
        toast.success("Item removed from order");
      }
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Error removing item");
    }
  };

  const handlePayLater = async () => {
    if (!session) return;

    if (
      !window.confirm("Confirm send order to kitchen with 'Pay Later' status?")
    )
      return;

    try {
      const response = await fetch(`${API_BASE}/confirm-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          sessionId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to confirm order: ${response.status} ${errorText}`,
        );
      }

      toast.success("Order sent to kitchen! Payment pending.");
      if (user?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/customer");
      }
    } catch (error: any) {
      console.error("Order confirmation error:", error);
      toast.error(error.message || "Failed to confirm order");
    }
  };

  const handleCashPayment = async () => {
    if (!session) return;

    if (
      window.confirm(
        `Confirm cash payment of ₹${session.totalAmount.toFixed(2)}?`,
      )
    ) {
      await processPayment("cash");
    }
  };

  const handlePayment = async () => {
    if (!session) return;

    if (
      user?.role === "waiter" ||
      user?.role === "admin" ||
      user?.email === "waiter@restaurant.com"
    ) {
      setShowQRCode(true);
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to pay ₹${session.totalAmount.toFixed(2)}?`,
      )
    ) {
      await processPayment();
    }
  };

  const processPayment = async (method: string = "card") => {
    if (!session) return;

    setProcessing(true);
    const toastId = toast.loading("Processing payment...");

    try {
      const response = await fetch(`${API_BASE}/process-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          sessionId,
          amount: session.totalAmount,
          paymentMethod: method,
        }),
      });

      if (!response.ok) {
        throw new Error("Payment failed. Please try again.");
      }

      await fetchSession();
      toast.success("Payment successful! Order sent to kitchen.", {
        id: toastId,
      });

      // If needed, we can ask to complete session right here - but let's assume manual complete or button click
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment failed", { id: toastId });
    } finally {
      setProcessing(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!session) return;

    if (
      !window.confirm(
        "Are you sure you want to complete this session and clear the table?",
      )
    )
      return;

    try {
      const response = await fetch(`${API_BASE}/complete-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          tableId: session.tableId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete session");
      }

      toast.success("Session completed and table cleared");
      if (user?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/customer");
      }
    } catch (error: any) {
      console.error("Error completing session:", error);
      toast.error(error.message || "Failed to complete session");
    }
  };

  const getItemStatusBadge = (status: string) => {
    const badges: Record<string, React.ReactNode> = {
      pending: (
        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
          Pending
        </span>
      ),
      "in-progress": (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
          Cooking
        </span>
      ),
      ready: (
        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
          Ready
        </span>
      ),
    };
    return badges[status] || null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading order...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Order not found</p>
          <button
            onClick={() => navigate("/customer")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Tables
          </button>
        </div>
      </div>
    );
  }

  const isPaid = session.paymentStatus === "success";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (user?.role === "admin") {
                    navigate("/admin");
                  } else {
                    navigate("/customer");
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Table {session.tableNumber}
                </h1>
                <p className="text-sm text-gray-600">
                  {isPaid
                    ? "Order placed - Check status below"
                    : session.orderSent
                      ? "Order sent to kitchen • Payment Pending"
                      : "Review your order"}
                </p>
              </div>
            </div>

            {session.orderSent && !isPaid && (
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg w-full sm:w-auto justify-center sm:justify-start">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">Payment Pending</span>
              </div>
            )}

            {isPaid && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg w-full sm:w-auto justify-center sm:justify-start">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Paid</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Order Items */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {session.items.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No items in order</p>
                <button
                  onClick={() => navigate(`/menu/${session.tableId}`)}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Items
                </button>
              </div>
            ) : (
              session.items.map((item) => (
                <div key={item.id} className="p-6">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex-1 w-full sm:w-auto">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.name}
                        </h3>
                        {isPaid && getItemStatusBadge(item.status)}
                      </div>

                      <p className="text-sm text-gray-600">
                        ₹{item.price.toFixed(2)} each
                      </p>

                      {item.notes && (
                        <p className="text-sm text-gray-500 italic mt-1">
                          Note: {item.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                      {!isPaid && (
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity - 1)
                            }
                            className="p-1 hover:bg-white rounded transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>

                          <span className="px-3 font-semibold">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity + 1)
                            }
                            className="p-1 hover:bg-white rounded transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {isPaid && (
                        <span className="px-3 font-semibold text-gray-700">
                          Qty: {item.quantity}
                        </span>
                      )}

                      <div className="w-24 text-right">
                        <span className="text-lg font-semibold text-gray-900">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>

                      {!isPaid && (
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Total */}
          {session.items.length > 0 && (
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
                <span className="text-lg font-semibold text-gray-900">
                  Total Amount
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  ₹{session.totalAmount.toFixed(2)}
                </span>
              </div>

              {!isPaid && (
                <div className="space-y-3">
                  <button
                    onClick={() => navigate(`/menu/${session.tableId}`)}
                    className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Add More Items
                  </button>

                  {user?.role === "waiter" ||
                  user?.role === "admin" ||
                  user?.email === "waiter@restaurant.com" ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row gap-3">
                        {!session.orderSent && (
                          <button
                            onClick={handlePayLater}
                            className="flex-1 px-4 py-3 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors font-semibold shadow-sm text-sm"
                          >
                            Pay Later
                          </button>
                        )}
                        <button
                          onClick={handleCashPayment}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm text-sm font-semibold"
                        >
                          <CreditCard className="w-4 h-4" />
                          Cash Pay
                        </button>
                        <button
                          onClick={handlePayment}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm text-sm font-semibold"
                        >
                          <QrCode className="w-4 h-4" />
                          Online
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handlePayment}
                      disabled={processing}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <CreditCard className="w-5 h-5" />
                      {processing
                        ? "Processing..."
                        : `Pay ₹${session.totalAmount.toFixed(2)}`}
                    </button>
                  )}
                </div>
              )}

              {isPaid && (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 font-semibold">
                      Payment confirmed!
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      Order is being prepared.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (user?.role === "admin") navigate("/admin");
                      else navigate("/customer");
                    }}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Return to {user?.role === "admin" ? "Dashboard" : "Home"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Session Info removed */}
      </div>

      {/* Waiter QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowQRCode(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>

            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Scan to Pay
              </h3>
              <p className="text-gray-600 mb-6">
                Total Amount: ₹{session?.totalAmount.toFixed(2)}
              </p>

              <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-300 inline-block mb-6">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=restaurant@upi&pn=Restaurant&am=${session?.totalAmount}&cu=INR`}
                  alt="Payment QR Code"
                  className="w-48 h-48"
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Ask customer to scan to pay using any UPI app
                </p>
                <button
                  onClick={() => {
                    processPayment();
                    setShowQRCode(false);
                  }}
                  disabled={processing}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm"
                >
                  {processing
                    ? "Confirming Payment..."
                    : "Confirm Payment Received"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
<<<<<<< HEAD
    </div>
  );
}

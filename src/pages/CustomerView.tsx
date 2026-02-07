import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CopyrightFooter } from "../components/CopyrightFooter";
import { TableDetailsModal } from "../components/TableDetailsModal";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE, publicAnonKey } from "../utils/supabase/info";

interface Table {
  id: string;
  number: number;
  status:
    | "empty"
    | "occupied"
    | "payment_confirmed"
    | "reserved"
    | "payment_pending";
  sessionId?: string;
  capacity: number;
}

export function CustomerView() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTables = async () => {
    try {
      const response = await fetch(`${API_BASE}/tables`, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTables(data);
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();

    const interval = setInterval(fetchTables, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleTableClick = async (table: Table) => {
    const isStaff =
      user?.role === "waiter" ||
      user?.role === "admin" ||
      user?.email === "waiter@restaurant.com";

    if (table.status !== "empty" && !isStaff && table.sessionId) {
      // If customer tries to access occupied table, prevent it
      // In a real app, we might check if this is the customer's own session
      alert("Only staff can access occupied tables");
      return;
    }

    if (table.status === "empty") {
      // Just navigate to menu, session will be created when order is placed
      navigate(`/menu/${table.id}`);
    } else if (table.sessionId) {
      // View existing order
      navigate(`/order/${table.sessionId}`);
    } else if (table.status === "reserved") {
      // Show table details
      setSelectedTable(table);
      setIsModalOpen(true);
    }
  };

  const getStatusColor = (status: string) => {
    // For guests, show payment_confirmed as occupied (red)
    if (status === "payment_confirmed" && user?.email === "guest@example.com") {
      return "border-red-500 bg-red-50";
    }

    switch (status) {
      case "empty":
        return "border-green-500 bg-green-50";
      case "occupied":
        return "border-red-500 bg-red-50";
      case "payment_confirmed":
        return "border-yellow-500 bg-yellow-50";
      case "payment_pending":
      case "payment-pending":
        return "border-orange-500 bg-orange-100";
      case "reserved":
        return "border-blue-500 bg-blue-50";
      default:
        return "border-gray-300 bg-gray-50";
    }
  };

  const getStatusTextColor = (status: string) => {
    if (status === "payment_confirmed" && user?.email === "guest@example.com") {
      return "text-red-800";
    }
    switch (status) {
      case "empty":
        return "text-green-800";
      case "occupied":
        return "text-red-800";
      case "payment_confirmed":
        return "text-yellow-800";
      case "payment_pending":
      case "payment-pending":
        return "text-orange-800";
      case "reserved":
        return "text-blue-800";
      default:
        return "text-gray-800";
    }
  };

  const getStatusBadge = (status: string) => {
    // For guests, show payment_confirmed as occupied badge
    if (status === "payment_confirmed" && user?.email === "guest@example.com") {
      return (
        <span className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-full shadow-sm">
          Occupied
        </span>
      );
    }

    switch (status) {
      case "empty":
        return (
          <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full shadow-sm ring-1 ring-green-600/20">
            Available
          </span>
        );
      case "occupied":
        return (
          <span className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-full shadow-sm ring-1 ring-red-600/20">
            Occupied
          </span>
        );
      case "payment_confirmed":
        return (
          <span className="px-3 py-1.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full shadow-sm ring-1 ring-yellow-600/20">
            Payment Done
          </span>
        );
      case "payment_pending":
      case "payment-pending":
        return (
          <span className="px-3 py-1.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full shadow-sm ring-1 ring-orange-600/20">
            Payment Pending
          </span>
        );
      case "reserved":
        return (
          <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full shadow-sm ring-1 ring-blue-600/20">
            Reserved
          </span>
        );
      default:
        return null; // Might be "gray" table here if status is weird
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">
                Select a Table
              </h1>
              <p className="text-sm text-gray-600">
                Welcome, {user?.name || "Guest"}
              </p>
            </div>

            {user?.email !== "guest@example.com" && (
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Tables Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tables.map((table) => (
            <button
              key={table.id}
              onClick={() => handleTableClick(table)}
              className={`relative border-4 rounded-2xl p-6 hover:shadow-xl transition-all transform hover:scale-105 ${getStatusColor(table.status)}`}
            >
              <div className="absolute top-3 right-3">
                {getStatusBadge(table.status)}
              </div>

              <div className="text-center mt-4">
                <div
                  className={`text-4xl font-bold mb-2 ${getStatusTextColor(table.status)}`}
                >
                  {table.number}
                </div>
                <div className="text-sm font-medium text-gray-500 flex items-center justify-center gap-1">
                  <span className="text-lg">🪑</span>
                  {table.capacity} seats
                </div>
              </div>

              {user?.role === "admin" && table.sessionId && (
                <div className="absolute bottom-2 left-0 right-0 text-center">
                  <span className="text-[10px] bg-white/50 px-2 py-1 rounded-full text-gray-600">
                    ID: {table.sessionId.slice(0, 4)}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table Details Modal */}
      <TableDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        table={selectedTable}
      />
      <CopyrightFooter />
    </div>
  );
}

import { ChefHat, LogOut, Plus, RefreshCw, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
<<<<<<< HEAD
=======
import { CopyrightFooter } from "../components/CopyrightFooter";
>>>>>>> ff40e0f079c428a1ab1e18f6e586876db6206689
import { MenuManagement } from "../components/MenuManagement";
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

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "floor" | "menu" | "orders" | "tables"
  >("floor");
  const [showAddTableForm, setShowAddTableForm] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState("");
  const [addingTable, setAddingTable] = useState(false);

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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTables();

    // Poll for updates every 2 seconds
    const interval = setInterval(fetchTables, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTables();
  };

  const handleCompleteSession = async (tableId: string) => {
    try {
      const response = await fetch(`${API_BASE}/complete-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ tableId }),
      });

      if (response.ok) {
        fetchTables();
      } else {
        alert("Failed to complete session");
      }
    } catch (error) {
      console.error("Error completing session:", error);
      alert("Error completing session");
    }
  };

  const handleInitTable = async (tableId: string) => {
    try {
      const response = await fetch(`${API_BASE}/init-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ tableId }),
      });

      if (response.ok) {
        const data = await response.json();
        navigate(`/menu/${tableId}`);
      } else {
        alert("Failed to initialize table session");
      }
    } catch (error) {
      console.error("Error initializing session:", error);
    }
  };

  const handleViewOrder = (tableId: string, sessionId: string) => {
    navigate(`/order/${sessionId}`);
  };

  const handleReserveTable = async (tableId: string) => {
    try {
      const response = await fetch(`${API_BASE}/reserve-table`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ tableId }),
      });

      if (response.ok) {
        fetchTables();
      } else {
        alert("Failed to reserve table");
      }
    } catch (error) {
      console.error("Error reserving table:", error);
      alert("Error reserving table");
    }
  };

  const handleUnreserveTable = async (tableId: string) => {
    try {
      const response = await fetch(`${API_BASE}/unreserve-table`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ tableId }),
      });

      if (response.ok) {
        fetchTables();
        toast.success("Table status updated");
      } else {
        // If unreserve fails (e.g. table not reserved), try complete-session to clean up bad state
        console.log("Unreserve failed, trying complete-session fallback...");
        const completeResponse = await fetch(`${API_BASE}/complete-session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ tableId }),
        });

        if (completeResponse.ok) {
          fetchTables();
          toast.success("Table status reset (fallback)");
        } else {
          // Last resort: Just force remove and add? No, simpler to just alert.
          alert("Failed to reset table status. Check server logs.");
        }
      }
    } catch (error) {
      console.error("Error unreserving table:", error);
      alert("Error unreserving table");
    }
  };

  const handleTableClick = (table: Table) => {
    if (table.sessionId) {
      setSelectedTable(table);
      setIsModalOpen(true);
    }
    // Handle reserved table click - enable ordering
    else if (table.status === "reserved") {
      if (confirm(`Start session for reserved Table ${table.number}?`)) {
        handleInitTable(table.id);
      }
    }
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingTable(true);
    try {
      const response = await fetch(`${API_BASE}/add-table`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          number: parseInt(newTableNumber),
          capacity: parseInt(newTableCapacity),
        }),
      });

      if (response.ok) {
        setNewTableNumber("");
        setNewTableCapacity("");
        setShowAddTableForm(false);
        fetchTables();
        alert("Table added successfully!");
      } else {
        const errorText = await response.text();
        alert(`Failed to add table: ${errorText}`);
      }
    } catch (error) {
      console.error("Error adding table:", error);
      alert("Error adding table");
    } finally {
      setAddingTable(false);
    }
  };

  const handleRemoveTable = async (tableId: string) => {
    if (!confirm("Are you sure you want to remove this table?")) return;

    try {
      const response = await fetch(`${API_BASE}/remove-table`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ tableId }),
      });

      if (response.ok) {
        fetchTables();
        alert("Table removed successfully!");
      } else {
        const errorText = await response.text();
        alert(`Failed to remove table: ${errorText}`);
      }
    } catch (error) {
      console.error("Error removing table:", error);
      alert("Error removing table");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "empty":
        return "bg-green-500";
      case "occupied":
        return "bg-red-500";
      case "payment_confirmed":
        return "bg-yellow-500";
      case "payment_pending":
      case "payment-pending":
        return "bg-orange-500";
      case "reserved":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "empty":
        return "Available";
      case "occupied":
        return "Occupied";
      case "payment_confirmed":
        return "Payment Done";
      case "payment_pending":
      case "payment-pending":
        return "Payment Pending";
      case "reserved":
        return "Reserved";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-auto text-center md:text-left">
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Welcome, {user?.name || user?.email}
              </p>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>

              <button
                onClick={() => navigate("/kitchen")}
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <ChefHat className="w-4 h-4" />
                Kitchen View
              </button>

              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <div className="w-6 h-6 bg-green-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tables.filter((t: Table) => t.status === "empty").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <div className="w-6 h-6 bg-red-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Occupied</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tables.filter((t: Table) => t.status === "occupied").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <div className="w-6 h-6 bg-yellow-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Done</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    tables.filter(
                      (t: Table) => t.status === "payment_confirmed",
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Tables</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tables.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
            <div className="flex flex-wrap items-center justify-center gap-4 w-full md:w-auto">
              <button
                onClick={() => setActiveTab("floor")}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === "floor"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Floor Plan
              </button>

              <button
                onClick={() => setActiveTab("menu")}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === "menu"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Menu Management
              </button>

              <button
                onClick={() => setActiveTab("orders")}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === "orders"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Orders
              </button>

              <button
                onClick={() => setActiveTab("tables")}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === "tables"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Manage Tables
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/kitchen")}
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <ChefHat className="w-4 h-4" />
                Kitchen View
              </button>

              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          {/* Floor Plan */}
          {activeTab === "floor" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {tables.map((table: Table) => (
                <div
                  key={table.id}
                  className="relative border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all"
                  onClick={() => handleTableClick(table)}
                >
                  <div
                    className={`absolute top-2 right-2 w-3 h-3 ${getStatusColor(table.status)} rounded-full`}
                  ></div>

                  <div className="text-center mb-3">
                    <div className="text-3xl font-bold text-gray-900">
                      T{table.number}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Capacity: {table.capacity}
                    </div>
                  </div>

                  <div
                    className={`text-xs font-bold text-center py-1.5 px-3 rounded-full shadow-sm ${
                      table.status === "empty"
                        ? "bg-green-100 text-green-700 ring-1 ring-green-600/20"
                        : table.status === "occupied"
                          ? "bg-red-100 text-red-700 ring-1 ring-red-600/20"
                          : ["payment_pending", "payment-pending"].includes(
                                table.status,
                              )
                            ? "bg-orange-100 text-orange-700 ring-1 ring-orange-600/20"
                            : "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-600/20"
                    }`}
                  >
                    {getStatusText(table.status)}
                  </div>

                  <div className="mt-3 space-y-2">
                    {table.status === "empty" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInitTable(table.id);
                        }}
                        className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 text-white text-xs rounded-xl hover:bg-blue-600 transition-colors shadow-sm"
                      >
                        <Plus className="w-3 h-3" />
                        Start Session
                      </button>
                    )}

                    {(table.status === "occupied" ||
                      ["payment_pending", "payment-pending"].includes(
                        table.status,
                      )) &&
                      table.sessionId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewOrder(table.id, table.sessionId!);
                          }}
                          className={`w-full px-3 py-2 text-white text-xs rounded-xl transition-colors shadow-sm font-medium ${
                            ["payment_pending", "payment-pending"].includes(
                              table.status,
                            )
                              ? "bg-blue-500 hover:bg-blue-600"
                              : "bg-purple-500 hover:bg-purple-600"
                          }`}
                        >
                          {["payment_pending", "payment-pending"].includes(
                            table.status,
                          )
                            ? "Take Payment"
                            : "View Order"}
                        </button>
                      )}

                    {(table.status === "occupied" ||
                      ["payment_pending", "payment-pending"].includes(
                        table.status,
                      )) &&
                      !table.sessionId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              confirm(
                                "This table appears to be in an invalid state (missing session). Reset it to available?",
                              )
                            ) {
                              handleUnreserveTable(table.id);
                            }
                          }}
                          className="w-full px-3 py-2 bg-red-500 text-white text-xs rounded-xl hover:bg-red-600 transition-colors shadow-sm font-medium"
                        >
                          Reset Invalid Table
                        </button>
                      )}

                    {(table.status === "payment_confirmed" ||
                      table.status === "occupied") && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompleteSession(table.id);
                        }}
                        className="w-full px-3 py-2 bg-gray-700 text-white text-xs rounded-xl hover:bg-gray-800 transition-colors shadow-sm font-medium"
                      >
                        Complete Session
                      </button>
                    )}

                    {table.status === "empty" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReserveTable(table.id);
                        }}
                        className="w-full px-3 py-2 bg-blue-500 text-white text-xs rounded-xl hover:bg-blue-600 transition-colors shadow-sm font-medium"
                      >
                        Reserve Table
                      </button>
                    )}

                    {table.status === "reserved" && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInitTable(table.id);
                          }}
                          className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Start Session
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnreserveTable(table.id);
                          }}
                          className="w-full px-3 py-2 bg-gray-700 text-white text-xs rounded hover:bg-gray-800 transition-colors"
                        >
                          Unreserve Table
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Menu Management */}
          {activeTab === "menu" && <MenuManagement />}

          {/* Orders */}
          {activeTab === "orders" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables
                .filter(
                  (t) =>
                    t.status === "occupied" ||
                    t.status === "payment_confirmed" ||
                    t.status === "payment_pending",
                )
                .map((table) => (
                  <div
                    key={table.id}
                    className="relative border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all"
                    onClick={() => handleTableClick(table)}
                  >
                    <div
                      className={`absolute top-2 right-2 w-3 h-3 ${getStatusColor(table.status)} rounded-full`}
                    ></div>

                    <div className="text-center mb-3">
                      <div className="text-3xl font-bold text-gray-900">
                        T{table.number}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Capacity: {table.capacity}
                      </div>
                    </div>

                    <div
                      className={`text-xs font-semibold text-center py-1 px-2 rounded ${
                        table.status === "empty"
                          ? "bg-green-100 text-green-700"
                          : table.status === "occupied"
                            ? "bg-red-100 text-red-700"
                            : table.status === "payment_pending"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {getStatusText(table.status)}
                    </div>

                    <div className="mt-3 space-y-2">
                      {(table.status === "occupied" ||
                        table.status === "payment_pending") &&
                        table.sessionId && (
                          <button
                            onClick={() =>
                              handleViewOrder(table.id, table.sessionId!)
                            }
                            className={`w-full px-3 py-2 text-white text-xs rounded transition-colors ${
                              table.status === "payment_pending"
                                ? "bg-orange-500 hover:bg-orange-600"
                                : "bg-purple-500 hover:bg-purple-600"
                            }`}
                          >
                            {table.status === "payment_pending"
                              ? "Process Payment"
                              : "View Order"}
                          </button>
                        )}

                      {(table.status === "payment_confirmed" ||
                        table.status === "occupied") && (
                        <button
                          onClick={() => handleCompleteSession(table.id)}
                          className="w-full px-3 py-2 bg-gray-700 text-white text-xs rounded hover:bg-gray-800 transition-colors"
                        >
                          Complete Session
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Table Management */}
          {activeTab === "tables" && (
            <div>
              {/* Add Table Form */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Add New Table
                  </h3>
                  <button
                    onClick={() => setShowAddTableForm(!showAddTableForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Table
                  </button>
                </div>

                {showAddTableForm && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Table Number
                      </label>
                      <input
                        type="number"
                        value={newTableNumber}
                        onChange={(e: any) => setNewTableNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter table number"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Capacity
                      </label>
                      <input
                        type="number"
                        value={newTableCapacity}
                        onChange={(e: any) =>
                          setNewTableCapacity(e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter capacity"
                        min="1"
                        max="12"
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <button
                        onClick={handleAddTable}
                        disabled={addingTable}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                        {addingTable ? "Adding..." : "Add Table"}
                      </button>

                      <button
                        onClick={() => {
                          setShowAddTableForm(false);
                          setNewTableNumber("");
                          setNewTableCapacity("");
                        }}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tables List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tables.map((table: Table) => (
                  <div
                    key={table.id}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-2xl font-bold text-gray-900">
                          Table {table.number}
                        </div>
                        <div className="text-sm text-gray-500">
                          Capacity: {table.capacity} people
                        </div>
                      </div>

                      <div
                        className={`w-3 h-3 ${getStatusColor(table.status)} rounded-full`}
                      ></div>
                    </div>

                    <div
                      className={`text-xs font-semibold text-center py-1 px-2 rounded mb-3 ${
                        table.status === "empty"
                          ? "bg-green-100 text-green-700"
                          : table.status === "occupied"
                            ? "bg-red-100 text-red-700"
                            : table.status === "reserved"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {getStatusText(table.status)}
                    </div>

                    <div className="space-y-2">
                      {table.status === "empty" && (
                        <button
                          onClick={() => handleRemoveTable(table.id)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove Table
                        </button>
                      )}

                      {table.status !== "empty" && (
                        <div className="text-xs text-gray-500 text-center py-2">
                          Cannot remove table while in use
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {tables.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-lg mb-4">
                    No tables configured
                  </div>
                  <button
                    onClick={() => setShowAddTableForm(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Add Your First Table
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table Details Modal */}
      <TableDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        table={selectedTable}
      />
<<<<<<< HEAD
=======
      <CopyrightFooter />
>>>>>>> ff40e0f079c428a1ab1e18f6e586876db6206689
    </div>
  );
}

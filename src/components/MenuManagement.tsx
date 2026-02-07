import { Check, Edit, Eye, EyeOff, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { API_BASE, publicAnonKey } from "../utils/supabase/info";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  available: boolean;
}

const DEFAULT_CATEGORIES = [
  "Appetizers",
  "Main Courses",
  "Desserts",
  "Beverages",
];

export function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    description: "",
    image: "",
  });

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await fetch(`${API_BASE}/menu`, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setMenuItems(data);
      }
    } catch (error) {
      console.error("Error fetching menu:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStart = async () => {
    try {
      const res = await fetch(`${API_BASE}/add-menu-item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchMenu();
        setIsAddingNew(false);
        setFormData({
          name: "",
          category: "",
          price: "",
          description: "",
          image: "",
        });
      } else {
        alert("Failed to add menu item");
      }
    } catch (error) {
      console.error("Error adding menu item:", error);
      alert("Error adding menu item");
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/update-menu-item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ id, ...formData }),
      });

      if (res.ok) {
        await fetchMenu();
        setEditingId(null);
        setFormData({
          name: "",
          category: "",
          price: "",
          description: "",
          image: "",
        });
      } else {
        alert("Failed to update menu item");
      }
    } catch (error) {
      console.error("Error updating menu item:", error);
      alert("Error updating menu item");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const res = await fetch(`${API_BASE}/delete-menu-item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        await fetchMenu();
      } else {
        alert("Failed to delete menu item");
      }
    } catch (error) {
      console.error("Error deleting menu item:", error);
      alert("Error deleting menu item");
    }
  };

  const handleToggleAvailability = async (
    id: string,
    currentStatus: boolean,
  ) => {
    try {
      const res = await fetch(`${API_BASE}/toggle-menu-availability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ id, available: !currentStatus }),
      });

      if (res.ok) {
        await fetchMenu();
      }
    } catch (error) {
      console.error("Error toggling availability:", error);
    }
  };

  const startEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setIsCustomCategory(!DEFAULT_CATEGORIES.includes(item.category));
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      description: item.description,
      image: item.image,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAddingNew(false);
    setIsCustomCategory(false);
    setFormData({
      name: "",
      category: "",
      price: "",
      description: "",
      image: "",
    });
  };

  const categories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...menuItems.map((item) => item.category)]),
  );

  if (loading) {
    return <div className="text-center py-8">Loading menu...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
        {!isAddingNew && (
          <button
            onClick={() => setIsAddingNew(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add New Item
          </button>
        )}
      </div>

      {/* Add New Form */}
      {isAddingNew && (
        <div className="bg-white border-2 border-blue-500 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold">Add New Menu Item</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Item Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex flex-col gap-2">
              <select
                value={isCustomCategory ? "Custom" : formData.category}
                onChange={(e) => {
                  if (e.target.value === "Custom") {
                    setIsCustomCategory(true);
                    setFormData({ ...formData, category: "" });
                  } else {
                    setIsCustomCategory(false);
                    setFormData({ ...formData, category: e.target.value });
                  }
                }}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="Custom">Custom...</option>
              </select>
              {isCustomCategory && (
                <input
                  type="text"
                  placeholder="Enter custom category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>
            <input
              type="number"
              step="0.01"
              placeholder="Price (₹)"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Image URL"
              value={formData.image}
              onChange={(e) =>
                setFormData({ ...formData, image: e.target.value })
              }
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddStart}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Check className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={cancelEdit}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Menu Items by Category */}
      {categories.map((category) => {
        const items = menuItems.filter((item) => item.category === category);
        if (items.length === 0) return null;

        return (
          <div key={category} className="space-y-3">
            <h3 className="text-xl font-bold text-gray-800 border-b pb-2">
              {category}
            </h3>
            <div className="grid gap-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-lg border p-4">
                  {editingId === item.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex flex-col gap-2">
                          <select
                            value={
                              isCustomCategory ? "Custom" : formData.category
                            }
                            onChange={(e) => {
                              if (e.target.value === "Custom") {
                                setIsCustomCategory(true);
                                setFormData({ ...formData, category: "" });
                              } else {
                                setIsCustomCategory(false);
                                setFormData({
                                  ...formData,
                                  category: e.target.value,
                                });
                              }
                            }}
                            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            {categories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                            <option value="Custom">Custom...</option>
                          </select>
                          {isCustomCategory && (
                            <input
                              type="text"
                              placeholder="Enter custom category"
                              value={formData.category}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  category: e.target.value,
                                })
                              }
                              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) =>
                            setFormData({ ...formData, price: e.target.value })
                          }
                          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={formData.image}
                          onChange={(e) =>
                            setFormData({ ...formData, image: e.target.value })
                          }
                          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(item.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                          <Check className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{item.name}</h4>
                        <p className="text-gray-600 text-sm">
                          {item.description}
                        </p>
                        <p className="text-green-600 font-bold mt-1">
                          ₹{item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleToggleAvailability(item.id, item.available)
                          }
                          className={`p-2 rounded-lg transition ${
                            item.available
                              ? "bg-green-100 text-green-600 hover:bg-green-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                          title={item.available ? "Available" : "Unavailable"}
                        >
                          {item.available ? (
                            <Eye className="w-5 h-5" />
                          ) : (
                            <EyeOff className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => startEdit(item)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

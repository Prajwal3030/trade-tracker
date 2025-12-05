"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  getStrategies,
  saveStrategy,
  updateStrategy,
  deleteStrategy,
} from "@/lib/strategies";
import { Strategy, ChecklistItem } from "@/types/trade";

export default function StrategiesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    checklistItems: ChecklistItem[];
    confirmationsPlaceholder: string;
  }>({
    name: "",
    checklistItems: [
      { id: "1", label: "1H Bias aligned with trade direction", type: "checkbox", required: true },
      { id: "2", label: "15M Bias aligned with trade direction", type: "checkbox", required: true },
      { id: "3", label: "5M Structure Met", type: "checkbox", required: true },
    ],
    confirmationsPlaceholder: "e.g., BoS, Liquidity Grab, OB Test, Reversal Candle, Trend Line Bounce",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      loadStrategies();
    }
  }, [user]);

  const loadStrategies = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const loaded = await getStrategies(user.uid);
      setStrategies(loaded);
    } catch (err) {
      console.error("Error loading strategies:", err);
      setError("Failed to load strategies. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChecklistItem = () => {
    const newId = `${Date.now()}`;
    setFormData((prev) => ({
      ...prev,
      checklistItems: [
        ...prev.checklistItems,
        { id: newId, label: "", type: "checkbox", required: false },
      ],
    }));
  };

  const handleRemoveChecklistItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      checklistItems: prev.checklistItems.filter((item) => item.id !== id),
    }));
  };

  const handleUpdateChecklistItem = (
    id: string,
    field: keyof ChecklistItem,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      checklistItems: prev.checklistItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleOpenForm = (strategy?: Strategy) => {
    if (strategy) {
      setEditingStrategy(strategy);
      setFormData({
        name: strategy.name,
        checklistItems: strategy.checklistItems || [],
        confirmationsPlaceholder: strategy.confirmationsPlaceholder || "",
      });
    } else {
      setEditingStrategy(null);
      setFormData({
        name: "",
        checklistItems: [
          { id: "1", label: "1H Bias aligned with trade direction", type: "checkbox", required: true },
          { id: "2", label: "15M Bias aligned with trade direction", type: "checkbox", required: true },
          { id: "3", label: "5M Structure Met", type: "checkbox", required: true },
        ],
        confirmationsPlaceholder: "e.g., BoS, Liquidity Grab, OB Test, Reversal Candle, Trend Line Bounce",
      });
    }
    setIsFormOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingStrategy(null);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate
    if (!formData.name.trim()) {
      setError("Strategy name is required");
      return;
    }

    if (formData.checklistItems.length === 0) {
      setError("At least one checklist item is required");
      return;
    }

    // Check that all checklist items have labels
    const invalidItems = formData.checklistItems.filter(
      (item) => !item.label.trim()
    );
    if (invalidItems.length > 0) {
      setError("All checklist items must have a label");
      return;
    }

    try {
      if (editingStrategy?.id) {
        await updateStrategy(
          editingStrategy.id,
          {
            name: formData.name.trim(),
            checklistItems: formData.checklistItems,
            confirmationsPlaceholder: formData.confirmationsPlaceholder,
          },
          user.uid
        );
        setSuccess("Strategy updated successfully!");
      } else {
        await saveStrategy({
          userId: user.uid,
          name: formData.name.trim(),
          checklistItems: formData.checklistItems,
          confirmationsPlaceholder: formData.confirmationsPlaceholder,
        });
        setSuccess("Strategy created successfully!");
      }
      await loadStrategies();
      setTimeout(() => {
        handleCloseForm();
      }, 1000);
    } catch (err) {
      console.error("Error saving strategy:", err);
      setError("Failed to save strategy. Please try again.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!user) return;
    if (
      !confirm(
        `Are you sure you want to delete the strategy "${name}"?\n\nThis will not delete trades that used this strategy, but you won't be able to select it for new trades.\n\nThis action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteStrategy(id, user.uid);
      setSuccess("Strategy deleted successfully!");
      await loadStrategies();
    } catch (err) {
      console.error("Error deleting strategy:", err);
      setError("Failed to delete strategy. Please try again.");
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827]">
      <div className="mx-auto px-4 md:px-6 py-4 md:py-6 max-w-7xl">
        <div className="bg-[#1f2937] rounded-lg shadow-lg p-4 md:p-6 border border-gray-700/50">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-100">
              Setup / Strategy Management
            </h1>
            <button
              onClick={() => handleOpenForm()}
              className="bg-amber-400 text-gray-900 px-4 py-2 rounded-xl hover:bg-amber-500 transition-colors font-semibold"
            >
              + New Strategy
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-500/20 text-red-400 border border-red-500/30">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-md bg-green-500/20 text-green-400 border border-green-500/30">
              {success}
            </div>
          )}

          {isLoading ? (
            <div className="text-gray-400 text-center py-8">Loading strategies...</div>
          ) : strategies.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              No strategies yet. Create your first strategy to get started!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {strategies.map((strategy) => (
                <div
                  key={strategy.id}
                  className="bg-[#020617] border border-slate-700 rounded-xl p-4 hover:border-amber-400/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-100">
                      {strategy.name}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenForm(strategy)}
                        className="text-amber-400 hover:text-amber-300 transition-colors"
                        title="Edit"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(strategy.id!, strategy.name)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Delete"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">
                      {strategy.checklistItems?.length || 0} checklist items
                    </p>
                    {strategy.confirmationsPlaceholder && (
                      <p className="text-xs text-gray-500 truncate">
                        Placeholder: {strategy.confirmationsPlaceholder}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form Modal */}
          {isFormOpen && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-[#1f2937] rounded-lg shadow-xl border border-gray-700/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-100">
                      {editingStrategy ? "Edit Strategy" : "Create New Strategy"}
                    </h2>
                    <button
                      onClick={handleCloseForm}
                      className="text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Strategy Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        required
                        className="w-full px-3 py-2 bg-[#020617] border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder="e.g., Setup 1, Breakout Strategy"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Confirmations Placeholder
                      </label>
                      <input
                        type="text"
                        value={formData.confirmationsPlaceholder}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            confirmationsPlaceholder: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 bg-[#020617] border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder="e.g., BoS, Liquidity Grab, OB Test"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-300">
                          Checklist Items *
                        </label>
                        <button
                          type="button"
                          onClick={handleAddChecklistItem}
                          className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          + Add Item
                        </button>
                      </div>
                      <div className="space-y-3">
                        {formData.checklistItems.map((item, index) => (
                          <div
                            key={item.id}
                            className="bg-[#020617] border border-slate-700 rounded-md p-3"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1 space-y-2">
                                <input
                                  type="text"
                                  value={item.label}
                                  onChange={(e) =>
                                    handleUpdateChecklistItem(
                                      item.id,
                                      "label",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Checklist item label"
                                  className="w-full px-3 py-2 bg-[#111827] border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                  required
                                />
                                <div className="flex items-center gap-4">
                                  <label className="flex items-center gap-2 text-sm text-gray-300">
                                    <input
                                      type="radio"
                                      checked={item.type === "checkbox"}
                                      onChange={() =>
                                        handleUpdateChecklistItem(
                                          item.id,
                                          "type",
                                          "checkbox"
                                        )
                                      }
                                      className="text-amber-400"
                                    />
                                    Checkbox
                                  </label>
                                  <label className="flex items-center gap-2 text-sm text-gray-300">
                                    <input
                                      type="radio"
                                      checked={item.type === "text"}
                                      onChange={() =>
                                        handleUpdateChecklistItem(
                                          item.id,
                                          "type",
                                          "text"
                                        )
                                      }
                                      className="text-amber-400"
                                    />
                                    Text Input
                                  </label>
                                  {item.type === "checkbox" && (
                                    <label className="flex items-center gap-2 text-sm text-gray-300">
                                      <input
                                        type="checkbox"
                                        checked={item.required || false}
                                        onChange={(e) =>
                                          handleUpdateChecklistItem(
                                            item.id,
                                            "required",
                                            e.target.checked
                                          )
                                        }
                                        className="text-amber-400"
                                      />
                                      Required
                                    </label>
                                  )}
                                </div>
                              </div>
                              {formData.checklistItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveChecklistItem(item.id)}
                                  className="text-red-400 hover:text-red-300 transition-colors mt-1"
                                  title="Remove"
                                >
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-amber-400 text-gray-900 py-2 px-4 rounded-xl hover:bg-amber-500 transition-colors font-semibold"
                      >
                        {editingStrategy ? "Update Strategy" : "Create Strategy"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCloseForm}
                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


"use client";

import { TradeFilters as TradeFiltersType } from "@/types/trade";

interface TradeFiltersProps {
  filters: TradeFiltersType;
  onFilterChange: (filters: TradeFiltersType) => void;
}

export default function TradeFilters({
  filters,
  onFilterChange,
}: TradeFiltersProps) {
  const handleChange = (
    field: keyof TradeFiltersType,
    value: string | boolean | ""
  ) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };

  return (
    <div className="bg-[#1f2937] rounded-lg shadow-lg p-4 mb-4 border border-gray-700/50">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-semibold text-gray-100">Filters</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Strategy
          </label>
          <select
            value={filters.strategyId || ""}
            onChange={(e) =>
              handleChange(
                "strategyId",
                e.target.value as "Setup 1" | "Setup 2" | ""
              )
            }
            className="w-full px-3 py-2 bg-[#111827] border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">All</option>
            <option value="Setup 1">Setup 1</option>
            <option value="Setup 2">Setup 2</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Direction
          </label>
          <select
            value={filters.direction || ""}
            onChange={(e) =>
              handleChange(
                "direction",
                e.target.value as "Long" | "Short" | ""
              )
            }
            className="w-full px-3 py-2 bg-[#111827] border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">All</option>
            <option value="Long">Long</option>
            <option value="Short">Short</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Adherence
          </label>
          <select
            value={
              filters.isAdherent === undefined || filters.isAdherent === ""
                ? ""
                : filters.isAdherent
                ? "true"
                : "false"
            }
            onChange={(e) =>
              handleChange(
                "isAdherent",
                e.target.value === ""
                  ? ""
                  : e.target.value === "true"
                  ? true
                  : false
              )
            }
            className="w-full px-3 py-2 bg-[#111827] border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">All</option>
            <option value="true">Adherent</option>
            <option value="false">Not Adherent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={filters.startDate || ""}
            onChange={(e) => handleChange("startDate", e.target.value)}
            className="w-full px-3 py-2 bg-[#111827] border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={filters.endDate || ""}
            onChange={(e) => handleChange("endDate", e.target.value)}
            className="w-full px-3 py-2 bg-[#111827] border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>
    </div>
  );
}


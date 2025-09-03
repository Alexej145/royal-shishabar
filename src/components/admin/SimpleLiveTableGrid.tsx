import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Crown,
  Star,
  RefreshCw,
  Info,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ReservationService } from "../../services/reservationService";
import { OrderService } from "../../services/orderService";
import { Table } from "../../types/reservation";
import { Order } from "../../types/order";
import { ErrorEmptyState, NoDataEmptyState } from "../common/EmptyState";
import { toast } from "react-hot-toast";

interface SimpleLiveTableGridProps {
  onTableClick?: (table: Table) => void;
}

interface SimpleTableStatus {
  table: Table;
  hasActiveOrder: boolean;
  orderAmount?: number;
  isOpenBill?: boolean;
  isSeated?: boolean;
  statusType: "available" | "seated" | "active_order" | "open_bill";
}

interface SimpleStats {
  totalTables: number;
  available: number;
  occupied: number;
  openBills: number;
  totalRevenue: number;
}

const SimpleLiveTableGrid: React.FC<SimpleLiveTableGridProps> = ({
  onTableClick,
}) => {
  const [showLegend, setShowLegend] = useState(false);
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateTableStatuses = (): SimpleTableStatus[] => {
    return tables.map((table) => {
      const tableOrders = orders.filter((order) => {
        if (order.tableNumber !== table.number) return false;
        // delivered+paid => free; orders with status 'ready' are not included in active statuses (so they free the table)
        if (order.status === "delivered" && order.payment?.status === "paid")
          return false;
        // include active statuses and delivered if unpaid/partial
        return (
          ["pending", "confirmed", "preparing"].includes(order.status) ||
          order.status === "delivered"
        );
      });

      const activeOrder = tableOrders.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      )[0];
      const isOpenBill =
        activeOrder?.status === "delivered" &&
        (activeOrder.payment?.status === "unpaid" ||
          activeOrder.payment?.status === "partial");
      const hasActiveOrder = !!activeOrder && !isOpenBill;

      const recentPaid = orders.filter(
        (o) =>
          o.tableNumber === table.number &&
          o.status === "delivered" &&
          o.payment?.status === "paid" &&
          Date.now() - o.createdAt.getTime() < 2 * 60 * 60 * 1000
      );
      const isSeated = !hasActiveOrder && !isOpenBill && recentPaid.length > 0;

      const statusType: SimpleTableStatus["statusType"] = isOpenBill
        ? "open_bill"
        : hasActiveOrder
        ? "active_order"
        : isSeated
        ? "seated"
        : "available";
      return {
        table,
        hasActiveOrder,
        orderAmount: activeOrder?.totalAmount,
        isOpenBill,
        isSeated,
        statusType,
      };
    });
  };

  const calculateStats = (statuses: SimpleTableStatus[]): SimpleStats => ({
    totalTables: statuses.length,
    occupied: statuses.filter((s) => s.hasActiveOrder || s.isSeated).length,
    available:
      statuses.length -
      statuses.filter((s) => s.hasActiveOrder || s.isSeated).length,
    openBills: statuses.filter((s) => s.isOpenBill).length,
    totalRevenue: statuses.reduce((sum, s) => sum + (s.orderAmount || 0), 0),
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [tablesData, ordersData] = await Promise.all([
        ReservationService.getTables(),
        OrderService.getOrders(),
      ]);
      setTables(tablesData || []);
      setOrders(ordersData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      toast.error("Fehler beim Laden der Daten");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = OrderService.onOrdersChange((ordersData) =>
      setOrders(ordersData)
    );
    return () => unsub && unsub();
  }, []);

  const getLocationIcon = (location: string) => {
    switch (location) {
      case "vip":
        return <Crown className="w-4 h-4 text-blue-500" />;
      case "outdoor":
        return <Star className="w-4 h-4 text-green-500" />;
      default:
        return <MapPin className="w-4 h-4 text-blue-500" />;
    }
  };

  if (loading)
    return (
      <div className="p-6">
        <div className="flex items-center justify-center space-x-2 mb-6">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Laden der Tische...</span>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="p-6">
        <ErrorEmptyState
          title="Fehler beim Laden der Tische"
          description={error}
          onRetry={loadData}
          retrying={loading}
        />
      </div>
    );
  if (tables.length === 0)
    return (
      <div className="p-6">
        <NoDataEmptyState
          title="Keine Tische verfügbar"
          description="Es sind derzeit keine Tische konfiguriert."
          onRefresh={loadData}
          refreshing={loading}
        />
      </div>
    );

  const tableStatuses = calculateTableStatuses();
  const stats = calculateStats(tableStatuses);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-royal-charcoal to-royal-charcoal-dark rounded-xl p-6 border border-blue-200/20 shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-blue-600 mb-2 flex items-center">
              <div className="w-3 h-3 bg-blue-600 rounded-full mr-3 animate-pulse" />
              Tischübersicht{" "}
              <span className="ml-3 text-xl text-blue-200/80">
                ({tableStatuses.length} Tische)
              </span>
            </h2>
            <p className="text-blue-200/80 text-lg">
              Live Übersicht von Tischen und aktuellen Bestellungen
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-blue-200 px-4 py-2 rounded-xl"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="font-medium">Legende</span>
              {showLegend ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl disabled:opacity-60"
            >
              <RefreshCw
                className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
              />
              <span>Aktualisieren</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
          <p className="text-emerald-600 text-sm font-semibold uppercase">
            Verfügbar
          </p>
          <p className="text-3xl font-bold text-green-600">{stats.available}</p>
          <p className="text-xs text-emerald-600">Tische frei</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <p className="text-amber-600 text-sm font-semibold uppercase">
            Besetzt
          </p>
          <p className="text-3xl font-bold text-orange-600">{stats.occupied}</p>
          <p className="text-xs text-amber-600">Aktive Tische</p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
          <p className="text-blue-600 text-sm font-semibold uppercase">
            Umsatz
          </p>
          <p className="text-3xl font-bold text-blue-600">
            €{stats.totalRevenue.toFixed(0)}
          </p>
          <p className="text-xs text-blue-400">Aktueller Umsatz</p>
        </div>

        <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
          <p className="text-red-600 text-sm font-semibold uppercase">
            Offene Rechnungen
          </p>
          <p className="text-3xl font-bold text-red-600">{stats.openBills}</p>
          <p className="text-xs text-red-600">Bereit zum Kassieren</p>
        </div>
      </div>

      {showLegend && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-6 bg-slate-50 rounded-xl border"
        >
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-blue-600">Tischstatus Legende</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-white rounded-lg border text-green-700">
              Verfügbar — Bereit für neue Gäste
            </div>
            <div className="p-3 bg-white rounded-lg border text-orange-700">
              Besetzt — Kürzlich bezahlt / noch nicht frei
            </div>
            <div className="p-3 bg-white rounded-lg border text-blue-700">
              Aktive Bestellung — Bestellung in Bearbeitung
            </div>
            <div className="p-3 bg-white rounded-lg border text-black">
              Offene Rechnung — Zahlung offen
            </div>
          </div>
        </motion.div>
      )}

      <div className="bg-white p-4 rounded-xl border">
        <div className="grid grid-cols-5 gap-4">
          {tableStatuses
            .sort((a, b) => a.table.number - b.table.number)
            .map((ts) => (
              <motion.div
                key={ts.table.id}
                layout
                onClick={() => onTableClick?.(ts.table)}
                className={`p-4 rounded-lg cursor-pointer border ${
                  ts.statusType === "open_bill"
                    ? "border-red-300"
                    : ts.statusType === "active_order"
                    ? "border-amber-300"
                    : ts.statusType === "seated"
                    ? "border-purple-300"
                    : "border-emerald-200"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div
                    className={`text-sm font-semibold px-2 py-1 rounded-full ${
                      ts.statusType === "open_bill"
                        ? "bg-red-100 text-red-700"
                        : ts.statusType === "active_order"
                        ? "bg-amber-100 text-amber-700"
                        : ts.statusType === "seated"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {ts.table.capacity}P
                  </div>
                  <div className="p-1 rounded bg-blue-100">
                    {getLocationIcon(ts.table.location)}
                  </div>
                </div>

                <div className="text-center text-2xl font-bold mb-2 text-black">
                  {ts.table.number}
                </div>

                <div className="text-center mb-2 text-3xl">
                  {ts.statusType === "open_bill"
                    ? "💳"
                    : ts.statusType === "active_order"
                    ? "🍽️"
                    : ts.statusType === "seated"
                    ? "🪑"
                    : "✅"}
                </div>

                {ts.orderAmount && (
                  <div className="text-center text-sm mt-2 font-semibold text-black">
                    €{ts.orderAmount.toFixed(0)}
                  </div>
                )}
              </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default SimpleLiveTableGrid;

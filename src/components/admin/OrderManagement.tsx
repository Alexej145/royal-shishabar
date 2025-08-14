import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Package,
  CheckCircle,
  XCircle,
  Filter,
  RefreshCw,
  Trash2,
  Euro,
  TrendingUp,
  Eye,
  Crown,
  Shield,
  Gift,
} from "lucide-react";
import { OrderService } from "../../services/orderService";
import {
  Order,
  OrderStatus,
  OrderStats,
  OrderFilters,
} from "../../types/order";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import toast from "react-hot-toast";

type TabType = "inProgress" | "completed";

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filters, setFilters] = useState<OrderFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("inProgress");

  // CRITICAL FIX: Add state to track if component is mounted
  const [isMounted, setIsMounted] = useState(true);

  // CRITICAL FIX: Add state to prevent multiple simultaneous operations
  const [isUpdating, setIsUpdating] = useState(false);

  const statusColors = {
    pending: "bg-royal-gold/20 text-royal-gold border border-royal-gold/30",
    confirmed:
      "bg-royal-purple/20 text-royal-purple-light border border-royal-purple/30",
    preparing:
      "bg-royal-burgundy/20 text-royal-burgundy-light border border-royal-burgundy/30",
    ready: "bg-green-600/20 text-green-500 border border-green-600/30",
    delivered:
      "bg-royal-charcoal/20 text-royal-cream border border-royal-charcoal/30",
    cancelled: "bg-red-600/20 text-red-500 border border-red-600/30",
  };

  const statusIcons = {
    pending: Clock,
    confirmed: Package,
    preparing: RefreshCw,
    ready: CheckCircle,
    delivered: CheckCircle,
    cancelled: XCircle,
  };

  // Define which statuses are considered "in progress" vs "completed"
  const inProgressStatuses: OrderStatus[] = ["pending", "confirmed", "preparing", "ready"];
  const completedStatuses: OrderStatus[] = ["delivered", "cancelled"];

  // Filter orders based on active tab
  const getFilteredOrders = () => {
    const statusesToShow = activeTab === "inProgress" ? inProgressStatuses : completedStatuses;
    return orders.filter(order => statusesToShow.includes(order.status));
  };

  // Check if an order can be deleted (only pending orders)
  const canDeleteOrder = (order: Order) => {
    return order.status === "pending";
  };

  // CRITICAL FIX: Set up component lifecycle
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // CRITICAL FIX: Use useCallback to prevent infinite re-renders and race conditions
  const loadOrders = useCallback(async () => {
    if (!isMounted) return;

    try {
      console.log("🔄 Loading orders with filters:", filters);
      setLoading(true);
      const ordersData = await OrderService.getOrdersWithFilters(filters);

      // CRITICAL FIX: Check if component is still mounted before updating state
      if (!isMounted) return;

      console.log(
        "✅ Orders loaded successfully:",
        ordersData.length,
        "orders"
      );
      setOrders(ordersData);
    } catch (error) {
      if (!isMounted) return;

      console.error("❌ Error loading orders:", error);
      toast.error(
        "Fehler beim Laden der Bestellungen: " +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }, [filters, isMounted]);

  const loadStats = useCallback(async () => {
    if (!isMounted) return;

    try {
      const statsData = await OrderService.getOrderStats();

      // CRITICAL FIX: Check if component is still mounted before updating state
      if (!isMounted) return;

      setStats(statsData);
    } catch (error) {
      if (!isMounted) return;

      console.error("Error loading stats:", error);
    }
  }, [isMounted]);

  // CRITICAL FIX: Load data with proper coordination to prevent race conditions
  useEffect(() => {
    if (!isMounted) return;

    // CRITICAL FIX: Load orders and stats in parallel but coordinate the loading states
    const loadData = async () => {
      setLoading(true);

      try {
        // Load both in parallel but handle errors separately
        const [ordersData, statsData] = await Promise.allSettled([
          OrderService.getOrdersWithFilters(filters),
          OrderService.getOrderStats(),
        ]);

        // CRITICAL FIX: Check if component is still mounted before updating state
        if (!isMounted) return;

        // Handle orders result
        if (ordersData.status === "fulfilled") {
          console.log(
            "✅ Orders loaded successfully:",
            ordersData.value.length,
            "orders"
          );
          setOrders(ordersData.value);
        } else {
          console.error("❌ Error loading orders:", ordersData.reason);
          toast.error("Fehler beim Laden der Bestellungen");
        }

        // Handle stats result
        if (statsData.status === "fulfilled") {
          setStats(statsData.value);
        } else {
          console.error("❌ Error loading stats:", statsData.reason);
        }
      } catch (error) {
        if (!isMounted) return;

        console.error("❌ Error in data loading:", error);
        toast.error("Fehler beim Laden der Daten");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [filters, isMounted]);

  // CRITICAL FIX: Prevent multiple simultaneous status updates
  const updateOrderStatus = useCallback(
    async (orderId: string, newStatus: OrderStatus) => {
      if (isUpdating) {
        toast.error(
          "Bitte warten Sie, bis die vorherige Aktion abgeschlossen ist"
        );
        return;
      }

      setIsUpdating(true);

      try {
        await OrderService.updateOrderStatus(orderId, newStatus);

        if (!isMounted) return;

        toast.success("Bestellstatus erfolgreich aktualisiert");

        // CRITICAL FIX: Reload data in parallel
        await Promise.allSettled([loadOrders(), loadStats()]);
      } catch (error) {
        if (!isMounted) return;

        console.error("Error updating order status:", error);
        toast.error("Fehler beim Aktualisieren des Bestellstatus");
      } finally {
        if (isMounted) {
          setIsUpdating(false);
        }
      }
    },
    [isUpdating, isMounted, loadOrders, loadStats]
  );

  // CRITICAL FIX: Only allow deletion of pending orders
  const deleteOrder = useCallback(
    async (orderId: string) => {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      // Prevent deletion of confirmed, preparing, ready, delivered, or cancelled orders
      if (!canDeleteOrder(order)) {
        toast.error("Bestätigte, in Bearbeitung befindliche oder erledigte Bestellungen können nicht gelöscht werden");
        return;
      }

      if (!window.confirm("Sind Sie sicher, dass Sie diese Bestellung löschen möchten?")) {
        return;
      }

      if (isUpdating) {
        toast.error(
          "Bitte warten Sie, bis die vorherige Aktion abgeschlossen ist"
        );
        return;
      }

      if (!window.confirm("Bestellung wirklich löschen?")) {
        return;
      }

      setIsUpdating(true);

      try {
        await OrderService.deleteOrder(orderId);

        if (!isMounted) return;

        toast.success("Bestellung erfolgreich gelöscht");

        // CRITICAL FIX: Reload data in parallel
        await Promise.allSettled([loadOrders(), loadStats()]);
      } catch (error) {
        if (!isMounted) return;

        console.error("Error deleting order:", error);
        toast.error("Fehler beim Löschen der Bestellung");
      } finally {
        if (isMounted) {
          setIsUpdating(false);
        }
      }
    },
    [isUpdating, isMounted, orders, loadOrders, loadStats]
  );

  // CRITICAL FIX: Prevent multiple simultaneous loyalty verifications
  const verifyLoyaltyDiscount = useCallback(
    async (orderId: string) => {
      if (isUpdating) {
        toast.error(
          "Bitte warten Sie, bis die vorherige Aktion abgeschlossen ist"
        );
        return;
      }

      setIsUpdating(true);

      try {
        await OrderService.verifyLoyaltyDiscount(orderId);

        if (!isMounted) return;

        console.log("Loyalty Rabatt bestätigt");

        // CRITICAL FIX: Reload data in parallel
        await Promise.allSettled([loadOrders(), loadStats()]);
      } catch (error) {
        if (!isMounted) return;

        console.error("Error verifying loyalty discount:", error);
        toast.error("Fehler beim Bestätigen des Loyalty Rabatts");
      } finally {
        if (isMounted) {
          setIsUpdating(false);
        }
      }
    },
    [isUpdating, isMounted, loadOrders, loadStats]
  );

  const getTotalItems = (order: Order) => {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  };

  const formatStatus = (status: OrderStatus) => {
    const statusMap = {
      pending: "Ausstehend",
      confirmed: "Bestätigt",
      preparing: "In Zubereitung",
      ready: "Bereit",
      delivered: "Ausgeliefert",
      cancelled: "Storniert",
    };
    return statusMap[status];
  };

  // Get tab-specific stats
  const getTabStats = () => {
    if (!stats) return { count: 0, revenue: 0 };
    
    if (activeTab === "inProgress") {
      return {
        count: stats.pendingOrders + stats.preparingOrders + stats.readyOrders,
        revenue: stats.unpaidRevenue
      };
    } else {
      return {
        count: stats.deliveredOrders + stats.cancelledOrders,
        revenue: stats.paidRevenue
      };
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal-gold"></div>
      </div>
    );
  }

  const filteredOrders = getFilteredOrders();
  const tabStats = getTabStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-royal font-bold text-royal-charcoal">
            Bestellverwaltung
          </h2>
          <p className="text-royal-charcoal/70">
            Verwalten Sie alle Kundenbestellungen und deren Status
          </p>
        </div>
        <button
          onClick={loadOrders}
          className="bg-royal-gradient-gold text-royal-charcoal px-4 py-2 rounded-royal royal-glow hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Aktualisieren</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-royal-charcoal-dark rounded-royal p-1">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab("inProgress")}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-royal transition-all duration-200 ${
              activeTab === "inProgress"
                ? "bg-royal-gradient-gold text-royal-charcoal royal-glow"
                : "text-royal-cream hover:bg-royal-charcoal"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="font-medium">In Arbeit</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              activeTab === "inProgress" 
                ? "bg-royal-charcoal/20 text-royal-charcoal"
                : "bg-royal-gold/20 text-royal-gold"
            }`}>
              {stats ? (stats.pendingOrders + stats.preparingOrders + stats.readyOrders) : 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-royal transition-all duration-200 ${
              activeTab === "completed"
                ? "bg-royal-gradient-gold text-royal-charcoal royal-glow"
                : "text-royal-cream hover:bg-royal-charcoal"
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">Erledigt</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              activeTab === "completed" 
                ? "bg-royal-charcoal/20 text-royal-charcoal"
                : "bg-royal-gold/20 text-royal-gold"
            }`}>
              {stats ? (stats.deliveredOrders + stats.cancelledOrders) : 0}
            </span>
          </button>
        </div>
      </div>

      {/* Tab-specific Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-royal-charcoal-dark p-4 rounded-royal shadow-md border border-royal-gold/30 royal-glow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-royal-cream/70">
                {activeTab === "inProgress" ? "Bestellungen in Arbeit" : "Erledigte Bestellungen"}
              </p>
              <p className="text-2xl font-bold text-royal-cream">
                {tabStats.count}
              </p>
            </div>
            {activeTab === "inProgress" ? (
              <Clock className="w-8 h-8 text-royal-gold" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-500" />
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-royal-charcoal-dark p-4 rounded-royal shadow-md border border-royal-gold/30 royal-glow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-royal-cream/70">
                {activeTab === "inProgress" ? "Offener Umsatz" : "Erzielter Umsatz"}
              </p>
              <p className="text-2xl font-bold text-royal-cream">
                €{tabStats.revenue.toFixed(2)}
              </p>
            </div>
            <Euro className="w-8 h-8 text-royal-gold" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-royal-charcoal-dark p-4 rounded-royal shadow-md border border-royal-gold/30 royal-glow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-royal-cream/70">
                Durchschnittlicher Bestellwert
              </p>
              <p className="text-2xl font-bold text-royal-cream">
                €{stats ? stats.averageOrderValue.toFixed(2) : '0.00'}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-royal-gold" />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-royal-charcoal-dark p-4 rounded-royal shadow-md border border-royal-gold/30 royal-glow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-royal-cream">Filter</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-royal-gold hover:text-royal-gold/80"
          >
            <Filter className="w-4 h-4" />
            <span>{showFilters ? "Filter ausblenden" : "Filter anzeigen"}</span>
          </button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-royal-cream mb-2">
                Status
              </label>
              <select
                value={filters.status || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    status: (e.target.value as OrderStatus) || undefined,
                  })
                }
                className="w-full p-2 border border-royal-gold/30 rounded-royal focus:outline-none focus:ring-2 focus:ring-royal-gold/50 bg-royal-charcoal text-royal-cream"
              >
                <option value="">Alle Status</option>
                <option value="pending">Ausstehend</option>
                <option value="confirmed">Bestätigt</option>
                <option value="preparing">In Zubereitung</option>
                <option value="ready">Bereit</option>
                <option value="delivered">Ausgeliefert</option>
                <option value="cancelled">Storniert</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-royal-cream mb-2">
                Tischnummer
              </label>
              <input
                type="number"
                value={filters.tableNumber || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    tableNumber: parseInt(e.target.value) || undefined,
                  })
                }
                placeholder="Alle Tische"
                className="w-full p-2 border border-royal-gold/30 rounded-royal focus:outline-none focus:ring-2 focus:ring-royal-gold/50 bg-royal-charcoal text-royal-cream"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-royal-cream mb-2">
                Suche
              </label>
              <input
                type="text"
                value={filters.search || ""}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                placeholder="Kunde, Artikel, etc."
                className="w-full p-2 border border-royal-gold/30 rounded-royal focus:outline-none focus:ring-2 focus:ring-royal-gold/50 bg-royal-charcoal text-royal-cream"
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Orders List */}
      <div className="bg-royal-charcoal-dark rounded-royal shadow-md border border-royal-gold/30 overflow-hidden royal-glow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-royal-gradient-gold">
              <tr>
                <th className="px-4 py-3 text-left text-royal-charcoal font-semibold">
                  Bestellung
                </th>
                <th className="px-4 py-3 text-left text-royal-charcoal font-semibold">
                  Tisch
                </th>
                <th className="px-4 py-3 text-left text-royal-charcoal font-semibold">
                  Kunde
                </th>
                <th className="px-4 py-3 text-left text-royal-charcoal font-semibold">
                  Artikel
                </th>
                <th className="px-4 py-3 text-left text-royal-charcoal font-semibold">
                  Gesamt
                </th>
                <th className="px-4 py-3 text-left text-royal-charcoal font-semibold">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-royal-charcoal font-semibold">
                  Datum
                </th>
                <th className="px-4 py-3 text-left text-royal-charcoal font-semibold">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-royal-gold/20">
              {filteredOrders
                .map((order) => {
                  const StatusIcon = statusIcons[order.status];
                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-royal-charcoal/5 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-royal-cream/70">
                          #{order.id.slice(-8)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-royal-gold/20 text-royal-gold px-2 py-1 rounded-full text-sm font-semibold">
                          Tisch {order.tableNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-royal-cream">
                            {order.customerName || "Anonym"}
                          </p>
                          {order.customerPhone && (
                            <p className="text-sm text-royal-cream/70">
                              {order.customerPhone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-royal-cream/70">
                          <p>{getTotalItems(order)} Artikel</p>
                          <p className="text-xs">
                            {order.items
                              .slice(0, 2)
                              .map((item) => item.name)
                              .join(", ")}
                            {order.items.length > 2 && "..."}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-royal-gold">
                            {order.totalAmount.toFixed(2)}€
                          </span>
                          {/* Loyalty Badge */}
                          {order.loyaltyDiscount && (
                            <div className="flex items-center space-x-1 bg-royal-purple text-white px-2 py-1 rounded-full text-xs">
                              <Crown className="w-3 h-3" />
                              <span>
                                -{order.loyaltyDiscount.amount.toFixed(2)}€
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            statusColors[order.status]
                          }`}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {formatStatus(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-royal-cream/70">
                        {format(order.createdAt, "dd.MM.yyyy HH:mm", {
                          locale: de,
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-2 rounded bg-royal-gold/20 text-royal-gold hover:bg-royal-gold/30 flex items-center justify-center min-h-[44px]"
                            title="Details anzeigen"
                            style={{ fontSize: 16 }}
                          >
                            <Eye className="w-5 h-5 mr-1" />
                            Details
                          </button>

                          {/* Show action buttons only for "In Arbeit" tab */}
                          {activeTab === "inProgress" && (
                            <>
                              {order.status === "pending" && (
                                <>
                                  <button
                                    onClick={() =>
                                      updateOrderStatus(order.id, "confirmed")
                                    }
                                    className="p-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center min-h-[44px]"
                                    style={{ fontSize: 16 }}
                                  >
                                    <CheckCircle className="w-5 h-5 mr-1" />
                                    Bestätigen
                                  </button>
                                  {canDeleteOrder(order) && (
                                    <button
                                      onClick={() => deleteOrder(order.id)}
                                      className="p-2 rounded bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center min-h-[44px]"
                                      style={{ fontSize: 16 }}
                                      title="Bestellung löschen"
                                    >
                                      <Trash2 className="w-5 h-5 mr-1" />
                                      Löschen
                                    </button>
                                  )}
                                </>
                              )}
                              {order.status === "confirmed" && (
                                <button
                                  onClick={() =>
                                    updateOrderStatus(order.id, "preparing")
                                  }
                                  className="p-2 rounded bg-purple-600 text-white hover:bg-purple-700 flex items-center justify-center min-h-[44px]"
                                  style={{ fontSize: 16 }}
                                >
                                  <RefreshCw className="w-5 h-5 mr-1" />
                                  Zubereitung starten
                                </button>
                              )}
                              {order.status === "preparing" && (
                                <button
                                  onClick={() =>
                                    updateOrderStatus(order.id, "ready")
                                  }
                                  className="p-2 rounded bg-green-600 text-white hover:bg-green-700 flex items-center justify-center min-h-[44px]"
                                  style={{ fontSize: 16 }}
                                >
                                  <CheckCircle className="w-5 h-5 mr-1" />
                                  Bereit
                                </button>
                              )}
                              {order.status === "ready" && (
                                <button
                                  onClick={() =>
                                    updateOrderStatus(order.id, "delivered")
                                  }
                                  className="p-2 rounded bg-royal-charcoal text-royal-cream hover:bg-royal-charcoal/80 flex items-center justify-center min-h-[44px]"
                                  style={{ fontSize: 16 }}
                                >
                                  <Package className="w-5 h-5 mr-1" />
                                  Ausliefern
                                </button>
                              )}
                            </>
                          )}

                          {/* Show limited actions for "Erledigt" tab */}
                          {activeTab === "completed" && (
                            <>
                              {order.status === "cancelled" && (
                                <button
                                  onClick={() => deleteOrder(order.id)}
                                  className="p-2 rounded bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center min-h-[44px]"
                                  style={{ fontSize: 16 }}
                                  title="Stornierte Bestellung endgültig löschen"
                                >
                                  <Trash2 className="w-5 h-5 mr-1" />
                                  Löschen
                                </button>
                              )}
                              {order.status === "delivered" && (
                                <span className="p-2 rounded bg-green-100 text-green-600 flex items-center justify-center min-h-[44px] text-sm">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Abgeschlossen
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            {activeTab === "inProgress" ? (
              <>
                <Clock className="w-16 h-16 mx-auto text-royal-cream/30 mb-4" />
                <p className="text-royal-cream/70">Keine Bestellungen in Arbeit</p>
                <p className="text-royal-cream/50 text-sm mt-2">
                  Alle aktuellen Bestellungen wurden bereits bearbeitet.
                </p>
              </>
            ) : (
              <>
                <CheckCircle className="w-16 h-16 mx-auto text-royal-cream/30 mb-4" />
                <p className="text-royal-cream/70">Keine erledigten Bestellungen</p>
                <p className="text-royal-cream/50 text-sm mt-2">
                  Hier werden ausgelieferte und stornierte Bestellungen angezeigt.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="relative bg-white rounded-royal shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="bg-royal-gradient-gold p-4 flex items-center justify-between">
              <h3 className="text-xl font-royal font-bold text-royal-charcoal">
                Bestelldetails #{selectedOrder.id.slice(-8)}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-royal-charcoal/20 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <XCircle className="w-5 h-5 text-royal-charcoal" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-royal-charcoal/70">Tischnummer</p>
                  <p className="font-semibold text-royal-charcoal">
                    Tisch {selectedOrder.tableNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-royal-charcoal/70">Status</p>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      statusColors[selectedOrder.status]
                    }`}
                  >
                    {formatStatus(selectedOrder.status)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-royal-charcoal/70">Kunde</p>
                  <p className="font-semibold text-royal-charcoal">
                    {selectedOrder.customerName || "Anonym"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-royal-charcoal/70">Telefon</p>
                  <p className="font-semibold text-royal-charcoal">
                    {selectedOrder.customerPhone || "Nicht angegeben"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-royal-charcoal/70">Bestelldatum</p>
                  <p className="font-semibold text-royal-charcoal">
                    {format(selectedOrder.createdAt, "dd.MM.yyyy HH:mm", {
                      locale: de,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-royal-charcoal/70">Gesamtbetrag</p>
                  <p className="font-bold text-royal-gold text-lg">
                    {selectedOrder.totalAmount.toFixed(2)}€
                  </p>
                </div>
              </div>

              {/* Loyalty Discount Information */}
              {selectedOrder.loyaltyDiscount && (
                <div className="bg-royal-purple/10 rounded-royal p-4 border border-royal-purple/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Crown className="w-5 h-5 text-royal-purple" />
                      <span className="font-medium text-royal-purple">
                        Loyalty Rabatt angewendet
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 bg-royal-purple text-white px-2 py-1 rounded-full text-xs">
                      <Gift className="w-3 h-3" />
                      <span>Loyalty Order</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-royal-purple/70">Rabattbetrag</p>
                      <p className="font-bold text-royal-purple">
                        -{selectedOrder.loyaltyDiscount.amount.toFixed(2)}€
                      </p>
                    </div>
                    <div>
                      <p className="text-royal-purple/70">Gratis Shishas</p>
                      <p className="font-bold text-royal-purple">
                        {selectedOrder.loyaltyDiscount.freeShishasRedeemed}x
                      </p>
                    </div>
                    <div>
                      <p className="text-royal-purple/70">Kunde</p>
                      <p className="font-bold text-royal-purple">
                        {selectedOrder.loyaltyDiscount.customerPhone}
                      </p>
                    </div>
                    <div>
                      <p className="text-royal-purple/70">Bestätigt</p>
                      <p
                        className={`font-bold ${
                          selectedOrder.loyaltyDiscount.isVerified
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {selectedOrder.loyaltyDiscount.isVerified
                          ? "✅ Ja"
                          : "❌ Nein"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 bg-royal-purple/5 rounded-royal p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-royal-purple" />
                        <span className="text-sm font-medium text-royal-purple">
                          Bestätigungscode:
                        </span>
                      </div>
                      {!selectedOrder.loyaltyDiscount.isVerified && (
                        <button
                          onClick={() =>
                            verifyLoyaltyDiscount(selectedOrder.id)
                          }
                          className="px-3 py-2 bg-royal-purple text-white rounded-royal text-xs hover:bg-royal-purple-light min-h-[44px]"
                        >
                          Bestätigen
                        </button>
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <span className="text-lg font-bold text-royal-purple bg-white px-3 py-1 rounded border-2 border-royal-purple font-mono">
                        {selectedOrder.loyaltyDiscount.verificationCode}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              {selectedOrder.specialInstructions && (
                <div>
                  <p className="text-sm text-royal-charcoal/70 mb-2">
                    Spezielle Anweisungen
                  </p>
                  <p className="bg-royal-gold/10 p-3 rounded-royal text-royal-charcoal">
                    {selectedOrder.specialInstructions}
                  </p>
                </div>
              )}

              {/* Order Items */}
              <div>
                <p className="text-sm text-royal-charcoal/70 mb-3">
                  Bestellte Artikel
                </p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-royal-charcoal/5 rounded-royal"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold text-royal-charcoal">
                            {item.name}
                          </p>
                          {/* Loyalty Badge for Shisha Items */}
                          {selectedOrder.loyaltyDiscount &&
                            (item.category.toLowerCase() === "shisha" ||
                              item.category.toLowerCase() === "tobacco") && (
                              <div className="flex items-center space-x-1 bg-royal-purple text-white px-2 py-1 rounded-full text-xs">
                                <Crown className="w-3 h-3" />
                                <span>Loyalty</span>
                              </div>
                            )}
                        </div>
                        <p className="text-sm text-royal-charcoal/70">
                          {item.category}
                        </p>
                        {item.specialInstructions && (
                          <p className="text-xs text-royal-gold mt-1">
                            Anweisung: {item.specialInstructions}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-royal-charcoal">
                          {item.quantity}x {item.price.toFixed(2)}€
                        </p>
                        <p className="font-bold text-royal-gold">
                          {(item.price * item.quantity).toFixed(2)}€
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Crown,
  Star,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { ReservationService } from "../../services/reservationService";
import { OrderService } from "../../services/orderService";
import { Table, Reservation } from "../../types/reservation";
import { Order, PaymentStatus } from "../../types/order";
import { ErrorEmptyState, NoDataEmptyState } from "../common/EmptyState";
import { toast } from "react-hot-toast";

// Enum for table status types to improve type safety
enum TableStatusType {
  AVAILABLE = "available",
  SEATED = "seated",
  ACTIVE_ORDER = "active_order",
  OPEN_BILL = "open_bill",
}

// Enum for table locations to improve type safety
enum TableLocation {
  VIP = "vip",
  OUTDOOR = "outdoor",
  INDOOR = "indoor",
}

// Type definitions for component props and state
interface SimpleLiveTableGridProps {
  onTableClick?: (table: Table) => void;
  refreshInterval?: number; // Optional auto-refresh interval in ms
}

interface TableStatus {
  table: Table;
  hasActiveOrder: boolean;
  orderAmount?: number;
  isOpenBill: boolean;
  isSeated: boolean;
  statusType: TableStatusType;
}

interface GridStats {
  totalTables: number;
  available: number;
  occupied: number;
  openBills: number;
  totalRevenue: number;
}

interface GridState {
  loading: boolean;
  error: string | null;
  tables: Table[];
  ordersToday: Order[];
  seatedReservations: Reservation[];
  stats: GridStats;
  tableStatuses: TableStatus[];
  lastUpdated: Date | null;
}

// Constants for styling and configuration
const STATUS_STYLES = {
  [TableStatusType.OPEN_BILL]: {
    border: "border-red-300",
    badge: "bg-red-100 text-red-700",
    emoji: "??", // open bill
  },
  [TableStatusType.ACTIVE_ORDER]: {
    border: "border-amber-300",
    badge: "bg-amber-100 text-amber-700",
    emoji: "???", // active order
  },
  [TableStatusType.SEATED]: {
    border: "border-purple-300",
    badge: "bg-purple-100 text-purple-700",
    emoji: "??", // seated
  },
  [TableStatusType.AVAILABLE]: {
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
    emoji: "?", // available
  },
};

// Utility functions
const formatEuro = (amount: number): string =>
  amount.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

const formatTime = (date: Date): string =>
  date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

// Memoized component for displaying a single table card
const TableCard: React.FC<{
  tableStatus: TableStatus;
  onClick: () => void;
  getLocationIcon: (location: string) => React.ReactNode;
}> = React.memo(({ tableStatus: ts, onClick, getLocationIcon }) => {
  const styles = STATUS_STYLES[ts.statusType];

  return (
    <motion.div
      layout
      onClick={onClick}
      className={`p-4 rounded-lg cursor-pointer border ${styles.border} hover:shadow-md transition-shadow`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex justify-between items-start mb-2">
        <div
          className={`text-sm font-semibold px-2 py-1 rounded-full ${styles.badge}`}
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

      <div className="text-center mb-2 text-3xl">{styles.emoji}</div>

      {typeof ts.orderAmount === "number" && ts.orderAmount > 0 && (
        <div className="text-center text-sm mt-2 font-semibold text-black">
          {formatEuro(ts.orderAmount)}
        </div>
      )}
    </motion.div>
  );
});

// Memoized component for displaying stats cards
const StatsCard: React.FC<{
  title: string;
  value: number | string;
  subtitle: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  valueClass: string;
}> = React.memo(({
  title,
  value,
  subtitle,
  bgClass,
  borderClass,
  textClass,
  valueClass,
}) => (
  <div className={`p-4 rounded-2xl ${bgClass} ${borderClass}`}>
    <p className={`${textClass} text-sm font-semibold uppercase`}>{title}</p>
    <p className={`text-3xl font-bold ${valueClass}`}>{value}</p>
    <p className={`text-xs ${textClass}`}>{subtitle}</p>
  </div>
));

// Main component with optimized data handling
const SimpleLiveTableGrid: React.FC<SimpleLiveTableGridProps> = ({
  onTableClick,
  refreshInterval = 0, // Default to no auto-refresh
}) => {
  // Consolidated state using a single state object
  const [state, setState] = useState<GridState>({
    loading: true,
    error: null,
    tables: [],
    ordersToday: [],
    seatedReservations: [],
    stats: {
      totalTables: 0,
      available: 0,
      occupied: 0,
      openBills: 0,
      totalRevenue: 0,
    },
    tableStatuses: [],
    lastUpdated: null,
  });
  
  const [expanded, setExpanded] = useState(true);

  // Memoized date range calculation
  const dateRange = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }, []);

  // Error handling with detailed error information
  const handleError = useCallback((e: unknown): string => {
    console.error("Error loading live grid data:", e);
    
    if (e instanceof Error) return e.message;
    if (typeof e === "string") return e;
    if (e && typeof e === "object" && "message" in e && typeof e.message === "string") {
      return e.message;
    }
    return "Fehler beim Laden der Daten";
  }, []);

  // Optimized data loading function
  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Parallel data fetching with Promise.all
      const [tables, orders, seated] = await Promise.all([
        ReservationService.getTables(),
        OrderService.getOrdersWithFilters({
          dateRange: { start: dateRange.start, end: dateRange.end },
        }),
        ReservationService.getReservations({
          date: new Date(),
          status: "seated",
        }),
      ]);

      // Process data and update state in a single operation
      const processedData = processTableData(tables, orders, seated);
      
      setState(prev => ({
        ...prev,
        loading: false,
        tables,
        ordersToday: orders,
        seatedReservations: seated,
        tableStatuses: processedData.tableStatuses,
        stats: processedData.stats,
        lastUpdated: new Date(),
      }));
    } catch (e: unknown) {
      setState(prev => ({
        ...prev, 
        loading: false, 
        error: handleError(e)
      }));
    }
  }, [dateRange, handleError]);

  // Process table data with optimized algorithms
  const processTableData = useCallback((
    tables: Table[], 
    orders: Order[], 
    reservations: Reservation[]
  ) => {
    // Create efficient lookup maps for O(1) access
    const seatedMap = new Map<number, boolean>();
    for (const r of reservations) {
      seatedMap.set(r.tableNumber, true);
    }

    // Group orders by table for efficient processing
    const ordersMap = new Map<number, Order[]>();
    for (const o of orders) {
      const tableOrders = ordersMap.get(o.tableNumber) || [];
      tableOrders.push(o);
      ordersMap.set(o.tableNumber, tableOrders);
    }

    // Process table statuses with a single pass
    const tableStatuses = tables.map((table) => {
      const tableOrders = ordersMap.get(table.number) || [];
      
      // Determine table status with optimized checks
      const hasActiveOrder = tableOrders.some(
        (o) => o.status !== "cancelled" && o.status !== "delivered"
      );
      
      const isOpenBill = tableOrders.some(
        (o) => o.payment?.status !== "paid"
      );
      
      // Calculate unpaid amount in a single pass
      const unpaidAmount = tableOrders
        .filter((o) => o.payment?.status !== "paid")
        .reduce((sum, o) => sum + (o.payment?.amount ?? o.totalAmount ?? 0), 0);
      
      const isSeated = Boolean(seatedMap.get(table.number));
      
      // Determine status type with priority logic
      let statusType = TableStatusType.AVAILABLE;
      if (isOpenBill) statusType = TableStatusType.OPEN_BILL;
      else if (hasActiveOrder) statusType = TableStatusType.ACTIVE_ORDER;
      else if (isSeated) statusType = TableStatusType.SEATED;
      
      return {
        table,
        hasActiveOrder,
        isOpenBill,
        isSeated,
        statusType,
        orderAmount: unpaidAmount > 0 ? unpaidAmount : undefined,
      } as TableStatus;
    });
    
    // Calculate stats in a single pass
    const totalTables = tables.length;
    const available = tableStatuses.filter(
      (t) => t.statusType === TableStatusType.AVAILABLE
    ).length;
    const occupied = totalTables - available;
    const openBills = tableStatuses.filter(
      (t) => t.statusType === TableStatusType.OPEN_BILL
    ).length;
    
    // Calculate total revenue with a single reduce operation
    const totalRevenue = orders
      .filter((o) => o.payment?.status === "paid")
      .reduce((sum, o) => sum + (o.payment?.amount ?? o.totalAmount ?? 0), 0);
    
    return {
      tableStatuses,
      stats: {
        totalTables,
        available,
        occupied,
        openBills,
        totalRevenue,
      },
    };
  }, []);

  // Get location icon with memoization
  const getLocationIcon = useCallback((location: string) => {
    switch (location) {
      case TableLocation.VIP:
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case TableLocation.OUTDOOR:
        return <Star className="w-4 h-4 text-green-600" />;
      default:
        return <MapPin className="w-4 h-4 text-blue-600" />; // indoor/default
    }
  }, []);

  // Handle refresh with optimistic UI update
  const handleRefresh = useCallback(async () => {
    toast.promise(
      loadData(),
      {
        loading: "Aktualisiere...",
        success: "Daten aktualisiert",
        error: (err) => `Fehler: ${err.toString()}`
      }
    );
  }, [loadData]);

  // Toggle expanded state
  const toggleExpanded = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  // Initial data loading
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Optional auto-refresh functionality
  useEffect(() => {
    if (refreshInterval > 0) {
      const intervalId = setInterval(() => {
        loadData();
      }, refreshInterval);
      
      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, loadData]);

  // Render loading state
  if (state.loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse flex items-center space-x-2 text-sm text-gray-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Lade Tische...</span>
        </div>
      </div>
    );
  }

  // Render error state
  if (state.error) {
    return (
      <div className="p-4">
        <ErrorEmptyState 
          title="Fehler" 
          description={state.error} 
          icon={<AlertTriangle className="w-8 h-8 text-red-500" />}
        />
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  // Render empty state
  if (!state.tables.length) {
    return (
      <div className="p-4">
        <NoDataEmptyState
          title="Keine Tische"
          description="Es wurden keine Tische gefunden."
        />
      </div>
    );
  }

  // Main render with optimized component structure
  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Live Tische</h2>
          <button
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
            onClick={handleRefresh}
            title="Aktualisieren"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          {state.lastUpdated && (
            <span className="text-xs text-gray-500">
              Aktualisiert: {formatTime(state.lastUpdated)}
            </span>
          )}
        </div>

        <button
          className="text-xs text-gray-600 hover:text-gray-800 inline-flex items-center gap-1"
          onClick={toggleExpanded}
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Einklappen
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Ausklappen
            </>
          )}
        </button>
      </div>

      {/* Stats with animation */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            <StatsCard
              title="Tische"
              value={state.stats.totalTables}
              subtitle="Gesamt"
              bgClass="bg-white"
              borderClass="border border-gray-200"
              textClass="text-gray-500"
              valueClass="text-black"
            />
            <StatsCard
              title="Frei"
              value={state.stats.available}
              subtitle="Verfügbar"
              bgClass="bg-emerald-50"
              borderClass="border border-emerald-200"
              textClass="text-emerald-700"
              valueClass="text-emerald-900"
            />
            <StatsCard
              title="Belegt"
              value={state.stats.occupied}
              subtitle="Seated/Bestellung/Rechnung"
              bgClass="bg-purple-50"
              borderClass="border border-purple-200"
              textClass="text-purple-700"
              valueClass="text-purple-900"
            />
            <StatsCard
              title="Offen"
              value={state.stats.openBills}
              subtitle="Offene Rechnungen"
              bgClass="bg-red-50"
              borderClass="border border-red-200"
              textClass="text-red-700"
              valueClass="text-red-900"
            />
            <div className="col-span-2 md:col-span-4">
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Heutiger Umsatz (bezahlt):{" "}
                <span className="font-semibold text-black">
                  {formatEuro(state.stats.totalRevenue)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table grid with optimized rendering */}
      <motion.div
        layout
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
      >
        {state.tableStatuses.map((ts) => (
          <TableCard
            key={ts.table.id}
            tableStatus={ts}
            onClick={() => onTableClick?.(ts.table)}
            getLocationIcon={getLocationIcon}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default SimpleLiveTableGrid;

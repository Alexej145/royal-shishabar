import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  Firestore,
} from "firebase/firestore";
import { getFirestoreDB } from "../../config/firebase";
import { Order } from "../../types/order";
import { MenuItem } from "../../types/menu";
import { CartItem } from "../../types/order";
import { OrderService } from "../../services/orderService";
import LoadingSpinner from "../common/LoadingSpinner";
import { ErrorEmptyState, NoDataEmptyState } from "../common/EmptyState";
import {
  useMultipleAdminDataLoader,
  useRealtimeAdminData,
} from "../../hooks/useAdminDataLoader";
import { toast } from "react-hot-toast";
import {
  Clock,
  CheckCircle,
  Hash,
  ChefHat,
  Coffee,
  Flame,
  RefreshCw,
} from "lucide-react";
import { safeToDateWithFallback } from "../../utils/dateUtils";

// Constants for category matching to avoid string repetition and typos
const CATEGORIES = {
  DRINKS: new Set(["drinks", "beverages"]),
  SHISHA: new Set(["shisha", "hookah", "tobacco"]),
};

// Type for the setupRealtimeListener function compatible with useRealtimeAdminData
// T is the processed data type returned by the processor
// K is the raw data type emitted by the listener
export type SetupRealtimeListenerFn<T> = <K>(
  setupFn: (callback: (data: K) => void) => () => void,
  processFn?: (data: K) => T
) => () => void;

interface OrderWithItem extends Order {
  currentItem: CartItem & MenuItem;
}

interface BarOperationsData {
  menuItems: MenuItem[];
  pendingOrders: Order[];
}

type BarOperationsProps = Record<string, never>;

/**
 * BarOperations Component
 *
 * Displays and manages drink and shisha orders for bar staff.
 * Features real-time updates, order categorization, and status management.
 */
const BarOperations: React.FC<BarOperationsProps> = () => {
  const [drinkOrders, setDrinkOrders] = useState<OrderWithItem[]>([]);
  const [shishaOrders, setShishaOrders] = useState<OrderWithItem[]>([]);
  const [completingOrders, setCompletingOrders] = useState<Set<string>>(
    new Set()
  );

  // Refs to prevent aggressive reloading and maintain state between renders
  const isProcessingRef = useRef(false);
  const lastProcessedOrdersRef = useRef<string>("");
  const menuItemsRef = useRef<MenuItem[]>([]);
  const hasLoadedInitialDataRef = useRef(false);
  const setupRealtimeListenerRef = useRef<SetupRealtimeListenerFn<
    Order[]
  > | null>(null);

  const db = getFirestoreDB();

  /**
   * Process orders with menu items to categorize them into drinks and shisha
   * Uses memoization and hash comparison to prevent unnecessary processing
   */
  const processOrdersWithMenuItems = useCallback(
    (orders: Order[], menuItems: MenuItem[]) => {
      // Prevent duplicate processing
      if (isProcessingRef.current) {
        return;
      }

      // Create a hash of orders to check if they've changed
      const ordersHash = JSON.stringify(
        orders.map((o) => ({
          id: o.id,
          status: o.status,
          updatedAt: o.updatedAt,
        }))
      );

      // Skip processing if orders haven't changed
      if (ordersHash === lastProcessedOrdersRef.current) {
        return;
      }

      isProcessingRef.current = true;
      lastProcessedOrdersRef.current = ordersHash;

      // Create a Map for O(1) menu item lookups instead of using find() in a loop
      const menuItemsMap = new Map(menuItems.map((item) => [item.id, item]));

      const drinks: OrderWithItem[] = [];
      const shisha: OrderWithItem[] = [];

      // Process each order and categorize items
      orders.forEach((order) => {
        order.items.forEach((orderItem) => {
          const menuItem = menuItemsMap.get(orderItem.menuItemId);

          if (menuItem) {
            const orderWithMenuItem: OrderWithItem = {
              ...order,
              currentItem: {
                ...orderItem,
                ...menuItem,
              },
            };

            // Use the CATEGORIES constant for more reliable category matching
            if (CATEGORIES.DRINKS.has(menuItem.category)) {
              drinks.push(orderWithMenuItem);
            } else if (CATEGORIES.SHISHA.has(menuItem.category)) {
              shisha.push(orderWithMenuItem);
            }
          } else {
            console.warn(
              "?? Menu item not found for orderItem:",
              orderItem.menuItemId
            );
          }
        });
      });

      setDrinkOrders(drinks);
      setShishaOrders(shisha);

      // Reset processing flag after a short delay
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 100);
    },
    [] // Empty dependency array to prevent infinite re-renders
  );

  // Use our robust data loader for initial data
  const {
    data: initialData,
    loading: loadingInitial,
    error: initialError,
    isEmpty,
    loadMultipleData: loadInitialData,
    reload: reloadInitialData,
  } = useMultipleAdminDataLoader<BarOperationsData>({
    initialData: { menuItems: [], pendingOrders: [] },
    onSuccess: (data) => {
      // Store menu items in ref for real-time updates
      menuItemsRef.current = data.menuItems;
      processOrdersWithMenuItems(data.pendingOrders, data.menuItems);
    },
    onError: (error) => {
      console.error("? BarOperations: Initial data loading failed:", error);
      toast.error("Fehler beim Laden der Daten");
    },
    checkEmpty: (data) =>
      data.menuItems.length === 0 && data.pendingOrders.length === 0,
  });

  // Use realtime data loader with proper cleanup
  const {
    loading: loadingRealtime,
    error: realtimeError,
    setupRealtimeListener,
  } = useRealtimeAdminData<Order[]>([], (data) =>
    Array.isArray(data) ? data.length === 0 : !data
  );

  // Store stable reference to setupRealtimeListener
  setupRealtimeListenerRef.current = setupRealtimeListener;

  // Load initial data only once when component mounts
  useEffect(() => {
    // Prevent multiple initial data loads
    if (hasLoadedInitialDataRef.current) {
      return;
    }

    hasLoadedInitialDataRef.current = true;

    loadInitialData({
      // Load menu items
      menuItems: async () => {
        const menuQuery = query(collection(db, "menuItems"));
        const snapshot = await getDocs(menuQuery);

        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as MenuItem[];

        return items;
      },

      // Load pending orders
      pendingOrders: async () => {
        const ordersQuery = query(
          collection(db, "orders"),
          where("status", "in", ["pending", "confirmed", "preparing"]),
          orderBy("createdAt", "asc")
        );

        const snapshot = await getDocs(ordersQuery);

        const orders = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: safeToDateWithFallback(data.createdAt),
            updatedAt: safeToDateWithFallback(data.updatedAt),
          } as Order;
        });

        return orders;
      },
    });
  }, [db, loadInitialData]); // Include dependencies; guarded by hasLoadedInitialDataRef to run once

  // Create a memoized query for orders to avoid recreating it on each render
  const createOrdersQuery = useCallback((db: Firestore) => {
    return query(
      collection(db, "orders"),
      where("status", "in", ["pending", "confirmed", "preparing"]),
      orderBy("createdAt", "asc")
    );
  }, []);

  // Set up realtime listener with debouncing and proper cleanup
  useEffect(() => {
    if (!initialData || loadingInitial || !setupRealtimeListenerRef.current)
      return;

    let isSubscribed = true;
    let debounceTimeout: NodeJS.Timeout | null = null;

    // Memoize the orders query
    const ordersQuery = createOrdersQuery(db);

    const unsubscribe = setupRealtimeListenerRef.current(
      (callback: (data: Order[]) => void) => {
        return onSnapshot(
          ordersQuery,
          (snapshot) => {
            if (!isSubscribed) return;

            const orders = snapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                createdAt: safeToDateWithFallback(data.createdAt),
                updatedAt: safeToDateWithFallback(data.updatedAt),
              } as Order;
            });

            // Debounce real-time updates to prevent aggressive processing
            if (debounceTimeout) {
              clearTimeout(debounceTimeout);
            }

            debounceTimeout = setTimeout(() => {
              if (!isSubscribed) return;
              callback(orders);
            }, 300); // 300ms debounce
          },
          (error) => {
            if (!isSubscribed) return;
            console.error("? Realtime listener error:", error);
            toast.error("Fehler bei der Echtzeitaktualisierung");
          }
        );
      },
      (orders: Order[]) => {
        if (!isSubscribed || !menuItemsRef.current.length) return orders;

        // Use stored menu items instead of initialData
        processOrdersWithMenuItems(orders, menuItemsRef.current);
        return orders;
      }
    );

    return () => {
      isSubscribed = false;
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      if (unsubscribe && typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [
    initialData,
    loadingInitial,
    db,
    createOrdersQuery,
    processOrdersWithMenuItems,
  ]);

  // Optimized order completion without full data reload
  const handleCompleteItem = useCallback(
    async (orderId: string) => {
      if (completingOrders.has(orderId)) return;

      setCompletingOrders((prev) => new Set(prev).add(orderId));

      try {
        await OrderService.updateOrderStatus(orderId, "ready");
        toast.success("Bestellung abgeschlossen");

        // Don't reload all data, just let real-time listener handle it
      } catch (error) {
        console.error("? Error completing order:", error);
        toast.error("Fehler beim Abschlie�en der Bestellung");
      } finally {
        setCompletingOrders((prev) => {
          const newSet = new Set(prev);
          newSet.delete(orderId);
          return newSet;
        });
      }
    },
    [completingOrders]
  );

  // Optimized preparation start without full data reload
  const handleStartPreparing = useCallback(
    async (orderId: string) => {
      if (completingOrders.has(orderId)) return;

      setCompletingOrders((prev) => new Set(prev).add(orderId));

      try {
        await OrderService.updateOrderStatus(orderId, "preparing");
        toast.success("Zubereitung gestartet");

        // Don't reload all data, just let real-time listener handle it
      } catch (error) {
        console.error("? Error starting preparation:", error);
        toast.error("Fehler beim Starten der Zubereitung");
      } finally {
        setCompletingOrders((prev) => {
          const newSet = new Set(prev);
          newSet.delete(orderId);
          return newSet;
        });
      }
    },
    [completingOrders]
  );

  // Memoized utility functions for order priority and formatting
  const getOrderPriority = useCallback((createdAt: unknown) => {
    const now = new Date();
    const orderTime = safeToDateWithFallback(createdAt);
    const diffMinutes = Math.floor(
      (now.getTime() - orderTime.getTime()) / (1000 * 60)
    );

    if (diffMinutes > 20) return "urgent";
    if (diffMinutes > 10) return "high";
    return "normal";
  }, []);

  const getPriorityStyles = useCallback((priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 border-red-300 text-red-800";
      case "high":
        return "bg-orange-100 border-orange-300 text-orange-800";
      default:
        return "bg-blue-100 border-blue-300 text-blue-800";
    }
  }, []);

  const formatWaitTime = useCallback((createdAt: unknown) => {
    const now = new Date();
    const orderTime = safeToDateWithFallback(createdAt);
    const diffMinutes = Math.floor(
      (now.getTime() - orderTime.getTime()) / (1000 * 60)
    );
    return `${diffMinutes} min`;
  }, []);

  const getPriorityText = useCallback((priority: string) => {
    switch (priority) {
      case "urgent":
        return "DRINGEND";
      case "high":
        return "HOCH";
      default:
        return "NORMAL";
    }
  }, []);

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case "pending":
        return "Wartend";
      case "confirmed":
        return "Best�tigt";
      case "preparing":
        return "In Zubereitung";
      default:
        return status;
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "preparing":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }, []);

  // Extract OrderCard as a memoized component to prevent unnecessary re-renders
  const OrderCard = React.memo(({ order }: { order: OrderWithItem }) => {
    const priority = getOrderPriority(order.createdAt);
    const isCompleting = completingOrders.has(order.id);

    return (
      <div
        className={`
        p-4 rounded-lg border-2 mb-4 transition-all duration-300
        ${getPriorityStyles(priority)}
        ${isCompleting ? "opacity-50 pointer-events-none" : ""}
      `}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            <Hash className="w-4 h-4" />
            <span className="font-semibold">#{order.id}</span>
            <span
              className={`px-2 py-1 rounded text-xs ${getStatusColor(
                order.status
              )}`}
            >
              {getStatusText(order.status)}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="w-4 h-4" />
            <span>{formatWaitTime(order.createdAt)}</span>
            <span className="font-medium">{getPriorityText(priority)}</span>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center space-x-2 mb-1">
            {CATEGORIES.DRINKS.has(order.currentItem.category) ? (
              <Coffee className="w-5 h-5 text-blue-600" />
            ) : (
              <Flame className="w-5 h-5 text-orange-600" />
            )}
            <span className="font-medium">{order.currentItem.name}</span>
          </div>
          <p className="text-sm text-gray-600 ml-7">
            Menge: {order.currentItem.quantity}
          </p>
          {order.currentItem.specialInstructions && (
            <p className="text-sm text-gray-600 ml-7 mt-1">
              Notizen: {order.currentItem.specialInstructions}
            </p>
          )}
        </div>

        <div className="flex space-x-2">
          {order.status === "pending" && (
            <button
              onClick={() => handleStartPreparing(order.id)}
              disabled={isCompleting}
              className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCompleting ? (
                <div className="flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                  Wird gestartet...
                </div>
              ) : (
                <>
                  <ChefHat className="w-4 h-4 mr-1 inline" />
                  Zubereitung starten
                </>
              )}
            </button>
          )}

          {(order.status === "confirmed" || order.status === "preparing") && (
            <button
              onClick={() => handleCompleteItem(order.id)}
              disabled={isCompleting}
              className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCompleting ? (
                <div className="flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                  Wird abgeschlossen...
                </div>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-1 inline" />
                  Abschlie�en
                </>
              )}
            </button>
          )}
        </div>

        <div className="mt-3 text-xs text-gray-500">
          <p>Tisch: {order.tableNumber || "N/A"}</p>
          <p>Kunde: {order.customerName || "N/A"}</p>
          <p>
            Erstellt: {safeToDateWithFallback(order.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    );
  });

  // Ensure the component has a display name for better debugging
  OrderCard.displayName = "OrderCard";

  // Calculate total orders once to avoid recalculation in render
  const totalOrders = useMemo(
    () => drinkOrders.length + shishaOrders.length,
    [drinkOrders.length, shishaOrders.length]
  );

  // Handle loading states
  if (loadingInitial) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center space-x-2 mb-6">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Laden der Bardaten...</span>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  // Handle error states
  if (initialError) {
    return (
      <div className="p-6">
        <ErrorEmptyState
          title="Fehler beim Laden der Daten"
          description={initialError}
          onRetry={reloadInitialData}
          retrying={loadingInitial}
        />
      </div>
    );
  }

  // Handle empty states
  if (isEmpty) {
    return (
      <div className="p-6">
        <NoDataEmptyState
          title="Keine Daten verf�gbar"
          description="Es sind keine Men�daten oder Bestellungen vorhanden."
          onRefresh={reloadInitialData}
          refreshing={loadingInitial}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Barbereich ({totalOrders} Bestellungen)
        </h1>
        <div className="flex items-center space-x-4">
          {loadingRealtime && (
            <div className="flex items-center space-x-2 text-blue-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Aktualisierung...</span>
            </div>
          )}
          <button
            onClick={reloadInitialData}
            disabled={loadingInitial}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${loadingInitial ? "animate-spin" : ""}`}
            />
            <span>Aktualisieren</span>
          </button>
        </div>
      </div>

      {realtimeError && (
        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-md">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-orange-800">
              Echtzeitaktualisierung unterbrochen: {realtimeError}
            </span>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Drinks Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Coffee className="w-6 h-6 mr-2 text-blue-600" />
            Getr�nke ({drinkOrders.length})
          </h2>
          <div className="space-y-4">
            {drinkOrders.length > 0 ? (
              drinkOrders.map((order) => (
                <OrderCard
                  key={`${order.id}-${order.currentItem.menuItemId}`}
                  order={order}
                />
              ))
            ) : (
              <NoDataEmptyState
                title="Keine Getr�nkebestellungen"
                description="Derzeit gibt es keine offenen Getr�nkebestellungen."
              />
            )}
          </div>
        </div>

        {/* Shisha Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Flame className="w-6 h-6 mr-2 text-orange-600" />
            Shisha ({shishaOrders.length})
          </h2>
          <div className="space-y-4">
            {shishaOrders.length > 0 ? (
              shishaOrders.map((order) => (
                <OrderCard
                  key={`${order.id}-${order.currentItem.menuItemId}`}
                  order={order}
                />
              ))
            ) : (
              <NoDataEmptyState
                title="Keine Shisha-Bestellungen"
                description="Derzeit gibt es keine offenen Shisha-Bestellungen."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarOperations;

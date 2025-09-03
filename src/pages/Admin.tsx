import React, { useState, useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { Event } from "../types/event";
import { EventService } from "../services/eventService";
import { AnalyticsService, AnalyticsData } from "../services/analyticsService";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../components/common/LoadingSpinner";
import MenuManagement from "../components/admin/MenuManagement";
import SpecialOfferManagement from "../components/admin/SpecialOfferManagement";
import OrderManagement from "../components/admin/OrderManagement";
import PopupManagement from "../components/admin/PopupManagement";
import ReservationManagement from "../components/admin/ReservationManagement";
import LoyaltyManagement from "../components/admin/LoyaltyManagement";
import { TableManagement } from "../components/admin/TableManagement";
import SimpleLiveTableGrid from "../components/admin/SimpleLiveTableGrid";
import { IntegrationDashboard } from "../components/admin/IntegrationDashboard";
import BarOperations from "../components/admin/BarOperations";
import AdminGDPRDashboard from "../components/gdpr/AdminGDPRDashboard";
import OrderReports from "../components/admin/OrderReports";
import { motion } from "framer-motion";
import { Table } from "../types/reservation";
import { Order, OrderStatus, PaymentStatus } from "../types/order";
import { OrderService } from "../services/orderService";
import {
  Users,
  Calendar,
  BarChart3,
  Settings,
  Crown,
  Activity,
  TrendingUp,
  UserCheck,
  Edit,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  RefreshCw,
  Utensils,
  Tag,
  Package,
  MessageSquare,
  CalendarCheck,
  Grid,
  Monitor,
  Link,
  ChefHat,
  Shield,
  FileText,
  Check,
  Clock,
  CreditCard,
  X,
} from "lucide-react";

const Admin: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isEventsLoading, setIsEventsLoading] = useState(false);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  const [loadingTableDetails, setLoadingTableDetails] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalUsers: 0,
    activeUsers: 0,
    totalEvents: 0,
    activeEvents: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    revenueGrowth: 0,
    newUsersThisMonth: 0,
    activeUsersCount: 0,
    engagementRate: 0,
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    averageOrderValue: 0,
    upcomingEvents: 0,
    totalAttendees: 0,
    eventEngagement: 0,
  });

  const loadEvents = async () => {
    try {
      setIsEventsLoading(true);
      const eventsData = await EventService.getEvents();
      setEvents(eventsData);
    } catch (error) {
      toast.error("Failed to load events");
      console.error("Error loading events:", error);
    } finally {
      setIsEventsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setIsAnalyticsLoading(true);
      const data = await AnalyticsService.getAnalyticsData();
      setAnalyticsData(data);
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const refreshData = async () => {
    await Promise.all([loadEvents(), loadAnalytics()]);
    toast.success("Data refreshed successfully");
  };

  const handleTableClick = async (table: Table) => {
    setSelectedTable(table);
    setLoadingTableDetails(true);

    try {
      // Load orders for this table
      const orders = await OrderService.getOrdersForTable(table.number);
      setTableOrders(orders);
    } catch (error) {
      console.error("Error loading table orders:", error);
      toast.error("Fehler beim Laden der Tischbestellungen");
      setTableOrders([]);
    } finally {
      setLoadingTableDetails(false);
    }
  };

  const handleOrderStatusUpdate = async (
    orderId: string,
    newStatus: string
  ) => {
    try {
      await OrderService.updateOrderStatus(orderId, newStatus as OrderStatus);
      toast.success(`Bestellstatus zu "${newStatus}" geändert`);

      // Reload table orders
      if (selectedTable) {
        const updatedOrders = await OrderService.getOrdersForTable(
          selectedTable.number
        );
        setTableOrders(updatedOrders);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Fehler beim Aktualisieren des Bestellstatus");
    }
  };

  const handlePaymentStatusUpdate = async (
    orderId: string,
    paymentStatus: string
  ) => {
    try {
      await OrderService.updatePaymentStatus(
        orderId,
        paymentStatus as PaymentStatus
      );
      toast.success(`Zahlungsstatus zu "${paymentStatus}" geändert`);

      // Reload table orders
      if (selectedTable) {
        const updatedOrders = await OrderService.getOrdersForTable(
          selectedTable.number
        );
        setTableOrders(updatedOrders);
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error("Fehler beim Aktualisieren des Zahlungsstatus");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (
      !confirm("Sind Sie sicher, dass Sie diese Bestellung löschen möchten?")
    ) {
      return;
    }

    try {
      await OrderService.deleteOrder(orderId);
      toast.success("Bestellung gelöscht");

      // Reload table orders
      if (selectedTable) {
        const updatedOrders = await OrderService.getOrdersForTable(
          selectedTable.number
        );
        setTableOrders(updatedOrders);
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Fehler beim Löschen der Bestellung");
    }
  };

  useEffect(() => {
    // Only load data if user is admin
    if (user && user.role === "admin") {
      loadEvents();
      loadAnalytics();

      // Set up real-time analytics listener
      const unsubscribe = AnalyticsService.onAnalyticsChange((data) => {
        setAnalyticsData(data);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [user]);

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await EventService.deleteEvent(eventId);
        toast.success("Event deleted successfully");
        loadEvents();
      } catch (error) {
        console.error("Error deleting event:", error);
        toast.error("Failed to delete event");
      }
    }
  };

  const handleToggleEventStatus = async (
    eventId: string,
    currentStatus: boolean
  ) => {
    try {
      await EventService.toggleEventStatus(eventId, !currentStatus);
      toast.success(
        `Event ${currentStatus ? "deactivated" : "activated"} successfully`
      );
      loadEvents();
    } catch (error) {
      console.error("Error toggling event status:", error);
      toast.error("Failed to update event status");
    }
  };

  // Check if user is admin
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-royal-charcoal-dark flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 text-royal-gold mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-royal-cream mb-2">
            Access Denied
          </h1>
          <p className="text-royal-cream-light">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  // Organized navigation with grouped categories
  const navigationGroups = [
    {
      title: "HAUPTBEREICH",
      items: [
        { id: "dashboard", name: "Dashboard", icon: BarChart3 },
        {
          id: "live-status",
          name: "Live Tische",
          icon: Monitor,
          priority: true,
        },
        { id: "orders", name: "Bestellungen", icon: Package, priority: true },
        {
          id: "bar-operations",
          name: "Bar Operations",
          icon: ChefHat,
          priority: true,
        },
      ],
    },
    {
      title: "GASTRONOMIE",
      items: [
        { id: "reservations", name: "Reservierungen", icon: CalendarCheck },
        { id: "tables", name: "Tische", icon: Grid },
        { id: "menu", name: "Menü", icon: Utensils },
        { id: "special-offers", name: "Angebote", icon: Tag },
      ],
    },
    {
      title: "KUNDENVERWALTUNG",
      items: [
        { id: "loyalty", name: "Stempelpass", icon: Crown },
        { id: "events", name: "Events", icon: Calendar },
        { id: "users", name: "Benutzer", icon: Users },
      ],
    },
    {
      title: "BERICHTE & ANALYTICS",
      items: [
        { id: "analytics", name: "Analytics", icon: TrendingUp },
        { id: "reports", name: "Berichte", icon: FileText },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        { id: "integration", name: "Integration", icon: Link },
        { id: "popup", name: "Popups", icon: MessageSquare },
        { id: "gdpr", name: "GDPR", icon: Shield },
        { id: "settings", name: "Einstellungen", icon: Settings },
      ],
    },
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-royal-cream">
          Dashboard Overview
        </h2>
        <button
          onClick={refreshData}
          className="flex items-center space-x-2 px-4 py-2 bg-royal-gradient-gold text-royal-charcoal rounded-lg hover:shadow-lg transition-all duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-royal-charcoal p-6 rounded-lg border border-royal-gold/20 royal-glow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-royal-cream-light text-sm">Total Users</p>
              <p className="text-2xl font-bold text-royal-gold">
                {analyticsData.totalUsers}
              </p>
            </div>
            <Users className="w-8 h-8 text-royal-gold" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-royal-charcoal p-6 rounded-lg border border-royal-gold/20 royal-glow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-royal-cream-light text-sm">Active Events</p>
              <p className="text-2xl font-bold text-royal-gold">
                {analyticsData.activeEvents}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-royal-gold" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-royal-charcoal p-6 rounded-lg border border-royal-gold/20 royal-glow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-royal-cream-light text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-royal-gold">
                €{analyticsData.totalRevenue.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-royal-gold" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-royal-charcoal p-6 rounded-lg border border-royal-gold/20 royal-glow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-royal-cream-light text-sm">Monthly Growth</p>
              <p
                className={`text-2xl font-bold ${
                  analyticsData.monthlyGrowth >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {analyticsData.monthlyGrowth >= 0 ? "+" : ""}
                {analyticsData.monthlyGrowth}%
              </p>
            </div>
            <Activity className="w-8 h-8 text-royal-gold" />
          </div>
        </motion.div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-royal-charcoal p-6 rounded-lg border border-royal-gold/20 royal-glow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-royal-cream-light text-sm">Total Orders</p>
              <p className="text-xl font-bold text-royal-gold">
                {analyticsData.totalOrders}
              </p>
            </div>
            <Package className="w-6 h-6 text-royal-gold" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-royal-charcoal p-6 rounded-lg border border-royal-gold/20 royal-glow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-royal-cream-light text-sm">Avg Order Value</p>
              <p className="text-xl font-bold text-royal-gold">
                €{analyticsData.averageOrderValue.toFixed(2)}
              </p>
            </div>
            <BarChart3 className="w-6 h-6 text-royal-gold" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-royal-charcoal p-6 rounded-lg border border-royal-gold/20 royal-glow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-royal-cream-light text-sm">Event Attendees</p>
              <p className="text-xl font-bold text-royal-gold">
                {analyticsData.totalAttendees}
              </p>
            </div>
            <Users className="w-6 h-6 text-royal-gold" />
          </div>
        </motion.div>
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-royal-cream">
          Event Management
        </h2>
        <button className="flex items-center space-x-2 px-4 py-2 bg-royal-gradient-gold text-royal-charcoal rounded-lg hover:shadow-lg transition-all duration-200">
          <Plus className="w-4 h-4" />
          <span>Create Event</span>
        </button>
      </div>

      {isEventsLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-royal-charcoal rounded-lg border border-royal-gold/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-royal-charcoal-dark">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-royal-gold uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-royal-gold uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-royal-gold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-royal-gold uppercase tracking-wider">
                    Attendees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-royal-gold uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-royal-gold/10">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-royal-charcoal-dark">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-royal-cream">
                          {event.title}
                        </div>
                        <div className="text-sm text-royal-cream-light">
                          {event.location}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-royal-cream">
                      {new Date(event.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          event.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {event.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-royal-cream">
                      {event.attendees?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            handleToggleEventStatus(event.id, event.isActive)
                          }
                          className="text-royal-gold hover:text-royal-cream"
                        >
                          {event.isActive ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button className="text-blue-400 hover:text-blue-300">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-royal-cream">User Management</h2>
        <button className="flex items-center space-x-2 px-4 py-2 bg-royal-gradient-gold text-royal-charcoal rounded-lg hover:shadow-lg transition-all duration-200">
          <UserCheck className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      <div className="bg-royal-charcoal rounded-lg border border-royal-gold/20 p-6">
        <p className="text-royal-cream-light">
          User management functionality will be implemented here. This will
          include:
        </p>
        <ul className="mt-4 space-y-2 text-royal-cream-light">
          <li>• View all registered users</li>
          <li>• Manage user roles and permissions</li>
          <li>• Ban/unban users</li>
          <li>• View user activity and statistics</li>
        </ul>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-royal-cream">
          Analytics & Reports
        </h2>
        <button
          onClick={refreshData}
          className="flex items-center space-x-2 px-4 py-2 bg-royal-gradient-gold text-royal-charcoal rounded-lg hover:shadow-lg transition-all duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {isAnalyticsLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-royal-charcoal p-6 rounded-lg border border-royal-gold/20 royal-glow">
              <h3 className="text-lg font-semibold text-royal-cream mb-4">
                Revenue Analytics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-royal-cream-light">This Month</span>
                  <span className="text-royal-gold font-semibold">
                    €{analyticsData.thisMonthRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-royal-cream-light">Last Month</span>
                  <span className="text-royal-gold font-semibold">
                    €{analyticsData.lastMonthRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-royal-cream-light">Growth</span>
                  <span
                    className={`font-semibold ${
                      analyticsData.revenueGrowth >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {analyticsData.revenueGrowth >= 0 ? "+" : ""}
                    {analyticsData.revenueGrowth}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-royal-charcoal p-6 rounded-lg border border-royal-gold/20 royal-glow">
              <h3 className="text-lg font-semibold text-royal-cream mb-4">
                User Analytics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-royal-cream-light">
                    New Users (30d)
                  </span>
                  <span className="text-royal-gold font-semibold">
                    +{analyticsData.newUsersThisMonth}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-royal-cream-light">Active Users</span>
                  <span className="text-royal-gold font-semibold">
                    {analyticsData.activeUsersCount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-royal-cream-light">
                    Engagement Rate
                  </span>
                  <span className="text-green-400 font-semibold">
                    {analyticsData.engagementRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Analytics Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-royal-charcoal p-6 rounded-lg border border-royal-gold/20 royal-glow">
              <h3 className="text-lg font-semibold text-royal-cream mb-4">
                Order Analytics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-royal-cream-light">Total Orders</span>
                  <span className="text-royal-gold font-semibold">
                    {analyticsData.totalOrders}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-royal-cream-light">Pending Orders</span>
                  <span className="text-yellow-400 font-semibold">
                    {analyticsData.pendingOrders}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-royal-cream-light">
                    Delivered Orders
                  </span>
                  <span className="text-green-400 font-semibold">
                    {analyticsData.deliveredOrders}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-royal-cream-light">
                    Average Order Value
                  </span>
                  <span className="text-royal-gold font-semibold">
                    €{analyticsData.averageOrderValue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-royal-charcoal p-6 rounded-lg border border-royal-gold/20 royal-glow">
              <h3 className="text-lg font-semibold text-royal-cream mb-4">
                Event Analytics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-royal-cream-light">Total Events</span>
                  <span className="text-royal-gold font-semibold">
                    {analyticsData.totalEvents}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-royal-cream-light">
                    Upcoming Events
                  </span>
                  <span className="text-blue-400 font-semibold">
                    {analyticsData.upcomingEvents}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-royal-cream-light">
                    Total Attendees
                  </span>
                  <span className="text-royal-gold font-semibold">
                    {analyticsData.totalAttendees}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-royal-cream-light">
                    Event Engagement
                  </span>
                  <span className="text-green-400 font-semibold">
                    {analyticsData.eventEngagement.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-royal-cream">System Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-royal-charcoal p-6 rounded-lg border border-royal-gold/20">
          <h3 className="text-lg font-semibold text-royal-cream mb-4">
            General Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-royal-cream-light mb-2">
                Site Name
              </label>
              <input
                type="text"
                defaultValue="Royal Shisha Bar"
                className="w-full px-3 py-2 bg-royal-charcoal-dark border border-royal-gold/30 rounded-lg text-royal-cream focus:outline-none focus:border-royal-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-royal-cream-light mb-2">
                Contact Email
              </label>
              <input
                type="email"
                defaultValue="Royal.Waldkraiburg@gmail.com"
                className="w-full px-3 py-2 bg-royal-charcoal-dark border border-royal-gold/30 rounded-lg text-royal-cream focus:outline-none focus:border-royal-gold"
              />
            </div>
            <button className="w-full px-4 py-2 bg-royal-gradient-gold text-royal-charcoal rounded-lg hover:shadow-lg transition-all duration-200">
              Save Changes
            </button>
          </div>
        </div>

        <div className="bg-royal-charcoal p-6 rounded-lg border border-royal-gold/20">
          <h3 className="text-lg font-semibold text-royal-cream mb-4">
            Security Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-royal-cream-light">
                Two-Factor Authentication
              </span>
              <button className="w-12 h-6 bg-royal-gold rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-royal-cream-light">
                Email Notifications
              </span>
              <button className="w-12 h-6 bg-royal-gold rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-royal-cream-light">Maintenance Mode</span>
              <button className="w-12 h-6 bg-gray-600 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMenu = () => (
    <div className="space-y-6">
      <MenuManagement />
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return renderDashboard();
      case "reservations":
        return <ReservationManagement />;
      case "tables":
        return <TableManagement />;
      case "live-status":
        return <SimpleLiveTableGrid onTableClick={handleTableClick} />;
      case "integration":
        return <IntegrationDashboard />;
      case "events":
        return renderEvents();
      case "users":
        return renderUsers();
      case "loyalty":
        return <LoyaltyManagement />;
      case "analytics":
        return renderAnalytics();
      case "gdpr":
        return <AdminGDPRDashboard />;
      case "settings":
        return renderSettings();
      case "menu":
        return renderMenu();
      case "special-offers":
        return <SpecialOfferManagement />;
      case "orders":
        return <OrderManagement />;
      case "reports":
        return <OrderReports />;
      case "bar-operations":
        return <BarOperations />;
      case "popup":
        return <PopupManagement />;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-royal-charcoal-dark">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 bg-royal-charcoal min-h-screen border-r border-royal-gold/20 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <Crown className="w-8 h-8 text-royal-gold" />
              <h1 className="text-xl font-bold text-royal-cream">
                Admin Panel
              </h1>
            </div>

            <nav className="space-y-6">
              {navigationGroups.map((group) => (
                <div key={group.title}>
                  <h3 className="text-xs font-semibold text-royal-gold/80 uppercase tracking-wider mb-3 px-2">
                    {group.title}
                  </h3>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      const isPriority = item.priority;

                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                            isActive
                              ? "bg-royal-gradient-gold text-royal-charcoal shadow-lg"
                              : isPriority
                              ? "text-royal-cream bg-royal-charcoal-dark/50 hover:bg-royal-charcoal-dark border border-royal-gold/20"
                              : "text-royal-cream/80 hover:bg-royal-charcoal-dark hover:text-royal-cream"
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${
                              isPriority && !isActive ? "text-royal-gold" : ""
                            }`}
                          />
                          <span
                            className={`${
                              isPriority && !isActive ? "font-medium" : ""
                            }`}
                          >
                            {item.name}
                          </span>
                          {isPriority && !isActive && (
                            <div className="ml-auto w-2 h-2 bg-royal-gold rounded-full animate-pulse"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">{renderContent()}</div>
        </div>
      </div>

      {/* Table Details Modal */}
      {selectedTable && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTable(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                <span className="mr-3">🪑</span>
                Tisch {selectedTable.number} Details
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleTableClick(selectedTable)}
                  disabled={loadingTableDetails}
                  className="p-2 hover:bg-blue-50 rounded-xl transition-colors text-blue-600 disabled:opacity-50"
                  title="Daten aktualisieren"
                >
                  <RefreshCw
                    className={`w-5 h-5 ${
                      loadingTableDetails ? "animate-spin" : ""
                    }`}
                  />
                </button>
                <button
                  onClick={() => setSelectedTable(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <svg
                    className="w-6 h-6 text-slate-400"
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
            </div>

            {/* Table Info */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-50 p-4 rounded-xl">
                <h3 className="font-semibold text-slate-700 mb-2">
                  Tisch Informationen
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Kapazität:</span>
                    <span className="font-medium text-black">
                      {selectedTable.capacity} Personen
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Bereich:</span>
                    <span className="font-medium text-black">
                      {selectedTable.location === "vip"
                        ? "VIP"
                        : selectedTable.location === "outdoor"
                        ? "Außenbereich"
                        : "Innenbereich"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Preismultiplikator:</span>
                    <span className="font-medium text-black">
                      {selectedTable.priceMultiplier}x
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl">
                <h3 className="font-semibold text-slate-700 mb-2">Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Aktiv:</span>
                    <span
                      className={`font-medium ${
                        selectedTable.isActive
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {selectedTable.isActive ? "Ja" : "Nein"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Bestellungen:</span>
                    <span className="font-medium text-black">
                      {tableOrders.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Orders Section */}
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <span className="mr-2">📋</span>
                Aktuelle Bestellungen
              </h3>

              {loadingTableDetails ? (
                <div className="text-center py-8">
                  <LoadingSpinner />
                  <p className="text-slate-600 mt-2">Lade Bestellungen...</p>
                </div>
              ) : tableOrders.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl">
                  <span className="text-4xl mb-2 block">🍽️</span>
                  <p className="text-slate-600">Keine aktiven Bestellungen</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {tableOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-sm"
                    >
                      {/* Order Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="font-bold text-slate-800 text-lg">
                            Bestellung #{order.id.slice(-6)}
                          </span>
                          <span
                            className={`ml-3 px-3 py-1 rounded-full text-sm font-medium ${
                              order.status === "delivered"
                                ? order.payment?.status === "unpaid" ||
                                  order.payment?.status === "partial"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {order.status === "delivered"
                              ? order.payment?.status === "unpaid" ||
                                order.payment?.status === "partial"
                                ? "💳 Zu bezahlen"
                                : "✅ Bezahlt"
                              : "🍽️ In Bearbeitung"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-800 text-xl">
                            €{order.totalAmount.toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="ml-3 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Bestellung löschen"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-slate-600">
                        <div>
                          <strong>Erstellt:</strong>{" "}
                          {order.createdAt.toLocaleString("de-DE")}
                        </div>
                        <div>
                          <strong>Items:</strong> {order.items.length} Artikel
                        </div>
                        <div>
                          <strong>Status:</strong> {order.status}
                        </div>
                        <div>
                          <strong>Zahlung:</strong>{" "}
                          {order.payment?.status || "unpaid"}
                        </div>
                      </div>

                      {order.specialInstructions && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <strong className="text-blue-800">
                            Anweisungen:
                          </strong>
                          <p className="text-blue-700 mt-1">
                            {order.specialInstructions}
                          </p>
                        </div>
                      )}

                      {/* Order Items */}
                      <div className="mb-4">
                        <h5 className="font-semibold text-slate-700 mb-2">
                          Bestellte Artikel:
                        </h5>
                        <div className="space-y-1">
                          {order.items.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between text-sm"
                            >
                              <span>
                                {item.quantity}x {item.name}
                              </span>
                              <span>
                                €{(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="border-t pt-4">
                        <div className="flex flex-wrap gap-2">
                          {/* Order Status Buttons */}
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className="text-sm font-medium text-slate-600 self-center mr-2">
                              Bestellstatus:
                            </span>
                            {order.status !== "pending" && (
                              <button
                                onClick={() =>
                                  handleOrderStatusUpdate(order.id, "pending")
                                }
                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center"
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                Ausstehend
                              </button>
                            )}
                            {order.status !== "confirmed" && (
                              <button
                                onClick={() =>
                                  handleOrderStatusUpdate(order.id, "confirmed")
                                }
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm flex items-center"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Bestätigt
                              </button>
                            )}
                            {order.status !== "preparing" && (
                              <button
                                onClick={() =>
                                  handleOrderStatusUpdate(order.id, "preparing")
                                }
                                className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm flex items-center"
                              >
                                <ChefHat className="w-3 h-3 mr-1" />
                                Zubereitung
                              </button>
                            )}
                            {order.status !== "ready" && (
                              <button
                                onClick={() =>
                                  handleOrderStatusUpdate(order.id, "ready")
                                }
                                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm flex items-center"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Bereit
                              </button>
                            )}
                            {order.status !== "delivered" && (
                              <button
                                onClick={() =>
                                  handleOrderStatusUpdate(order.id, "delivered")
                                }
                                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm flex items-center"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Geliefert
                              </button>
                            )}
                          </div>

                          {/* Payment Status Buttons */}
                          {order.status === "delivered" && (
                            <div className="flex flex-wrap gap-2 w-full">
                              <span className="text-sm font-medium text-slate-600 self-center mr-2">
                                Zahlung:
                              </span>
                              {order.payment?.status !== "paid" && (
                                <button
                                  onClick={() =>
                                    handlePaymentStatusUpdate(order.id, "paid")
                                  }
                                  className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm flex items-center"
                                >
                                  <CreditCard className="w-3 h-3 mr-1" />
                                  Als bezahlt markieren
                                </button>
                              )}
                              {order.payment?.status !== "partial" && (
                                <button
                                  onClick={() =>
                                    handlePaymentStatusUpdate(
                                      order.id,
                                      "partial"
                                    )
                                  }
                                  className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm flex items-center"
                                >
                                  <CreditCard className="w-3 h-3 mr-1" />
                                  Teilweise bezahlt
                                </button>
                              )}
                              {order.payment?.status !== "unpaid" && (
                                <button
                                  onClick={() =>
                                    handlePaymentStatusUpdate(
                                      order.id,
                                      "unpaid"
                                    )
                                  }
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm flex items-center"
                                >
                                  <CreditCard className="w-3 h-3 mr-1" />
                                  Unbezahlt
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Admin;

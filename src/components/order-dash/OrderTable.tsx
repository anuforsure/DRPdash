import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MoreVertical,
  Flag,
  Pencil,
  MapPin,
  Phone,
  Store,
  Plane,
  ChevronDown,
  Package,
  Loader2,
  Printer,
  Box,
  XCircle,
  CheckCircle2,
} from "lucide-react";

// --- Types / Interfaces ---
export interface OrderTableProps {
  orders: any[];
  isLoading: boolean;
  page: number;
  limit: number;
  selectedOrders: string[];
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectOne: (orderId: string) => void;
  onEditOrder: (order: any) => void;
  onViewStatus: (statusList: any[]) => void;
  onShipNow: (order: any) => Promise<void>;
  onPickup: (order: any) => void;
  onPrintLabel: (labelData: any) => void;
  onAutoBook: (orders: any[]) => void;
  onCancelOrder: (orderId: string) => void;
}

// --- Modern Skeleton Loader (Deepened Neutrals) ---
const SkeletonRow = () => (
  <tr className="border-b border-slate-100 animate-pulse bg-white">
    <td className="p-4">
      <div className="h-4 w-4 bg-slate-200 rounded"></div>
    </td>
    <td className="p-4">
      <div className="h-4 w-24 bg-slate-200 rounded mb-2"></div>
      <div className="h-3 w-32 bg-slate-100 rounded"></div>
    </td>
    <td className="p-4">
      <div className="h-16 w-full bg-slate-100/80 rounded-xl border border-slate-200"></div>
    </td>
    <td className="p-4">
      <div className="h-4 w-28 bg-slate-200 rounded mb-2"></div>
      <div className="h-3 w-40 bg-slate-100 rounded"></div>
    </td>
    <td className="p-4">
      <div className="h-6 w-20 bg-slate-100 rounded-full mb-2"></div>
      <div className="h-4 w-24 bg-slate-100 rounded"></div>
    </td>
    <td className="p-4">
      <div className="h-6 w-24 bg-slate-100 rounded-md"></div>
    </td>
    <td className="p-4">
      <div className="h-8 w-20 bg-slate-200 rounded-lg float-right"></div>
    </td>
  </tr>
);

const OrdersTable: React.FC<OrderTableProps> = ({
  orders,
  isLoading,
  selectedOrders,
  onSelectAll,
  onSelectOne,
  onEditOrder,
  onViewStatus,
  onShipNow,
  onPickup,
  onPrintLabel,
  onAutoBook,
  onCancelOrder,
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [shipLoading, setShipLoading] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const tableRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tableRef.current &&
        !tableRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleItems = (orderId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(orderId)) newExpanded.delete(orderId);
    else newExpanded.add(orderId);
    setExpandedItems(newExpanded);
  };

  const handleShipNow = async (order: any) => {
    setShipLoading(order._id);
    await onShipNow(order);
    setShipLoading(null);
  };

  // Deepened badge colors for better contrast against white rows
  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("new") || s.includes("open"))
      return "bg-blue-100/60 text-blue-700 border-blue-200";
    if (s.includes("delivered"))
      return "bg-emerald-100/60 text-emerald-700 border-emerald-200";
    if (s.includes("transit") || s.includes("shipped"))
      return "bg-indigo-100/60 text-indigo-700 border-indigo-200";
    if (s.includes("cancelled") || s.includes("rto"))
      return "bg-red-100/60 text-red-700 border-red-200";
    return "bg-slate-100 text-slate-700 border-slate-300";
  };

  const isAllSelected =
    selectedOrders.length === orders.length && orders.length > 0;

  return (
    <div
      ref={tableRef}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-visible min-h-125">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {/* Darker, structured neutral header to anchor the table */}
            <tr className="bg-slate-100/80 text-slate-600 text-[11px] uppercase tracking-wider font-bold border-b-2 border-slate-200">
              <th className="p-4 text-center w-12">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-[#F5891E] focus:ring-[#F5891E] transition-colors cursor-pointer"
                  checked={isAllSelected}
                  onChange={onSelectAll}
                  disabled={isLoading || orders.length === 0}
                />
              </th>
              <th className="p-4 w-[12%]">Order Info</th>
              <th className="p-4 w-[25%]">Items & Value</th>
              <th className="p-4 w-[20%]">Customer Details</th>
              <th className="p-4 w-[15%]">Status & Shipping</th>
              <th className="p-4 w-[15%]">Risk Flags</th>
              <th className="p-4 text-right pr-6 w-[13%]">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-24">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <div className="bg-slate-50 p-4 rounded-full mb-4 border border-slate-100">
                      <Package size={40} className="opacity-50 stroke-1" />
                    </div>
                    <h5 className="text-lg font-semibold text-slate-700 mb-1">
                      No orders found
                    </h5>
                    <p className="text-sm text-slate-500">
                      Adjust your filters or tab selection to see results.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const isChecked = selectedOrders.includes(order._id);
                const statusName =
                  order.latest_status?.toUpperCase() ||
                  order.order_status?.toUpperCase() ||
                  "NEW";
                const issues = order.issues || [];
                const hasRedFlags =
                  issues.length > 0 ||
                  !order.customer_phone ||
                  !order.shipping_pincode;
                const itemsList = order.items || [];
                const hasMultipleItems = itemsList.length > 1;
                const isItemsExpanded = expandedItems.has(order._id);

                return (
                  <tr
                    key={order._id}
                    // Added a structural left border highlight when selected
                    className={`border-b border-slate-100 transition-all duration-200 group relative ${
                      isChecked
                        ? "bg-orange-50/50"
                        : "bg-white hover:bg-slate-50/60"
                    }`}>
                    {isChecked && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F5891E]"></div>
                    )}

                    {/* 1. Checkbox */}
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-[#F5891E] focus:ring-[#F5891E] transition-colors cursor-pointer"
                        checked={isChecked}
                        onChange={() => onSelectOne(order._id)}
                      />
                    </td>

                    {/* 2. Order Info */}
                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-bold text-slate-900 text-sm tracking-tight">
                          #{order.order_id || order.channel_order_id}
                        </span>
                        <span className="text-slate-500 text-[12px] font-medium">
                          {new Date(
                            order.order_date || order.createdAt,
                          ).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>

                        <div className="flex items-center gap-2 mt-1.5 px-2.5 py-2 rounded-lg w-max border border-slate-200 bg-slate-50">
                          <Store
                            size={13}
                            className="text-[#F5891E] flex-shrink-0"
                          />
                          <div className="flex flex-col leading-snug">
                            <span className="text-[12px] font-semibold text-slate-800">
                              {order.channel_account?.channel_account_name ||
                                "Manual Store"}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400">
                                Pool:
                              </span>
                              <span className="text-[10px] font-semibold text-[#F5891E]">
                                {order.channel_account?.pool_id || "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 3. Items & Value (Nested Card Design) */}
                    <td className="p-4 align-top">
                      <div className="flex flex-col bg-slate-50 rounded-xl p-3.5 border border-slate-200 shadow-sm inner-glow">
                        {/* Single Item View */}
                        {!hasMultipleItems && itemsList.length > 0 && (
                          <div className="flex flex-col gap-1.5 mb-3 pb-3 border-b border-slate-200/80">
                            <span
                              className="font-semibold text-slate-800 text-xs truncate"
                              title={itemsList[0].product?.product_sku_name}>
                              {itemsList[0].product?.product_sku_name ||
                                "Unknown Product"}
                            </span>

                            <div className="flex justify-between items-center text-slate-500 text-[11px]">
                              <span className="italic text-slate-500">
                                {itemsList[0].product?.product_sku_id || "N/A"}
                              </span>

                              <span className="font-bold bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm text-slate-700">
                                Qty: {itemsList[0].quantity}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Multiple Items Accordion View */}
                        {hasMultipleItems && (
                          <div className="flex flex-col mb-3 pb-3 border-b border-slate-200/80">
                            <div
                              className="flex justify-between items-center cursor-pointer p-2 -mx-2 rounded-lg hover:bg-slate-200/50 transition-colors"
                              onClick={() => toggleItems(order._id)}>
                              <div className="flex items-center gap-2">
                                <Package size={14} className="text-[#F5891E]" />

                                <span className="font-bold text-[#F5891E] text-xs">
                                  {itemsList.length} Items in Order
                                </span>
                              </div>

                              <motion.div
                                animate={{ rotate: isItemsExpanded ? 180 : 0 }}
                                transition={{
                                  type: "spring",
                                  bounce: 0.3,
                                  duration: 0.4,
                                }}
                                className="text-slate-500 bg-white shadow-sm border border-slate-200 rounded-full p-0.5">
                                <ChevronDown size={14} />
                              </motion.div>
                            </div>

                            <AnimatePresence initial={false}>
                              {isItemsExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{
                                    type: "spring",
                                    bounce: 0,
                                    duration: 0.3,
                                  }}
                                  className="overflow-hidden">
                                  <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 flex flex-col gap-2 max-h-50 overflow-y-auto custom-scrollbar">
                                    {itemsList.map((item: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className="flex flex-col p-2.5 bg-white rounded-lg border border-slate-200 shadow-sm">
                                        <span className="font-semibold text-slate-800 text-[11px] leading-snug mb-1.5">
                                          {item.product?.product_sku_name ||
                                            "Unknown Product"}
                                        </span>

                                        <div className="flex justify-between items-center text-slate-500 text-[10px]">
                                          <span className="font-medium">
                                            {item.product?.product_sku_id ||
                                              "No SKU"}
                                          </span>

                                          <span className="font-bold text-slate-900 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                                            x{item.quantity}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* Empty State */}
                        {itemsList.length === 0 && (
                          <span className="text-slate-400 italic text-xs font-medium mb-3">
                            No items found
                          </span>
                        )}

                        {/* Amount & Payment Section */}
                        <div className="flex justify-between items-center pt-2.5 border-t border-slate-200/80">
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                            Amount:
                            <span className="font-bold text-[15px] text-slate-900">
                              ₹{order.total_amount}
                            </span>
                          </span>

                          <span className="px-2 py-0.5 bg-white border border-slate-300 rounded text-[10px] uppercase font-bold text-slate-600 tracking-wider shadow-sm">
                            {order.payment_method?.length > 15
                              ? `${order.payment_method.slice(0, 15)}...`
                              : order.payment_method}
                          </span>
                        </div>
                      </div>
                    </td>
                    {/* 4. Customer Info */}
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-slate-900 text-sm truncate max-w-40">
                          {order.customer_name}
                        </span>
                        <button
                          onClick={() => onEditOrder(order)}
                          className="p-1 rounded-full text-slate-400 hover:text-[#F5891E] hover:bg-orange-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Edit Customer">
                          <Pencil size={13} />
                        </button>
                      </div>
                      <div className="flex flex-col gap-2 text-slate-600 text-xs font-medium">
                        <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded px-2 py-1 w-max">
                          <Phone size={12} className="text-slate-400" />
                          {order.customer_phone || "No Phone"}
                        </span>
                        <span className="flex items-start gap-1.5 max-w-50">
                          <MapPin
                            size={12}
                            className="mt-0.5 text-slate-400 shrink-0"
                          />
                          <span className="leading-snug text-slate-500">
                            {order.shipping_city}, {order.shipping_state} <br />
                            <span className="font-bold text-slate-700">
                              {order.shipping_pincode}
                            </span>
                          </span>
                        </span>
                      </div>
                    </td>

                    {/* 5. Status & Courier */}
                    <td className="p-4 align-top">
                      <div className="flex flex-col items-start gap-2.5">
                        <button
                          onClick={() => onViewStatus(order.status)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide border shadow-sm ${getStatusStyle(
                            statusName,
                          )} hover:opacity-80 transition-opacity`}>
                          {statusName}
                        </button>

                        {order.awb_number ? (
                          <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 mt-1 text-xs shadow-sm">
                            <span className="text-slate-500 font-medium">
                              AWB:{" "}
                            </span>
                            <Link
                              to={`/customer/track/${order._id}`}
                              className="font-bold text-[#F5891E] hover:underline">
                              {order.awb_number}
                            </Link>
                          </div>
                        ) : order.recomended_courier_id ? (
                          <div className="flex items-center gap-1.5 text-orange-700 bg-orange-50 px-2.5 py-1.5 rounded-lg border border-orange-200 mt-1 text-[11px] font-bold shadow-sm">
                            <Plane size={12} /> Rec:{" "}
                            {order.recomended_courier_id}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px] mt-1 px-1 font-medium">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 6. Risk Flags */}
                    <td className="p-4 align-top">
                      <div className="flex flex-wrap gap-2 max-w-40">
                        {hasRedFlags ? (
                          <>
                            {issues.map((issue: any, idx: number) => (
                              <span
                                key={idx}
                                className="flex items-center gap-1 bg-red-100/80 text-red-700 border border-red-200 px-2 py-1 rounded-md text-[10px] font-bold tracking-wide shadow-sm">
                                <Flag size={10} />{" "}
                                {issue.message || "Action Required"}
                              </span>
                            ))}
                            {!order.customer_phone && (
                              <span className="bg-red-100/80 text-red-700 border border-red-200 px-2 py-1 rounded-md text-[10px] font-bold tracking-wide shadow-sm">
                                Missing Phone
                              </span>
                            )}
                            {!order.shipping_pincode && (
                              <span className="bg-red-100/80 text-red-700 border border-red-200 px-2 py-1 rounded-md text-[10px] font-bold tracking-wide shadow-sm">
                                Missing ZIP
                              </span>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-200 text-[11px] font-bold shadow-sm">
                            <CheckCircle2 size={14} /> Clear to Ship
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 7. Actions */}
                    <td className="p-4 align-top text-right pr-6">
                      <div className="flex items-center justify-end gap-2.5 relative">
                        {order.awb_number ? (
                          <button
                            onClick={() => onPickup(order)}
                            className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-700 bg-white border border-slate-300 shadow-sm hover:bg-slate-50 hover:border-slate-400 transition-all">
                            Pickup
                          </button>
                        ) : (
                          <button
                            onClick={() => handleShipNow(order)}
                            className="w-24 h-8 flex items-center justify-center rounded-full text-xs font-bold text-white bg-linear-to-r from-[#F5891E] to-[#FF6B35] shadow-[0_2px_10px_rgba(245,137,30,0.3)] hover:shadow-[0_4px_14px_rgba(245,137,30,0.4)] transition-all hover:-translate-y-0.5 active:translate-y-0">
                            {shipLoading === order._id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              "Ship Now"
                            )}
                          </button>
                        )}

                        {/* Custom Dropdown */}
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActiveDropdown(
                                activeDropdown === order._id ? null : order._id,
                              )
                            }
                            className="p-1.5 rounded-md text-slate-400 border border-transparent hover:border-slate-200 hover:text-slate-700 hover:bg-slate-50 transition-all shadow-sm hover:shadow">
                            <MoreVertical size={18} />
                          </button>

                          <AnimatePresence>
                            {activeDropdown === order._id && (
                              <motion.div
                                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
                                <div className="py-1">
                                  {order.awb_number ? (
                                    <button
                                      onClick={() => {
                                        onPrintLabel(order.label);
                                        setActiveDropdown(null);
                                      }}
                                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold transition-colors">
                                      <Printer
                                        size={16}
                                        className="text-slate-400"
                                      />{" "}
                                      Print Label
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        onAutoBook([order]);
                                        setActiveDropdown(null);
                                      }}
                                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold transition-colors">
                                      <Box
                                        size={16}
                                        className="text-slate-400"
                                      />{" "}
                                      Auto Book
                                    </button>
                                  )}
                                  <div className="h-px bg-slate-100 my-1"></div>
                                  <button
                                    onClick={() => {
                                      onCancelOrder(order._id);
                                      setActiveDropdown(null);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-semibold transition-colors">
                                    <XCircle
                                      size={16}
                                      className="text-red-500"
                                    />{" "}
                                    Cancel Order
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersTable;

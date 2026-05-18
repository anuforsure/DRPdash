import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Package,
  Truck,
  Clock3,
  CheckCircle2,
  MapPin,
  CalendarDays,
} from "lucide-react";

interface GeoLocation {
  lat?: number;
  long?: number;
}

interface StatusDetails {
  Instructions?: string;
  Scan?: string;
  ScanDateTime?: string;
  ScanType?: string;
  ScannedLocation?: string;
  StatusCode?: string;
  StatusDateTime?: string;
  geo_location?: GeoLocation;
}

interface OrderStatusItem {
  _id: string;
  status: string;
  status_date: string;
  status_details?: StatusDetails | null;
}

interface OrderStatusModalProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  status: OrderStatusItem[];
}

const getStatusIcon = (status: string) => {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("delivered") ||
    normalized.includes("manifested")
  ) {
    return <CheckCircle2 className="h-5 w-5" />;
  }

  if (
    normalized.includes("transit") ||
    normalized.includes("dispatch") ||
    normalized.includes("pickup")
  ) {
    return <Truck className="h-5 w-5" />;
  }

  if (normalized.includes("pending")) {
    return <Clock3 className="h-5 w-5" />;
  }

  return <Package className="h-5 w-5" />;
};

const getStatusColor = (status: string) => {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("delivered") ||
    normalized.includes("manifested")
  ) {
    return "bg-green-100 text-green-600 border-green-200";
  }

  if (
    normalized.includes("transit") ||
    normalized.includes("dispatch") ||
    normalized.includes("pickup")
  ) {
    return "bg-[#F5891E]/10 text-[#F5891E] border-[#F5891E]/20";
  }

  if (normalized.includes("pending")) {
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  }

  return "bg-neutral-100 text-neutral-600 border-neutral-200";
};

const formatDate = (date?: string) => {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const OrderStatusModal: React.FC<OrderStatusModalProps> = ({
  open,
  setOpen,
  status,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="fixed left-1/2 top-1/2 z-50 w-[95%] max-w-3xl -translate-x-1/2 -translate-y-1/2"
          >
            <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-5">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">
                    Shipment Timeline
                  </h2>

                  <p className="mt-1 text-sm text-neutral-500">
                    Track all shipment activities and scan updates
                  </p>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:bg-neutral-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Timeline */}
             <div className="max-h-[75vh] overflow-y-auto scrollbar-hide px-6 py-6">
                <div className="relative">
                  {/* Vertical Line */}
                <div className="absolute left-5 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-neutral-200" />

                  <div className="space-y-6">
                    {[...status]
                      .sort(
                        (a, b) =>
                          new Date(b.status_date).getTime() -
                          new Date(a.status_date).getTime()
                      )
                      .map((item, index) => (
                        <motion.div
                          key={item._id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: index * 0.05,
                          }}
                          className="relative flex gap-4"
                        >
                          {/* Icon */}
                          <div
                            className={`relative z-10 flex h-11 w-11 shrink-0 bg-white items-center justify-center rounded-full border ${getStatusColor(
                              item.status
                            )}`}
                          >
                            {getStatusIcon(item.status)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div>
                                <h3 className="text-base font-semibold text-neutral-900">
                                  {item.status}
                                </h3>

                                {item.status_details?.Instructions && (
                                  <p className="mt-1 text-sm text-neutral-600">
                                    {item.status_details.Instructions}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-sm text-neutral-500">
                                <CalendarDays className="h-4 w-4" />

                                <span>
                                  {formatDate(item.status_date)}
                                </span>
                              </div>
                            </div>

                            {/* Details Grid */}
                            {item.status_details && (
                              <div className="mt-4 grid gap-3 md:grid-cols-2">
                                {item.status_details.Scan && (
                                  <div className="rounded-xl bg-white p-3">
                                    <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                                      Scan
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-neutral-800">
                                      {item.status_details.Scan}
                                    </p>
                                  </div>
                                )}

                                {item.status_details.StatusCode && (
                                  <div className="rounded-xl bg-white p-3">
                                    <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                                      Status Code
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-neutral-800">
                                      {item.status_details.StatusCode}
                                    </p>
                                  </div>
                                )}

                                {item.status_details.ScannedLocation && (
                                  <div className="rounded-xl bg-white p-3 md:col-span-2">
                                    <div className="flex items-start gap-2">
                                      <MapPin className="mt-0.5 h-4 w-4 text-[#F5891E]" />

                                      <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                                          Location
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-neutral-800">
                                          {
                                            item.status_details
                                              .ScannedLocation
                                          }
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {item.status_details.ScanDateTime && (
                                  <div className="rounded-xl bg-white p-3">
                                    <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                                      Scan Time
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-neutral-800">
                                      {formatDate(
                                        item.status_details.ScanDateTime
                                      )}
                                    </p>
                                  </div>
                                )}

                                {item.status_details.ScanType && (
                                  <div className="rounded-xl bg-white p-3">
                                    <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                                      Scan Type
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-neutral-800">
                                      {item.status_details.ScanType}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OrderStatusModal;
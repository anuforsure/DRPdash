"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/customer/CustomerLayout";
import {
  ArrowLeft,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  Copy,
} from "lucide-react";
import { customerAxios } from "../../axios/customerAxios";
import { drpCrmBaseUrl } from "../../axios/urls";

const TrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const { data } = await customerAxios.get(
        `${drpCrmBaseUrl}/customer/orders/tracking/${orderId}`
      );
      setOrder(data.data);
    } catch (err) {
      console.error("Failed to fetch tracking:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [orderId]);

  const trackingData = useMemo(() => {
    if (!order || !order.status)
      return { steps: [], edd: "TBA", currentStatus: "" };

    const sortedStatuses = [...order.status].sort(
      (a, b) =>
        new Date(b.status_date).getTime() - new Date(a.status_date).getTime()
    );

    const steps = sortedStatuses.map((s, index) => ({
      status: s.status.replace(/_/g, " "),
      date: new Date(s.status_date).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      location:
        s.status_details?.origin || s.status_details?.destination || "",
      desc: s.status_details?.courier_name || "Status updated in system",
      completed: true,
      current: index === 0,
    }));

    const eddStatus = order.status.find((s: any) => s.status_details?.edd);
    const edd = eddStatus?.status_details?.edd || "Standard Delivery";

    return { steps, edd, currentStatus: steps[0]?.status || "" };
  }, [order]);

  if (loading)
    return (
      <Layout title="Loading...">
        <div className="p-10 text-center">Loading Tracking Info...</div>
      </Layout>
    );

  if (!order)
    return (
      <Layout title="Error">
        <div className="p-10 text-center text-red-500">
          Failed to retrieve data
        </div>
      </Layout>
    );

  const progressPercent = Math.min(
    (trackingData.steps.length / 6) * 100,
    100
  );

  const courierName =
    order.status.find((s: any) => s.status_details?.courier_name)
      ?.status_details.courier_name || "Shipping Partner";

  const awbCode =
    order.status.find((s: any) => s.status_details?.awb_code)?.status_details
      .awb_code || "N/A";

  return (
    <Layout title="Track Package">
      <div className="px-0">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Order Details
        </button>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column */}
          <div className="flex-1 lg:w-2/3">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6 border border-gray-100">
              {/* Header Banner */}
              <div className="bg-amber-50 p-6 flex items-center justify-between">
                <div>
                  <p className="text-amber-600 font-bold text-xs uppercase tracking-widest mb-1">
                    Estimated Delivery
                  </p>
                  <h2 className="text-2xl font-bold text-gray-900 mb-0">
                    {trackingData.edd}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Current Status:{" "}
                    <span className="capitalize">
                      {trackingData.currentStatus}
                    </span>
                  </p>
                </div>
                <div className="bg-white p-3 rounded-full shadow-sm text-amber-500">
                  <Truck size={32} />
                </div>
              </div>

              {/* Progress + Timeline */}
              <div className="p-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Shipment Progress
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-2 mb-6 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Timeline */}
                <div className="pl-2">
                  {trackingData.steps.map((step, index) => (
                    <div
                      key={index}
                      className="flex relative pb-10 last:pb-0"
                    >
                      {/* Vertical Line */}
                      {index !== trackingData.steps.length - 1 && (
                        <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-800 z-0" />
                      )}

                      {/* Icon */}
                      <div className="mr-5 relative z-10 flex-shrink-0">
                        {step.current ? (
                          <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-amber-400 opacity-30 animate-ping" />
                            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white relative">
                              <Truck size={16} />
                            </div>
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white">
                            <CheckCircle2 size={18} />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className={step.current ? "" : "opacity-70"}>
                        <h6
                          className={`font-bold mb-1 capitalize text-sm ${
                            step.current ? "text-amber-500" : "text-gray-800"
                          }`}
                        >
                          {step.status}
                        </h6>
                        <p className="text-gray-500 text-xs mb-2">
                          {step.desc}
                        </p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs text-gray-500 font-semibold bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                            <Clock size={12} />
                            {step.date}
                          </span>
                          {step.location && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <MapPin size={12} />
                              {step.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:w-1/3 flex flex-col gap-6">
            {/* Courier Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-5">
                <h6 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
                  <Package size={18} className="text-amber-500" />
                  Courier Details
                </h6>
                <div className="flex items-center justify-between mb-4 bg-gray-50 p-3 rounded-xl">
                  <span className="font-bold text-gray-800 text-sm">
                    {courierName}
                  </span>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                    AWB Code
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-base font-bold font-mono text-gray-900">
                      {awbCode}
                    </span>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors p-0">
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-5">
                <h6 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
                  <MapPin size={18} className="text-amber-500" />
                  Shipping To
                </h6>
                <p className="font-bold text-gray-800 mb-1 text-sm">
                  {order.customer_address_id?.name}
                </p>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {order.customer_address_id?.addressLine1},{" "}
                  {order.customer_address_id?.addressLine2}
                  <br />
                  {order.customer_address_id?.city},{" "}
                  {order.customer_address_id?.state}{" "}
                  {order.customer_address_id?.pincode}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TrackingPage;

import AddOrderModal, {
  OrderFormData,
} from "../../components/order-dash/AddOrderDialog";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { createOrder } from "../../APIs/user/order";
import { appAxios } from "../../axios/appAxios";
import {
  channelAccounts_url,
  couriers_url,
  productSKUChannelLinks_url,
} from "../../URLs/user";
import { getAllProductSKUs } from "../../APIs/user/productSKU";
import { drpCrmBaseUrl } from "../../axios/urls";
import { FaBoxOpen, FaTruck } from "react-icons/fa";
import { CheckCircle2, Info, PackageOpen } from "lucide-react";
import { FaGear } from "react-icons/fa6";
import "../../components/order-dash/OrderDash.css";
import OrderTable from "../../components/order-dash/OrderTable";
import ShipmentModal from "../../components/order-dash/ShipmentModal";
import { bookCourier, schedulePickup } from "../../APIs/user/courier";
import { EditOrderModal } from "../../components/order-dash/EditOrderModal";
import { updateOrder } from "../../APIs/user/order";
import { pincodeDetails } from "../../APIs/pincodeAPIs";
import {
  LinkProductModal,
  PhysicalDetails,
} from "../../components/order-dash/LinkProductModal";
import { Warehouse } from "./Warehouse";
import Pagination from "../../components/order-dash/Pagination";
import { getAllWarehouses } from "../../APIs/user/warehouse";
import { SchedulePickupModal } from "../../components/order-dash/SchedulePickupModal";
import {
  LabelPrinter,
  LabelPrinterRef,
} from "../../components/order-dash/LabelPreviewModal";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import OrderStatusModal from "../../components/order-dash/StatusModal";

export interface Order {
  _id: string;
  order_id: number | string;
  channel_id: string | any;
  channel_order_id: string;
  store_order_id: string;
  order_date: string;
  customer_name: string;
  customer_phone: string | number;
  customer_email?: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_country: string;
  shipping_pincode: number;
  quantity: number;
  total_amount: number;
  payment_method: string;
  awb_number: string;
  channel_account: {
    channel_account_name: string;
    _id: string;
    pool_id?: string;
  };
  status: Array<{ status: string; status_date: string; status_details?: any }>;
  createdAt?: string;
  updatedAt?: string;
  items: Array<{
    product: {
      _id: string;
      product_sku_id: string;
      product_sku_name: string;
    };
    variantId?: string;
    quantity: number;
  }>;
  flags: Array<any>;
  risk_flag?: any;
  label?: any;
  recommended_courier_id?: string;
  recommended_courier_name?: string;
  shipping_courier_id?: string;
  recommended_warehouse_id?: string;
  first_line_item_price?: string;
}

const OrderDash = () => {
  const [show, setShow] = useState(false);
  const [channelAccounts, setChannelAccounts] = useState<Array<any>>([]);
  const [productSKUs, setProductSKUs] = useState<
    Array<{ _id: string; product_sku_name: string }>
  >([]);
  const [tab, setTab] = useState<String>("new");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [shipmentOrder, setShipmentOrder] = useState<Order | null>(null);
  const [shipmentDetails, setShipmentDetails] = useState<any>(null);
  const [labelData, setLabelData] = useState<any>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [linkOrderData, setLinkOrderData] = useState<Order | null>(null);
  const [physicalDetails, setPhysicalDetails] = useState<PhysicalDetails>({
    weight: "",
    length: "",
    breadth: "",
    width: "",
    packWeight: "",
    warehouse: [],
  });

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [pickupOrder, setPickupOrder] = useState<string | null>(null);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const printerRef = useRef<LabelPrinterRef>(null);

  const tabs = [
    { key: "new", label: "New", icon: <FaBoxOpen /> },
    {
      key: "pickup",
      label: "Pickups",
      icon: <PackageOpen size={14} />,
    },
    { key: "intransit", label: "In Transit", icon: <FaTruck /> },
    {
      key: "delivered",
      label: "Delivered",
      icon: <CheckCircle2 size={14} />,
    },
    { key: "rto", label: "RTO", icon: <Info size={14} /> },
    { key: "all", label: "All Orders", icon: <FaGear /> },
  ];

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1); // Add this
  const fetchWarehouses = async () => {
    try {
      const warehouseData = await getAllWarehouses();
      setWarehouses(warehouseData.data);
    } catch (error) {
      console.error("Error loading warehouses", error);
    }
  };
  const limit = 10;
  useEffect(() => {
    setPage(1);
  }, [tab]);
  const addOrder = async (payload: OrderFormData) => {
    try {
      await createOrder(payload);
      setShow(false);
      setPage(1);
      fetchOrders();
      toast.success("Order created successfully");
    } catch (error: any) {
      toast.error("Error creating order: " + error.message);
    }
  };
  useEffect(() => {
    fetchChannelAccounts();
    fetchProductSkus();
    fetchWarehouses();
  }, []);
  useEffect(() => {
    fetchOrders();
  }, [tab, page]);

  const fetchChannelAccounts = async () => {
    try {
      const response = await appAxios.get(`${channelAccounts_url}?limit=1000`);
      const data = response.data;
      setChannelAccounts(data.data || []);
    } catch (error) {
      console.error("Error fetching channel accounts:", error);
    }
  };

  const fetchProductSkus = async () => {
    try {
      const allProductSKUData = await getAllProductSKUs();
      setProductSKUs(allProductSKUData.data || []);
    } catch (err) {
      console.error("Error fetching product SKUs:", err);
    }
  };
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await appAxios.get(`${drpCrmBaseUrl}/user/order/new`, {
        params: {
          tab,
          page,
          limit,
        },
      });

      setOrders(data.data || data);

      if (data.totalPages) {
        setTotalPages(data.totalPages);
      } else {
        setTotalPages(1);
      }
    } catch (error) {
      toast.error("Error fetching Orders");
    } finally {
      setLoading(false);
    }
  };

  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // --- Checkbox Logic ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrders(orders.map((order) => order._id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOne = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };
  const handleShipmentClose = () => {
    setShowShipmentModal(false);
    setShipmentOrder(null);
    setSelectedWarehouse(null);
  };

  // --- Actions ---

  const handleViewStatus = (statusList: string[]) => {
    /* setStatusList(statusList); setShowStatusModal(true); */
    console.log(statusList);
  };

  const handleShipNow = async (order: Order) => {
    try {
      setShipmentOrder(order);
      const response = await appAxios.get(
        `${couriers_url}/checkServiceabilityv2?id=${order._id}`
      );
      const details = response.data.data;

      setShipmentDetails(details);
      if (details?.fulfillment?.warehouseDetails) {
        setSelectedWarehouse({
          warehouseAddress: {
            warehouse_id:
              details.fulfillment.warehouseDetails._id ||
              details.fulfillment.warehouseDetails.warehouse_id,
          },
        });
      }

      setShowShipmentModal(true);
    } catch (err) {
      if ((err as any).message.toLowerCase() === "product sku not linked") {
        handleOpenLinkModal(order);
      }
      toast.error((err as any).message);
    }
  };
  const handlePickupClose = () => {
    setShowPickupModal(false);
    setPickupOrder(null);
  };
  const handlePickupSubmit = async (pickupDate: Date) => {
    if (!pickupOrder || !pickupDate) {
      toast.error("Invalid Date or Order Id");
    }
    const res = pickupDate && (await schedulePickup(pickupOrder, pickupDate));
    if (res) {
      toast.success(
        "Pickup Scheduled for " + pickupDate.toISOString().split("T")[0]
      );
      fetchOrders();
      handlePickupClose();
    }
  };

  const handlePickup = (order: Order) => {
    setPickupOrder(order._id);
    setShowPickupModal(true);
  };
  const handlePrintLabel = (labelData: string) => {
    setLabelData([labelData]);
    setTimeout(() => {
      printerRef.current?.print();
    }, 100);
  };

  const handleAutoBook = (ordersArray: Order[]) => {
    /* handleBookBulkShipment(ordersArray) */
    console.log(ordersArray);
  };
  const handleCancelOrder = async (orderId: string) => {
    try {
      await appAxios.get(`${couriers_url}/cancelShipment?order_id=${orderId}`);
      fetchOrders();
      toast.success("Shipment has been cancelled");
    } catch (err) {
      console.log(err);
      toast.error((err as any).message);
    }
  };

  const handleBookShipment = async (courier_id: any) => {
    try {
      const response = await bookCourier(
        shipmentOrder?._id,
        courier_id,
        selectedWarehouse.warehouseAddress.warehouse_id,
        true
      );
      toast.success(response.message);
      if (response) {
        fetchOrders();
        handlePrintLabel(response.data);
        handleShipmentClose();
      }
    } catch (error) {
      toast.error("Error: " + error);
    }
  };
  const handleEditOrder = (order: Order) => {
    setEditOrder(order);
    setShowEditModal(true);
  };
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditOrder(null);
  };
  const handleEditSubmit = async (e: React.FormEvent) => {
    if (!editOrder) {
      toast.error("Edit Details not found");
      return;
    }
    e.preventDefault();
    try {
      await updateOrder(editOrder._id, editOrder);
      toast.success("Order updated successfully");
      setShowEditModal(false);
      fetchOrders();
    } catch (error: any) {
      toast.error("Error updating order");
    }
  };
  const hasValue = (val: any) =>
    val !== null && val !== undefined && val !== "";
  const handleOpenLinkModal = (order: Order) => {
    setLinkOrderData(order);
    // Reset form
    setPhysicalDetails({
      weight: "",
      length: "",
      breadth: "",
      width: "",
      packWeight: "",
      warehouse: [],
    });
    setShowLinkModal(true);
  };
  const handleLinkSubmit = async (variantId?: string) => {
    if (!linkOrderData) return;

    // Basic validation
    if (!physicalDetails.weight || !physicalDetails.length) {
      toast.error("Please fill in weight and dimensions");
      return;
    }

    try {
      const payload = {
        orderId: linkOrderData._id,
        physicalDetails: {
          weight: Number(physicalDetails.weight),
          length: Number(physicalDetails.length),
          breadth: Number(physicalDetails.breadth),
          width: Number(physicalDetails.width),
          packWeight: Number(physicalDetails.packWeight),

          warehouses: physicalDetails.warehouse,
        },
        ...(variantId ? { bodyVariantId: variantId } : {}),
      };

      const res = await appAxios.post(
        `${productSKUChannelLinks_url}/create-from-order`,
        payload
      );

      if (res.data.success) {
        toast.success(res.data.message);
        setShowLinkModal(false);
        setLinkOrderData(null);
        fetchOrders(); // Refresh table
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Linking failed");
    }
  };
const [status,setStatus] = useState(false);
const [statusList,setStatusList] = useState<any | null>(null)
  return (
   <>
  <div className="w-full">
    
   

    {/* Header Section */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-1">
          Orders Management
        </h1>

        <p className="text-sm text-gray-500">
          Streamline your shipping and fulfillment
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/user/orders"
          className="px-4 py-2.5 text-sm font-medium text-gray-800 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 shadow-sm"
        >
          Old Orders
        </Link>

        <button
          onClick={() => setShow(true)}
          className="px-4 py-2.5 text-sm font-medium text-white bg-linear-to-r from-[#F5891E] to-[#FF6B35] rounded-xl shadow-md shadow-orange-500/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
        >
          + Add Order
        </button>
      </div>
    </div>

        {/* Modern Segmented Tabs Section */}
<div className="pb-24 md:pb-0">
  <div
    className="
      fixed bottom-0 left-0 w-full z-50
      bg-[#f4f5f7] border-t border-gray-200 shadow-lg

      flex items-center justify-around

      px-1 py-2

      md:static md:w-max md:bg-gray-100/80
      md:backdrop-blur-sm md:rounded-2xl
      md:border md:border-gray-200/50
      md:shadow-none md:p-1
      md:mb-6
    "
  >
    {tabs.map((tabs) => {
      const isActive = tab === tabs.key;

      return (
        <button
          key={tabs.key}
          onClick={() => setTab(tabs.key)}
          className={`
            relative flex flex-col items-center justify-center
            gap-1 px-2 py-2 rounded-xl
            transition-colors duration-300 outline-none

            flex-1 md:flex-row md:flex-initial md:gap-2
            md:px-5 md:py-2

            ${
              isActive
                ? "text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }
          `}
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          {/* Same Desktop Active Effect */}
          {isActive && (
            <motion.div
              layoutId="active-tab-pill"
              className="
                absolute inset-0
                bg-white
                rounded-xl
                shadow-[0_2px_8px_rgba(0,0,0,0.06)]
              "
              transition={{
                type: "spring",
                bounce: 0.2,
                duration: 0.6,
              }}
            />
          )}

          {/* Tab Content */}
          <span className="relative z-10 flex flex-col items-center md:flex-row md:gap-2">
            <span
              className={`
                text-lg md:text-base
                ${isActive ? "text-[#F5891E]" : "opacity-70"}
              `}
            >
              {tabs.icon}
            </span>

            <span className="text-[10px] md:text-sm font-medium whitespace-nowrap">
              {tabs.label}
            </span>
          </span>
        </button>
      );
    })}
  </div>
</div>
      </div>
      <OrderTable
        orders={orders}
        isLoading={loading}
        page={page}
        limit={limit}
        selectedOrders={selectedOrders}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
        onEditOrder={handleEditOrder}
        onViewStatus={handleViewStatus}
        onShipNow={handleShipNow}
        onPickup={handlePickup}
        onPrintLabel={handlePrintLabel}
        onAutoBook={handleAutoBook}
        onCancelOrder={handleCancelOrder}
        setStatusList={setStatusList}
        setStatus={setStatus}
      />
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={(newPage) => setPage(newPage)}
      />
      <ShipmentModal
        showShipmentModal={showShipmentModal}
        handleShipmentClose={handleShipmentClose}
        shipmentOrder={shipmentOrder}
        shipmentDetails={shipmentDetails}
        handleBookShipment={handleBookShipment}
      />
      <AddOrderModal
        show={show}
        onClose={() => setShow(false)}
        onSubmit={addOrder}
        dropdownOptions={{
          channels: channelAccounts,
          products: productSKUs,
        }}
      />
      <EditOrderModal
        show={showEditModal}
        onHide={handleCloseEditModal}
        onSubmit={handleEditSubmit}
        editOrder={editOrder}
        setEditOrder={setEditOrder}
        hasValue={hasValue}
        pincodeDetails={pincodeDetails}
        toast={toast}
      />
      <LinkProductModal
        show={showLinkModal}
        onHide={() => setShowLinkModal(false)}
        onSubmit={handleLinkSubmit}
        linkOrderData={linkOrderData}
        physicalDetails={physicalDetails}
        setPhysicalDetails={setPhysicalDetails}
        warehouses={warehouses}
      />
      <SchedulePickupModal
        show={showPickupModal}
        onHide={() => setShowPickupModal(false)}
        onSubmit={(date) => {
          handlePickupSubmit(date);
        }}
      />
      <LabelPrinter ref={printerRef} labelData={labelData} />
      <OrderStatusModal open={status} status={statusList} setOpen={setStatus} />
    </>
  );
};

export default OrderDash;

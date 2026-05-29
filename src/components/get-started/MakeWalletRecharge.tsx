import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Card,
  InputGroup,
  Spinner,
  Badge,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { getAllPools } from "../../APIs/user/pool";
import { makePayment } from "../../APIs/user/wallet";
import { appAxios } from "../../axios/appAxios";
import { drpCrmBaseUrl } from "../../axios/urls";
import { useNavigate } from "react-router-dom";

const GetStartedRecharge = () => {
  const [pools, setPools] = useState<any[]>([]);
  const [selectedPool, setSelectedPool] = useState<string>("");
  const [loadingPools, setLoadingPools] = useState(true);

  // Changed: Amount is now dynamic, not fixed
  const [amount, setAmount] = useState<number | "">("");

  const [coupon, setCoupon] = useState<string>("");

  // Changed: Logic switched from 'discount' to 'bonus' based on 2nd component
  const [bonus, setBonus] = useState<number>(0);

  const [isValidating, setIsValidating] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const navigate = useNavigate();

  // 1. Fetch pools on mount
  useEffect(() => {
    const fetchPools = async () => {
      try {
        const response = await getAllPools();
        setPools(response.data);
        if (response.data?.length > 0) {
          setSelectedPool(response.data[0]._id);
        }
      } catch (error) {
        console.error("Error fetching pools", error);
        toast.error("Failed to load wallet pools");
      } finally {
        setLoadingPools(false);
      }
    };
    fetchPools();
  }, []);

  // 2. Validate Coupon (Logic Updated to Bonus)
  const handleApplyCoupon = async () => {
    if (!coupon || !amount) {
      toast.error("Please enter an amount and coupon code");
      return;
    }
    setIsValidating(true);
    setBonus(0);

    try {
      const { data } = await appAxios.post(`${drpCrmBaseUrl}/user/coupon`, {
        amount: Number(amount),
        coupon: coupon,
      });

      // Assuming API returns 'discount' key, but we treat it as bonus based on your Wallets component
      if (data.data.discount > 0) {
        setBonus(data.data.discount);
        toast.success(`Coupon applied! You get ₹${data.data.discount} extra.`);
      } else {
        toast.warning("Coupon valid but returned 0 bonus.");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid Coupon Code");
      setBonus(0);
    } finally {
      setIsValidating(false);
    }
  };

  // 3. Process Payment
  const handlePayment = async () => {
    if (!selectedPool) {
      toast.error("Please select a wallet pool.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    setIsPaying(true);
    try {
      // Logic: User pays the entered amount. The coupon is sent to backend to apply bonus credit.
      const res = await makePayment(Number(amount), selectedPool, coupon);
      if (res) {
        toast.success("Payment initiated successfully!");
        navigate("/user");
      }
    } catch (error: any) {
      console.error("Error during payment:", error);
      toast.error(error.response?.data?.message || "Payment failed");
    } finally {
      setIsPaying(false);
    }
  };

  // Helper to handle amount change and reset coupon if amount changes
  const handleAmountChange = (val: string) => {
    setAmount(Number(val));
    if (bonus > 0) {
      setBonus(0); // Reset bonus if amount changes as % might differ
      // Optional: toast.info("Amount changed, please re-apply coupon");
    }
  };

  const numericAmount = Number(amount) || 0;
  const totalCredit = numericAmount + bonus;

  return (
    <div className="d-flex justify-content-center align-items-center py-5">
      <Card.Body
  style={{
    padding: "18px",
    background: "#fff",
  }}
>
  {/* Wallet Balance */}
  <div
    style={{
      background: "#f5f0ee",
      borderRadius: 14,
      padding: "14px 16px",
      color: "#fff",
      marginBottom: 16,
    }}
  >
    <div
      style={{
        fontSize: 11,
        opacity: 0.9,
      }}
    >
      Wallet Balance
    </div>

    <div
      style={{
        fontSize: 28,
        fontWeight: 700,
        lineHeight: 1.1,
        marginTop: 4,
      }}
    >
      ₹{totalCredit.toFixed(0)}
    </div>

    <div
      style={{
        fontSize: 11,
        opacity: 0.9,
        marginTop: 4,
      }}
    >
      Available Balance
    </div>
  </div>

  {/* Amount */}
  <div style={{ marginBottom: 16 }}>
    <label
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: "#374151",
        marginBottom: 6,
        display: "block",
      }}
    >
      Recharge Amount
    </label>

    <Form.Control
      type="number"
      value={amount}
      onChange={(e) => handleAmountChange(e.target.value)}
      placeholder="Enter amount"
      style={{
        height: 30,
        fontSize: 12,
        borderRadius: 5,
        border: "1px solid #e5e7eb",
        boxShadow: "none",
      }}
    />
  </div>

  {/* Quick Amounts */}
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 16,
    }}
  >
    {[500, 1000, 2000, 5000].map((val) => (
      <button
        key={val}
        type="button"
        onClick={() => handleAmountChange(val.toString())}
        style={{
          border:
            Number(amount) === val
              ? "1px solid #F5891E"
              : "1px solid #e5e7eb",
          background:
            Number(amount) === val
              ? "#fff7ed"
              : "#fff",
          color:
            Number(amount) === val
              ? "#F5891E"
              : "#4b5563",
          borderRadius: 999,
          padding: "6px 12px",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        ₹{val}
      </button>
    ))}
  </div>

  {/* Promo */}
<div
  style={{
    marginBottom: 18,
  }}
>
  <label
    style={{
      fontSize: 12,
      fontWeight: 600,
      color: "#374151",
      marginBottom: 8,
      display: "block",
    }}
  >
    Promo Code
  </label>

  <div
    style={{
      display: "flex",
      gap: 8,
      alignItems: "center",
    }}
  >
    <Form.Control
      value={coupon}
      onChange={(e) =>
        setCoupon(e.target.value.toUpperCase())
      }
      placeholder="Enter promo code"
      disabled={bonus > 0}
      style={{
        height: 40,
        fontSize: 13,
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        boxShadow: "none",
      }}
    />

    <button
      type="button"
      onClick={handleApplyCoupon}
      disabled={
        !coupon ||
        !amount ||
        isValidating ||
        isPaying ||
        bonus > 0
      }
      style={{
        height: 40,
        minWidth: 90,
        border: "none",
        borderRadius: 10,
        background: bonus > 0 ? "#22c55e" : "#F5891E",
        color: "#fff",
        fontWeight: 600,
        fontSize: 13,
        padding: "0 16px",
      }}
    >
      {bonus > 0 ? "✓ Applied" : "Apply"}
    </button>
  </div>

  {bonus > 0 && (
    <div
      style={{
        marginTop: 8,
        fontSize: 12,
        color: "#22c55e",
        fontWeight: 600,
      }}
    >
      🎉 Bonus ₹{bonus} added successfully
    </div>
  )}
</div>
  {/* Summary */}
  <div
    style={{
      background: "#fafafa",
      border: "1px solid #ececec",
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
    }}
  >
    <div
      style={{
        fontSize: 13,
        fontWeight: 700,
        marginBottom: 10,
      }}
    >
      Recharge Summary
    </div>

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 12,
        marginBottom: 6,
      }}
    >
      <span>Amount</span>
      <span>₹{numericAmount}</span>
    </div>

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 12,
        marginBottom: 6,
      }}
    >
      <span>Bonus</span>
      <span style={{ color: "#16a34a" }}>
        ₹{bonus}
      </span>
    </div>

    <hr style={{ margin: "8px 0" }} />

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontWeight: 700,
        fontSize: 14,
      }}
    >
      <span>Total Credit</span>
      <span style={{ color: "#F5891E" }}>
        ₹{totalCredit}
      </span>
    </div>
  </div>

  {/* Button */}
  <Button
    className="w-100"
    onClick={handlePayment}
    disabled={
      loadingPools ||
      isPaying ||
      !selectedPool ||
      !amount
    }
    style={{
      height: 44,
      border: "none",
      borderRadius: 10,
      background: "#F5891E",
      fontWeight: 600,
      fontSize: 14,
    }}
  >
    {isPaying ? "Processing..." : "Add Money"}
  </Button>

  <div
    style={{
      textAlign: "center",
      marginTop: 8,
      fontSize: 10,
      color: "#9ca3af",
    }}
  >
    🔒 Secure payments powered by Razorpay
  </div>
</Card.Body>
    </div>
  );
};

export default GetStartedRecharge;

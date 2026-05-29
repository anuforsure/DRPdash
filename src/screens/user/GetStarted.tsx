import React, { useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
  Card,
  ProgressBar,
  Badge,
  Navbar,
  Container,
  Nav,
  Dropdown,
} from "react-bootstrap";
import { FaCheck, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Stat, useStatsStore } from "../../store/useStatsStore";
import MakePool from "../../components/get-started/MakePool";
import MakeWarehouse from "../../components/get-started/MakeWarehouse";
import MakeChannelAccount from "../../components/get-started/MakeChannelAccount";
import logoImg from "../../assets/Orderzuplogo.png";
// import logoImg1 from "../../assets/logo1.png";
import { drpCrmBaseUrl } from "../../axios/urls";
import { appAxios } from "../../axios/appAxios";
import { getAccountSummary } from "../../APIs/user/dashboard";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import GetStartedRecharge from "../../components/get-started/MakeWalletRecharge";

/**
 * Horizontal Onboarding Stepper
 * - Retains original visual style (colors, sizes, fonts)
 * - Uses Bootstrap Grid + Flex for horizontal layout
 * - Adds Framer Motion for smooth content switching
 */

type Step = {
  key: string;
  label: string;
  helper?: string;
  content: React.ReactNode;
};

const GetStarted: React.FC = () => {
  const [activeStep, setActiveStep] = useState<string>("pools");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const { stats, setStatsStore } = useStatsStore();
  const [username, setUsername] = useState("");

  const verifyMe = async () => {
    try {
      const { data } = await appAxios(`${drpCrmBaseUrl}/auth/verify/me`);
      setUsername(data.username);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchAccountSummary = async () => {
    const res = await getAccountSummary();
    if (res) {
      setStatsStore((res as any).counts);
    }
  };

  useEffect(() => {
    verifyMe();
    fetchAccountSummary();
  }, []);

  useEffect(() => {
    if (!stats || stats.length === 0) return;
    const completed = new Set<string>();

    stats.forEach((stat: Stat) => {
      const token = stat.label.split(" ")[1]?.toLowerCase();
      if (
        (token === "pools" || token === "warehouses" || token === "channel") &&
        Number(stat.count) > 0
      ) {
        completed.add(token);
      }
    });

    const completedArray = Array.from(completed);
    setCompletedSteps(completedArray);

    const nextStep =
      stepOrder.find((step) => !completed.has(step.key)) ??
      stepOrder[stepOrder.length - 1];

    setActiveStep(nextStep.key);
  }, [stats]);

  // Step definitions
  const stepOrder: Step[] = [
    {
      key: "warehouses",
      label: "Warehouse",
      helper: "Create location",
      content: <MakeWarehouse handleNext={() => handleNext("warehouses")} />,
    },
    {
      key: "pools",
      label: "Business Account Setup",
      helper: "Minimal business details",
      content: <MakePool handleNext={() => handleNext("pools")} />,
    },
    
    {
      key: "channel",
      label: "Channel Account",
      helper: "Connect Shopify/Manual",
      content: <MakeChannelAccount handleNext={() => handleNext("channel")} />,
    },
    {
      key: "recharge",
      label: "Wallet Recharge",
      helper: "Let's add some balance.",
      content: <GetStartedRecharge />,
    },
    // {
    //   key: "final",
    //   label: "Finish",
    //   helper: "You're all set",
    //   content: (
    //     <div style={{ textAlign: "center", padding: 40 }}>
    //       <motion.div
    //         initial={{ scale: 0.9, opacity: 0 }}
    //         animate={{ scale: 1, opacity: 1 }}
    //       >
    //         <h3 style={{ marginBottom: 12, color: "#000434" }}>Nice work 👏</h3>
    //         <p
    //           className="text-muted"
    //           style={{ maxWidth: 500, margin: "0 auto" }}
    //         >
    //           You completed onboarding. Explore dashboards, add products, or
    //           configure integrations.
    //         </p>
    //         <div style={{ marginTop: 24 }}>
    //           <Button
    //             variant="primary"
    //             size="lg"
    //             onClick={() => {
    //               window.location.href = "/user";
    //             }}
    //           >
    //             Go to Dashboard
    //           </Button>
    //         </div>
    //       </motion.div>
    //     </div>
    //   ),
    // },
  ];

  const totalSteps = stepOrder.length;
  const completedCount = completedSteps.length;
  const progress = Math.round((completedCount / (totalSteps - 1)) * 100);

  function handleNext(key: string) {
    if (!completedSteps.includes(key)) {
      setCompletedSteps((prev) => [...prev, key]);
    }
    const idx = stepOrder.findIndex((s) => s.key === key);
    if (idx >= 0 && idx < stepOrder.length - 1) {
      setActiveStep(stepOrder[idx + 1].key);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setActiveStep("final");
    }
  }

  function handleClickStep(key: string) {
    const idxClicked = stepOrder.findIndex((s) => s.key === key);
    const idxActive = stepOrder.findIndex((s) => s.key === activeStep);
    const isCompleted = completedSteps.includes(key);
    const isCurrentOrPrevious = idxClicked <= idxActive + 1;
    if (isCompleted || isCurrentOrPrevious) setActiveStep(key);
  }

  const renderedContent = useMemo(
    () => stepOrder.find((s) => s.key === activeStep)?.content,
    [activeStep, stepOrder]
  );

  return (
    <>
      <OnboardingHeader username={username} />
      <div
        style={{
          padding: "2rem 1rem",
          backgroundColor: "#f5f7fb", // Keep original bg color
          minHeight: "100vh",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Header Section */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 style={{ color: "#000434", margin: 0, fontWeight: 700 }}>
                Welcome — Let's get you set up
              </h2>
              <div style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>
                Onboarding in a few quick steps. We'll guide you.
              </div>
            </div>

            <div style={{ width: 320 }} className="d-none d-md-block">
              <div className="d-flex gap-2 align-items-center">
                <div style={{ flex: 1 }}>
                  <ProgressBar
                    now={progress}
                    variant="warning"
                    style={{ height: 8, borderRadius: 8 }}
                  />
                  <div
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      marginTop: 6,
                      textAlign: "right",
                    }}
                  >
                    {completedCount}/{totalSteps - 1} completed
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Horizontal Stepper */}
         {/* Horizontal Stepper */}
<div
  className="mb-4"
  style={{
    display: "flex",
    gap: "12px",
    flexWrap: "nowrap",
    overflowX: "auto",
  }}
>
  {stepOrder.map((step, index) => {
    const isActive = activeStep === step.key;
    const isComplete = completedSteps.includes(step.key);

    return (
      <div
        key={step.key}
        style={{
          flex: 1,
          minWidth: "250px",
        }}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleClickStep(step.key)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            borderRadius: 10,
            cursor: "pointer",
            backgroundColor: "#fff",
            background: isActive ? "rgba(245,137,30,0.06)" : "#fff",
            borderBottom: isActive
              ? "4px solid #F5891E"
              : "4px solid transparent",
            border: isActive
              ? undefined
              : "1px solid transparent",
            boxShadow: "0 2px 5px rgba(0,0,0,0.03)",
            height: "100%",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ flexShrink: 0 }}>
            {isComplete ? (
             <div
  style={{
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    transition: "all 0.2s ease",
    background: isComplete
      ? "#F5891E"
      : isActive
      ? "rgba(245,137,30,0.08)"
      : "#fff",
    border: isComplete
      ? "none"
      : `1px solid ${isActive ? "#F5891E" : "#e6e9ee"}`,
    color: isComplete
      ? "#fff"
      : isActive
      ? "#F5891E"
      : "#9aa0ad",
  }}
>
  {isComplete ? <FaCheck size={14} /> : index + 1}
</div>
            ) : (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  border: "1px solid #e6e9ee",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isActive ? "#F5891E" : "#9aa0ad",
                  background: isActive
                    ? "rgba(245,137,30,0.06)"
                    : "transparent",
                  fontWeight: 600,
                }}
              >
                {index + 1}
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflow: "hidden" }}>
            <div
              className="text-truncate"
              style={{
                fontWeight: isActive ? 700 : 600,
                color: isActive ? "#000434" : "#111827",
                fontSize: "1rem",
              }}
            >
              {step.label}
            </div>

            {step.helper && (
              <div
                className="text-truncate"
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginTop: 2,
                }}
              >
                {step.helper}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  })}
</div>
          {/* Content Card */}
          <Row>
            <Col xs={12}>
              <Card
                style={{
                  borderRadius: 16,
                  boxShadow: "0 8px 30px rgba(2,6,23,0.06)",
                  minHeight: 450,
                  padding: 24,
                  border: "none",
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <h4
                      style={{ margin: 0, color: "#000434", fontWeight: 700 }}
                    >
                      {stepOrder.find((s) => s.key === activeStep)?.label}
                    </h4>
                    <span style={{ fontSize: 13, color: "#9aa0ad" }}>
                      Step{" "}
                      {stepOrder.findIndex((s) => s.key === activeStep) + 1} of{" "}
                      {stepOrder.length}
                    </span>
                  </div>

                  {completedSteps.length > 0 && activeStep !== "final" && (
                    <Badge bg="success" pill style={{ fontSize: 12 }}>
                      {completedSteps.length} completed
                    </Badge>
                  )}
                </div>

                <div
                  style={{
                    borderTop: "1px dashed #eef2f6",
                    marginBottom: 20,
                  }}
                />

                {/* Framer Motion Transition */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    {renderedContent}
                  </motion.div>
                </AnimatePresence>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </>
  );
};

export default GetStarted;
const OnboardingHeader = ({ username = "" }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post(
        `${drpCrmBaseUrl}/auth/logout`,
        {},
        { withCredentials: true }
      );
      navigate("/login");
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  return (
    <header
  style={{
    background: "#ffffff",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  }}
>
  <div
    style={{
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "18px 24px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <div>
  <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: 0,
    lineHeight: 1,
  }}
>
  <img
    src={logoImg}
    alt="logo"
    style={{
      width: "44px",
      height: "44px",
      objectFit: "contain",
      marginRight: "-2px",
    }}
  />

  <span
    className="font-bold text-[#000967]"
    style={{
      fontSize: "34px",
      lineHeight: "44px",
      letterSpacing: "-1px",
    }}
  >
    Orderz
    <span
      className="text-[#F5891E]"
      style={{
        marginLeft: "-1px",
      }}
    >
      Up
    </span>
  </span>
</div>

      <div
        style={{
          marginTop: "4px",
          marginLeft: "62px",
          fontSize: "13px",
          letterSpacing: "1px",
          color: "#94A3B8",
          textTransform: "uppercase",
        }}
      >
        Hello,
        <span
          style={{
            color: "#F5891E",
            fontWeight: 700,
            marginLeft: "6px",
          }}
        >
          {username}
        </span>
      </div>
    </div>

    <button
      onClick={handleLogout}
      style={{
        border: "none",
        background: "#F5891E",
        color: "#fff",
        padding: "10px 22px",
        borderRadius: "10px",
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(245,137,30,0.25)",
      }}
    >
      Logout
    </button>
  </div>
</header>
  );
};



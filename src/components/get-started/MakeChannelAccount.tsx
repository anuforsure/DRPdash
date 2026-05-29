import React, { useEffect, useMemo, useState } from "react";
import { Badge, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import { FaExternalLinkAlt, FaShopify, FaWordpress } from "react-icons/fa";

import { createChannelAccount } from "../../APIs/user/channelAccount";
import { getAllChannels } from "../../APIs/user/channel";
import { getAllPools } from "../../APIs/user/pool";
import { initialChannelAccountFetch } from "../../APIs/user/initialChannelAccountFetch";

type Automation = {
  auto_ship: boolean;
  auto_ai_recommendation: boolean;
  auto_address_confirm: boolean;
  auto_ai_rating: boolean;
};

export interface ChannelAccount {
  _id?: string;
  channel_account_name: string;
  pool_id?: { _id: string; name: string };
  channel_id?: { _id: string; channel_name: string };
  keys?: Record<string, any>;
  fulfillment_type?: "Self" | "Optional" | "Channel" | "Other";
  status: "active" | "inactive" | "suspended";
  automation?: Automation;
  admins?: Array<{ _id: string; name: string }>;
  created_by?: string;
  ownership?: { _id: string; name: string };
  createdAt?: string;
}

/* ── styles ── */
const s: Record<string, React.CSSProperties> = {
  wrap: { padding: "28px 32px", fontFamily: "'DM Sans', sans-serif" },
  sectionLabel: {
    fontSize: 11, fontWeight: 700, letterSpacing: "1px",
    textTransform: "uppercase" as const, color: "#94a3b8", marginBottom: 14,
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" },
  full: { gridColumn: "1 / -1" },
  field: { display: "flex", flexDirection: "column" as const, gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  input: {
    padding: "10px 13px", borderRadius: 8, border: "1.5px solid #e2e8f0",
    fontSize: 14, color: "#1e293b", background: "#fff", outline: "none",
    width: "100%", boxSizing: "border-box" as const,
    transition: "border-color 0.18s, box-shadow 0.18s",
  },
  inputFocus: { borderColor: "#3b82f6", boxShadow: "0 0 0 3px rgba(59,130,246,0.12)" },
  select: {
    padding: "10px 13px", borderRadius: 8, border: "1.5px solid #e2e8f0",
    fontSize: 14, color: "#1e293b", background: "#fff", outline: "none",
    width: "100%", boxSizing: "border-box" as const, cursor: "pointer",
  },
  helpText: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  divider: { border: "none", borderTop: "1px solid #f0f1f5", margin: "24px 0" },
  channelBtnRow: { display: "flex", gap: 12, flexWrap: "wrap" as const },
 
  channelBtnIcon: { fontSize: 20 },
  connectBtnShopify: {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "10px 20px", borderRadius: 8, border: "none",
    background: "#96bf48", color: "#fff",
    fontWeight: 700, fontSize: 14, cursor: "pointer",
    textDecoration: "none",
  },
  connectBtnWoo: {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "10px 20px", borderRadius: 8, border: "none",
    background: "#7f54b3", color: "#fff",
    fontWeight: 700, fontSize: 14, cursor: "pointer",
  },
  wooFieldBox: {
    background: "#faf7ff", border: "1.5px solid #e9d5ff",
    borderRadius: 10, padding: "20px",
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px",
    marginTop: 8,
  },
  switchRow: { display: "flex", flexDirection: "column" as const, gap: 10 },
  switchItem: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  switchLabel: { fontSize: 13, color: "#374151", fontWeight: 500 },
  switchInput: { accentColor: "#F5891E", width: 36, height: 20, cursor: "pointer" },
  checkboxRow: { display: "flex", flexWrap: "wrap" as const, gap: 10 },
  checkboxItem: { display: "flex", alignItems: "center", gap: 7, cursor: "pointer" },
  adminTag: {
    background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe",
    borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600,
  },
  footer: {
    display: "flex", justifyContent: "flex-end", gap: 12,
    marginTop: 28, paddingTop: 20, borderTop: "1px solid #f0f1f5",
  },
  btnSecondary: {
    padding: "10px 20px", borderRadius: 8, border: "1.5px solid #e2e8f0",
    background: "#fff", color: "#475569", fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
  btnPrimary: {
    padding: "10px 28px", borderRadius: 8, border: "none",
    background: "#2563eb", color: "#fff", fontSize: 14, fontWeight: 600,
    cursor: "pointer",
  },
  btnDisabled: { opacity: 0.5, cursor: "not-allowed" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 320px", gap: 28, alignItems: "start" },
  automationCard: {
    background: "#f8fafc", border: "1.5px solid #e2e8f0",
    borderRadius: 12, padding: "20px",
  },
};

/* ── mobile overrides ── */
const mobileOverrides: Record<string, React.CSSProperties> = {
  wrap: { padding: "16px" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr", gap: 20 },
  grid2: { display: "grid", gridTemplateColumns: "1fr", gap: "14px" },
  wooFieldBox: {
    background: "#faf7ff", border: "1.5px solid #e9d5ff",
    borderRadius: 10, padding: "14px",
    display: "grid", gridTemplateColumns: "1fr", gap: "14px",
    marginTop: 8,
  },
  footer: {
    display: "flex", flexDirection: "column" as const, gap: 10,
    marginTop: 20, paddingTop: 16, borderTop: "1px solid #f0f1f5",
  },
  btnSecondary: {
    padding: "11px 20px", borderRadius: 8, border: "1.5px solid #e2e8f0",
    background: "#fff", color: "#475569", fontSize: 14, fontWeight: 600,
    cursor: "pointer", width: "100%", textAlign: "center" as const,
  },
  btnPrimary: {
    padding: "11px 28px", borderRadius: 8, border: "none",
    background: "#2563eb", color: "#fff", fontSize: 14, fontWeight: 600,
    cursor: "pointer", width: "100%", textAlign: "center" as const,
  },
};

/* ── hook ── */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

const FI: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => {
  const [f, setF] = useState(false);
  return (
    <input
      {...props}
      style={{ ...s.input, ...(f ? s.inputFocus : {}), ...props.style }}
      onFocus={(e) => { setF(true); props.onFocus?.(e); }}
      onBlur={(e) => { setF(false); props.onBlur?.(e); }}
    />
  );
};

type ChannelType = "shopify" | "woocommerce" | "custom";

const MakeChannelAccount: React.FC<{ handleNext: () => void }> = ({ handleNext }) => {
  const isMobile = useIsMobile();
  const m = (key: string): React.CSSProperties =>
    isMobile && mobileOverrides[key] ? { ...s[key], ...mobileOverrides[key] } : s[key];

  const [channels, setChannels] = useState<any[]>([]);
  const [pools, setPools] = useState<any[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [channelAccountName, setChannelAccountName] = useState("");
  const [selectedPoolAdmins, setSelectedPoolAdmins] = useState<any[]>([]);
  const [adminAccess, setAdminAccess] = useState<string[]>([]);
  const [channelType, setChannelType] = useState<ChannelType>("shopify");

  // WooCommerce fields
  const [wooUrl, setWooUrl] = useState("");
  const [wooConsumerKey, setWooConsumerKey] = useState("");
  const [wooConsumerSecret, setWooConsumerSecret] = useState("");

  const [automation, setAutomation] = useState<Automation>({
    auto_ship: true,
    auto_ai_recommendation: true,
    auto_address_confirm: true,
    auto_ai_rating: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [showFetchingModal, setShowFetchingModal] = useState(false);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [fetchingOrders, setFetchingOrders] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [channelsData, poolsData] = await Promise.all([getAllChannels(), getAllPools()]);
        setChannels(channelsData || []);
        const customChannel = channelsData.find((c: any) => c.channel_name === "Custom");
        if (customChannel) setSelectedChannelId(customChannel._id);
        setPools(poolsData?.data || []);
      } catch (err) {
        console.error("Failed to load channels/pools", err);
      }
    })();
  }, []);

  const handlePoolChange = (poolId: string) => {
    setSelectedPoolId(poolId);
    const pool = pools.find((p) => p._id === poolId);
    setSelectedPoolAdmins(pool?.admins || []);
    setAdminAccess([]);
  };

  const canSubmit = useMemo(() => {
    if (!channelAccountName.trim()) return false;
    if (!selectedPoolId) return false;
    if (channelType === "woocommerce" && (!wooUrl.trim() || !wooConsumerKey.trim() || !wooConsumerSecret.trim())) return false;
    return true;
  }, [channelAccountName, selectedPoolId, channelType, wooUrl, wooConsumerKey, wooConsumerSecret]);

  const startInitialFetch = async (channelAccountId?: string) => {
    if (!channelAccountId) return;
    setShowFetchingModal(true);
    setFetchingProducts(true);
    setFetchingOrders(true);
    try {
      await Promise.all([
        initialChannelAccountFetch(channelAccountId, "products").finally(() => setFetchingProducts(false)),
        initialChannelAccountFetch(channelAccountId, "orders").finally(() => setFetchingOrders(false)),
      ]);
    } finally {
      setTimeout(() => setShowFetchingModal(false), 700);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);

    const keysObject: Record<string, any> = {};
    if (channelType === "woocommerce") {
      keysObject["store_url"] = wooUrl.trim();
      keysObject["consumer_key"] = wooConsumerKey.trim();
      keysObject["consumer_secret"] = wooConsumerSecret.trim();
    }

    const formData: ChannelAccount = {
      channel_account_name: channelAccountName.trim(),
      pool_id: pools.find((p) => p._id === selectedPoolId),
      channel_id: channels.find((c) => c._id === selectedChannelId),
      fulfillment_type: "Self",
      keys: keysObject,
      status: "active",
      admins: selectedPoolAdmins.filter((a) => adminAccess.includes(a._id)).map((a) => a._id),
      automation,
    };

    try {
      const result: any = await createChannelAccount(formData);
      const chName = channels.find((c) => c._id === selectedChannelId)?.channel_name;
      if (chName !== "Custom") await startInitialFetch(result?._id || result);
      handleNext();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create channel account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={m("wrap")}>

        <div style={m("twoCol")}>
          {/* Left: main form */}
          <div>
            {/* Connect buttons */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              <a
                href="https://apps.shopify.com/app7"
                target="_blank"
                rel="noreferrer"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#F5891E";
                  e.currentTarget.style.color = "#6b7280";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f5f0ee";
                  e.currentTarget.style.color = "#6b7280";
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: "1px solid #F5891E",
                  background: "#f5f0ee",
                  color: "#6b7280",
                  fontWeight: 600,
                  fontSize: 13,
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  flex: isMobile ? "1 1 auto" : undefined,
                  justifyContent: isMobile ? "center" : undefined,
                }}
              >
                <FaShopify size={14} />
                Shopify
                <FaExternalLinkAlt size={10} />
              </a>

              <a
                href="https://yourstore.com"
                target="_blank"
                rel="noreferrer"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#F5891E";
                  e.currentTarget.style.color = "#6b7280";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f5f0ee";
                  e.currentTarget.style.color = "#6b7280";
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: "1px solid #F5891E",
                  background: "#f5f0ee",
                  color: "#6b7280",
                  fontWeight: 600,
                  fontSize: 13,
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  flex: isMobile ? "1 1 auto" : undefined,
                  justifyContent: isMobile ? "center" : undefined,
                }}
              >
                <FaWordpress size={14} />
                WooCommerce
                <FaExternalLinkAlt size={10} />
              </a>
            </div>

            {/* WooCommerce: API key fields */}
            {channelType === "woocommerce" && (
              <div style={m("wooFieldBox")}>
                <div style={{ ...s.field, gridColumn: isMobile ? undefined : "1 / -1" }}>
                  <label style={s.label}>Store URL</label>
                  <FI value={wooUrl} onChange={(e) => setWooUrl(e.target.value)} placeholder="https://yourstore.com" required />
                  <span style={s.helpText}>Full URL of your WooCommerce store</span>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Consumer Key</label>
                  <FI value={wooConsumerKey} onChange={(e) => setWooConsumerKey(e.target.value)} placeholder="ck_xxxxxxxxxxxx" required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Consumer Secret</label>
                  <FI type="password" value={wooConsumerSecret} onChange={(e) => setWooConsumerSecret(e.target.value)} placeholder="cs_xxxxxxxxxxxx" required />
                </div>
                <div style={{ gridColumn: isMobile ? undefined : "1 / -1" }}>
                  <span style={{ fontSize: 12, color: "#7f54b3" }}>
                    💡 Find these under <strong>WooCommerce → Settings → Advanced → REST API</strong> in your WordPress admin.
                  </span>
                </div>
              </div>
            )}

            <hr style={s.divider} />

            {/* Account details */}
            <p style={s.sectionLabel}>📋 Account Details</p>
            <div style={m("grid2")}>
              <div style={{ ...s.field, gridColumn: isMobile ? undefined : "1 / -1" }}>
                <label style={s.label}>Channel Account Name</label>
                <FI value={channelAccountName} onChange={(e) => setChannelAccountName(e.target.value)} required placeholder="e.g. My Shopify Store" />
                <span style={s.helpText}>Helps you identify this connected store</span>
              </div>

              <div style={{ ...s.field, gridColumn: isMobile ? undefined : "1 / -1" }}>
                <label style={s.label}>Business Account (Pool)</label>
                <select value={selectedPoolId} onChange={(e) => handlePoolChange(e.target.value)} required style={s.select}>
                  <option value="">Select business account</option>
                  {pools.map((pool) => (
                    <option key={pool._id} value={pool._id}>{pool.name}</option>
                  ))}
                </select>
              </div>

              {selectedPoolAdmins.length > 0 && (
                <div style={{ ...s.field, gridColumn: isMobile ? undefined : "1 / -1" }}>
                  <label style={s.label}>Give Admins Access</label>
                  <div style={s.checkboxRow}>
                    {selectedPoolAdmins.map((admin) => (
                      <label key={admin._id} style={s.checkboxItem}>
                        <input
                          type="checkbox"
                          checked={adminAccess.includes(admin._id)}
                          onChange={(e) => setAdminAccess((prev) =>
                            e.target.checked ? [...prev, admin._id] : prev.filter((id) => id !== admin._id)
                          )}
                          style={{ accentColor: "#2563eb", width: 15, height: 15 }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{admin.name}</span>
                        <span style={s.adminTag}>Admin</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={m("footer")}>
              <button
                type="button"
                style={m("btnSecondary")}
                onClick={() => { setChannelAccountName(""); setWooUrl(""); setWooConsumerKey(""); setWooConsumerSecret(""); }}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                style={{
                  ...m("btnPrimary"),
                  background: "#F5891E",
                  color: "#fff",
                  opacity: 1,
                  cursor: "pointer",
                }}
              >
                {submitting ? "Creating…" : "Create Channel Account"}
              </button>
            </div>
          </div>

          {/* Right: Automation */}
          <div style={s.automationCard}>
            <p style={{ ...s.sectionLabel, marginBottom: 16 }}>⚡ Automation</p>
            <div style={s.switchRow}>
              {[
                { key: "auto_ai_rating", label: "OUAI Customer Rating" },
                { key: "auto_address_confirm", label: "Auto Order Confirmation" },
                { key: "auto_ai_recommendation", label: "OUAI Courier Recommendation" },
                { key: "auto_ship", label: "Auto Shipment Book" },
              ].map(({ key, label }) => (
                <div key={key} style={s.switchItem}>
                  <span style={s.switchLabel}>{label}</span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={(automation as any)[key]}
                    onChange={(e) => setAutomation((a) => ({ ...a, [key]: e.target.checked }))}
                    style={s.switchInput}
                  />
                </div>
              ))}
            </div>

            <hr style={{ ...s.divider, margin: "20px 0" }} />

            <p style={{ ...s.sectionLabel, marginBottom: 10 }}>💡 Quick Tips</p>
            <ul style={{ paddingLeft: 18, margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
              <li>Use Shopify for OAuth-based one-click connect.</li>
              <li>WooCommerce needs Consumer Key + Secret from your WordPress admin.</li>
              <li>Custom is for API-based or manual integrations.</li>
              <li>You can update keys anytime from Channel Accounts.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sync Modal */}
      <Modal show={showFetchingModal} onHide={() => setShowFetchingModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>Initial sync in progress</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <strong>📦 Products:</strong>
            <span style={{ color: fetchingProducts ? "#f59e0b" : "#16a34a", fontWeight: 600 }}>
              {fetchingProducts ? "Fetching…" : "✓ Complete"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <strong>🚚 Orders:</strong>
            <span style={{ color: fetchingOrders ? "#f59e0b" : "#16a34a", fontWeight: 600 }}>
              {fetchingOrders ? "Fetching…" : "✓ Complete"}
            </span>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default MakeChannelAccount;

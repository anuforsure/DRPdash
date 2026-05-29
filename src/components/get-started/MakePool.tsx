import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { createPool } from "../../APIs/user/pool";
import { getUser } from "../../APIs/user/user";
import { createAmazonS3 } from "../../APIs/user/amazonS3";
import { getGST } from "../../APIs/user/gst";

/* --- Types --- */
export interface User {
  _id: string;
  name: string;
  email?: string;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

const validateGSTIN = (gstin: string) =>
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin);

const validateIFSC = (ifsc: string) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);

/* ── Inline styles ── */

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f5f6fa",
    padding: "32px 16px",
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    maxWidth: 780,
    margin: "0 auto",
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  header: {
    padding: "28px 36px 24px",
    borderBottom: "1px solid #f0f1f5",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: "#ccdbff",
    margin: 0,
    letterSpacing: "-0.3px",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  badge: {
    background: "#f5f0ee",
    color: "#F5891E",
    border: "1px solid #F5891E",
    borderRadius: 20,
    padding: "4px 12px",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.3px",
    whiteSpace: "nowrap" as const,
  },
  body: {
    padding: "32px 36px",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "1px",
    textTransform: "uppercase" as const,
    color: "#94a3b8",
    marginBottom: 16,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px 24px",
  },
  full: {
    gridColumn: "1 / -1",
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#F5891E",
  },
  input: {
    padding: "10px 13px",
    borderRadius: 8,
    border: "1.5px solid #e2e8f0",
    fontSize: 14,
    color: "#F5891E",
    background: "#fff",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
    transition: "border-color 0.18s, box-shadow 0.18s",
  },
  inputFocus: {
    borderColor: "#F5891E",
    boxShadow: "0 0 0 3px rgba(245,137,30,0.12)",
  },
  helpText: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 3,
  },
  inputGroup: {
    display: "flex",
    gap: 0,
    borderRadius: 8,
    overflow: "hidden",
    border: "1.5px solid #e2e8f0",
  },
  inputGroupInput: {
    flex: 1,
    padding: "10px 13px",
    border: "none",
    fontSize: 14,
    color: "#F5891E",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box" as const,
  },
  inputGroupBtn: {
    padding: "10px 18px",
    border: "none",
    borderLeft: "1.5px solid #e2e8f0",
    background: "#f5f0ee",
    color: "#F5891E",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    transition: "background 0.15s",
  },
  radioRow: {
    display: "flex",
    gap: 24,
    alignItems: "center",
    marginTop: 4,
  },
  radioItem: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    cursor: "pointer",
  },
  radioLabel: {
    fontSize: 14,
    color: "#F5891E",
    fontWeight: 500,
  },
  verifiedBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    background: "#f5f0ee",
    color: "#F5891E",
    border: "1px solid #F5891E",
    borderRadius: 6,
    padding: "3px 10px",
    fontSize: 12,
    fontWeight: 600,
    marginTop: 6,
  },
  divider: {
    border: "none",
    borderTop: "1px solid #f0f1f5",
    margin: "28px 0",
  },
  tagRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 8,
    marginTop: 8,
  },
  tag: {
    background: "#f5f0ee",
    color: "#F5891E",
    border: "1px solid #F5891E",
    borderRadius: 20,
    padding: "4px 12px",
    fontSize: 12,
    fontWeight: 600,
  },
  accordion: {
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 8,
  },
  accordionSummary: {
    padding: "12px 16px",
    cursor: "pointer",
    fontSize: 13,
    color: "#64748b",
    fontWeight: 600,
    background: "#f5f0ee",
    listStyle: "none",
    userSelect: "none" as const,
  },
  accordionBody: {
    padding: "20px 16px",
    background: "#fff",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 28,
    paddingTop: 24,
    borderTop: "1px solid #f0f1f5",
  },
  btnSecondary: {
    padding: "10px 22px",
    borderRadius: 8,
    border: "1.5px solid #F5891E",
    background: "#f5f0ee",
    color: "#F5891E",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnPrimary: {
    padding: "10px 32px",
    borderRadius: 8,
    border: "none",
    background: "#F5891E",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "0.1px",
  },
  btnDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
  fileInput: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1.5px dashed #cbd5e1",
    fontSize: 13,
    color: "#cae0ff",
    background: "#f5f0ee",
    width: "100%",
    boxSizing: "border-box" as const,
    cursor: "pointer",
  },
};


/* Focusable input wrapper */
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

const FTA: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => {
  const [f, setF] = useState(false);
  return (
    <textarea
      {...props}
      style={{ ...s.textarea, ...(f ? s.inputFocus : {}), ...props.style }}
      onFocus={(e) => { setF(true); props.onFocus?.(e); }}
      onBlur={(e) => { setF(false); props.onBlur?.(e); }}
    />
  );
};

/* ── Component ── */
const MakePool: React.FC<{ handleNext: () => void }> = ({ handleNext }) => {
  const [hasGst, setHasGst] = useState(true);
  const [gstin, setGstin] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [address, setAddress] = useState("");
  const [panFile, setPanFile] = useState<File | null>(null);

  const [bankAccount, setBankAccount] = useState("");
  const [bankIFSC, setBankIFSC] = useState("");
  const [chequeFile, setChequeFile] = useState<File | null>(null);

  const [ownerEmail, setOwnerEmail] = useState("");
  const [admins, setAdmins] = useState<User[]>([]);
  const [companyType, setCompanyType] = useState("individual");
  const [submitting, setSubmitting] = useState(false);
  const [gstLoading, setGstLoading] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);
  const [stateName, setStateName] = useState("");

  useEffect(() => {
    if (!hasGst) { setCompanyType("individual"); setGstVerified(false); setGstin(""); }
  }, [hasGst]);

  const handleUserSearch = async (email: string) => {
    const e = email.trim();
    if (!e) return;
    try {
      const res = await getUser(e);
      if (!res || res.length === 0) { toast.warn("User not found"); return; }
      const u = res[0];
      if (admins.some((a) => a._id === u._id)) { toast.info("Admin already added"); return; }
      setAdmins((p) => [...p, u]);
      toast.success("Admin added");
    } catch (err) {
      toast.error("Failed to search user");
    }
  };

  const verifyGst = async () => {
    const g = gstin.trim().toUpperCase();
    if (!g) { toast.warn("Enter GSTIN to verify"); return; }
    if (!validateGSTIN(g)) { toast.error("Invalid GSTIN format"); return; }
    setGstLoading(true);
    try {
      const data = await getGST(g);
      setGstVerified(true);
      setBusinessName((prev) => prev || data.business_name || "");
      setStateName(data.state || "");
      setCompanyType(data.company_type);
      toast.success("GST verified — details autofilled");
    } catch {
      setGstVerified(false);
      toast.error("GST verification failed");
    } finally {
      setGstLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (hasGst && !gstin.trim()) { toast.warn("Please enter GST Number"); return; }
    if (!businessName.trim()) { toast.warn("Firm Name is required"); return; }
    if (!ownerName.trim()) { toast.warn("Contact Person is required"); return; }
    if (!bankAccount.trim()) { toast.warn("Bank account number is required"); return; }
    if (!bankIFSC.trim() || !validateIFSC(bankIFSC.trim().toUpperCase())) {
      toast.warn("Valid IFSC is required"); return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        name: businessName.trim(), company_type: companyType,
        owner: { full_name: ownerName.trim(), email: ownerEmail.trim() || undefined },
        admins: admins.map((a) => a._id),
        bank_details: { account_number: bankAccount.trim(), ifsc: bankIFSC.trim().toUpperCase() },
        status: "active", kyc_documents: [],
      };
      if (hasGst && gstin) payload.gstin = gstin.trim().toUpperCase();
      if (address.trim()) payload.address = address.trim();
      if (stateName.trim()) payload.state = stateName.trim();

      if (panFile) {
        try {
          const panData = await createAmazonS3(
            `kyc/pan/${Date.now()}-${panFile.name.replace(/ /g, "_")}`,
            await fileToBase64(panFile)
          );
          payload.kyc_documents.push({ section: "PAN", document_type: "PAN", value: panData.url, is_optional: false });
        } catch { console.warn("PAN upload skipped"); }
      }
      if (chequeFile) {
        try {
          const chequeData = await createAmazonS3(
            `kyc/cheque/${Date.now()}-${chequeFile.name.replace(/ /g, "_")}`,
            await fileToBase64(chequeFile)
          );
          payload.kyc_documents.push({ section: "BANK", document_type: "CANCELLED_CHEQUE", value: chequeData.url, is_optional: false });
        } catch { console.warn("Cheque upload skipped"); }
      }

      await createPool(payload);
      toast.success("Business account created!");
      handleNext();
    } catch {
      toast.error("Failed to create account. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={s.page}>
        <div style={s.card}>
          {/* Header */}
          <div style={s.header}>
            <div>
              <h4 style={s.title}>Business Account Setup</h4>
              <p style={s.subtitle}>Complete your KYC and banking details to get started.</p>
            </div>
            <span style={s.badge}>Onboarding</span>
          </div>

          <div style={s.body}>
            <form onSubmit={handleSubmit}>

              {/* ── Section 1: Business Info ── */}
              <p style={s.sectionLabel}>🏢 Business Information</p>
              <div style={s.grid2}>

                {/* GST Radio */}
                <div style={{ ...s.field, ...s.full }}>
                  <label style={s.label}>Do you have a GST Number?</label>
                  <div style={s.radioRow}>
                    {[{ val: true, label: "Yes" }, { val: false, label: "No" }].map(({ val, label }) => (
                      <label key={label} style={s.radioItem}>
                        <input
                          type="radio" name="gstRadio"
                          checked={hasGst === val}
                          onChange={() => setHasGst(val)}
                          style={{ accentColor: "#b55d05", width: 16, height: 16 }}
                        />
                        <span style={s.radioLabel}>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* GST Input */}
                {hasGst && (
                  <div style={{ ...s.field, ...s.full }}>
                    <label style={s.label}>GST Number</label>
                    <div style={s.inputGroup}>
                      <input
                        type="text"
                        placeholder="Enter GSTIN (e.g. 27AAPFU0939F1ZV)"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value.toUpperCase())}
                        style={s.inputGroupInput}
                      />
                      <button
                        type="button"
                        onClick={verifyGst}
                        disabled={gstLoading}
                        style={{ ...s.inputGroupBtn, ...(gstLoading ? s.btnDisabled : {}) }}
                      >
                        {gstLoading ? "Verifying…" : "Verify"}
                      </button>
                    </div>
                    {gstVerified && (
                      <span style={s.verifiedBadge}>✓ GST Verified</span>
                    )}
                  </div>
                )}

                {/* Firm Name */}
                <div style={s.field}>
                  <label style={s.label}>Firm Name</label>
                  <FI value={businessName} onChange={(e) => setBusinessName(e.target.value)} required placeholder="e.g. Acme Retail Pvt. Ltd." />
                </div>

                {/* Contact Person */}
                <div style={s.field}>
                  <label style={s.label}>Contact Person</label>
                  <FI value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required placeholder="Full name" />
                </div>

                {/* Address */}
                <div style={{ ...s.field, ...s.full }}>
                  <label style={s.label}>Business Address</label>
                  <FTA
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street, area, city, state, pincode"
                    rows={3}
                  />
                </div>

                {/* PAN Upload */}
                <div style={{ ...s.field, ...s.full }}>
                  <label style={s.label}>PAN Card</label>
                  <input
                    type="file" accept="image/*,.pdf"
                    style={s.fileInput}
                    onChange={(e: any) => { const f = e.target.files?.[0]; if (f) setPanFile(f); }}
                  />
                  <span style={s.helpText}>Upload a clear image or PDF of your PAN card</span>
                </div>
              </div>

              <hr style={s.divider} />

              {/* ── Section 2: Bank Details ── */}
              <p style={s.sectionLabel}>🏦 Bank Details</p>
              <div style={s.grid2}>
                <div style={s.field}>
                  <label style={s.label}>Account Number</label>
                  <FI value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} required placeholder="Enter account number" />
                </div>

                <div style={s.field}>
                  <label style={s.label}>IFSC Code</label>
                  <FI value={bankIFSC} onChange={(e) => setBankIFSC(e.target.value.toUpperCase())} required placeholder="e.g. HDFC0001234" />
                </div>

                <div style={{ ...s.field, ...s.full }}>
                  <label style={s.label}>Cancelled Cheque</label>
                  <input
                    type="file" accept="image/*,.pdf"
                    style={s.fileInput}
                    onChange={(e: any) => { const f = e.target.files?.[0]; if (f) setChequeFile(f); }}
                  />
                  <span style={s.helpText}>Upload a cancelled cheque for bank verification</span>
                </div>
              </div>

              <hr style={s.divider} />

              {/* ── Accordion: Additional Settings ── */}
              <details style={s.accordion}>
                <summary style={s.accordionSummary}>⚙ Additional Settings (Admins, Email)</summary>
                <div style={s.accordionBody}>
                  <div style={{ ...s.grid2, marginBottom: 0 }}>
                    <div style={{ ...s.field, ...s.full }}>
                      <label style={s.label}>Add Admin by Email</label>
                      <FI
                        type="email"
                        placeholder="Type email and press Enter"
                        onKeyDown={async (e: any) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const email = e.target.value?.trim();
                            if (email) { await handleUserSearch(email); e.target.value = ""; }
                          }
                        }}
                      />
                      {admins.length > 0 && (
                        <div style={s.tagRow}>
                          {admins.map((a) => <span key={a._id} style={s.tag}>{a.name}</span>)}
                        </div>
                      )}
                    </div>

                    <div style={{ ...s.field, ...s.full }}>
                      <label style={s.label}>Owner Email <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span></label>
                      <FI type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="For record keeping" />
                    </div>
                  </div>
                </div>
              </details>

              {/* Footer */}
              <div style={s.footer}>
                <button
                  type="submit"
                  style={{ ...s.btnPrimary, ...(submitting ? s.btnDisabled : {}) }}
                  disabled={submitting}
                >
                  {submitting ? "Creating…" : "Create Business Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default MakePool;

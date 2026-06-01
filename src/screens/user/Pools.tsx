// Pools.tsx — Card-based UI with Tailwind CSS + TypeScript
// All original logic preserved; only the visual layer has changed.

import React, { useEffect, useState } from "react";
import { getAllPools, createPool, updatePool } from "../../APIs/user/pool";
import { getUser } from "../../APIs/user/user";
import { toast } from "react-toastify";
import { createAmazonS3 } from "../../APIs/user/amazonS3";
import { getGST } from "../../APIs/user/gst";

/* ─── Types ────────────────────────────────────────────────────── */
export interface User {
  _id: string;
  name: string;
}

type Owner = {
  full_name?: string;
  email?: string;
  phone?: string;
};

type Pool = {
  _id: string;
  name: string;
  status: string;
  admins?: User[];
  wallet_balance?: number;
  created_by?: { name: string };
  createdAt?: string;
  company_type?: string;
  owner?: Owner;
  website?: string;
  business_logo?: string | File | null;
  bank_details?: {
    account_number?: string;
    ifsc?: string;
    holder_name?: string;
    cheque?: string | File | null;
    approval_status?: string;
    status_message?: string;
  };
  kyc_documents?: any[];
  gstin?: string;
  address?: string;
  state?: string;
  kyc_status: string;
};

/* ─── Constants ─────────────────────────────────────────────────── */
const COMPANY_TYPE_OPTIONS = [
  { value: "llp", label: "LLP" },
  { value: "public_limited_company", label: "Public Limited" },
  { value: "private_limited_company", label: "Private Limited" },
  { value: "partnership", label: "Partnership" },
  { value: "proprietorship", label: "Sole Proprietorship" },
  { value: "individual", label: "Individual" },
];

const TABS = [
  { key: "gst", label: "GST" },
  { key: "company", label: "Company" },
  { key: "owner", label: "Owner" },
  { key: "bank", label: "Bank" },
  { key: "kyc", label: "KYC" },
  { key: "review", label: "Review" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/* ─── Helpers ───────────────────────────────────────────────────── */
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
  });

const validateGSTIN = (g: string) =>
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(g);

const validateIFSC = (i: string) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(i);

/* ─── Shared input classes ──────────────────────────────────────── */
const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition";

const labelCls = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

/* ════════════════════════════════════════════════════════════════ */
const Pools: React.FC = () => {
  /* Table state */
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);

  /* Modal state */
  const [showModal, setShowModal] = useState(false);
  const [editingPool, setEditingPool] = useState<Pool | null>(null);
  const [tabKey, setTabKey] = useState<TabKey>("gst");

  /* Form state */
  const [gst, setGst] = useState({
    gstin: "", loading: false, verified: false,
    company_type: "", business_name: "", legal_name: "",
    address: "", state: "", message: "",
  });

  const [businessDetails, setBusinessDetails] = useState({
    name: "", logo: null as File | string | null, website: "",
  });

  const [companyType, setCompanyType] = useState("individual");

  const [owner, setOwner] = useState({ full_name: "", email: "", phone: "" });

  const [bankDetails, setBankDetails] = useState({
    account_number: "", account_number_confirm: "",
    ifsc: "", holder_name: "", cheque: null as File | string | null,
  });

  const [kycFiles, setKycFiles] = useState({ pan: null as File | string | null });
  const [adminList, setAdminList] = useState<User[]>([]);
  const [agree, setAgree] = useState(false);

  /* Effects */
  useEffect(() => { fetchInitialData(); }, [page, limit]);

  /* API Calls */
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const data = await getAllPools(page, limit);
      setPools(data.data);
      setTotalRecords(data.total);
    } catch { toast.error("Failed to load pools"); }
    finally { setLoading(false); }
  };

  /* Modal management */
  const resetWizard = () => {
    setEditingPool(null); setTabKey("gst");
    setGst({ gstin: "", loading: false, verified: false, company_type: "", business_name: "", legal_name: "", address: "", state: "", message: "" });
    setBusinessDetails({ name: "", logo: null, website: "" });
    setCompanyType("individual");
    setOwner({ full_name: "", email: "", phone: "" });
    setBankDetails({ account_number: "", account_number_confirm: "", ifsc: "", holder_name: "", cheque: null });
    setKycFiles({ pan: null });
    setAdminList([]); setAgree(false);
  };

  const openNewPoolModal = () => { resetWizard(); setShowModal(true); };
  const handleClose = () => { setShowModal(false); resetWizard(); };

  const handleEdit = (pool: Pool) => {
    setEditingPool(pool);
    if (pool.gstin) {
      setGst(prev => ({ ...prev, gstin: pool.gstin || "", verified: !!pool.gstin, company_type: pool.company_type || "", business_name: pool.name || "", address: pool.address || "", state: pool.state || "" }));
    }
    setBusinessDetails({ name: pool.name || "", logo: pool.business_logo || null, website: pool.website || "" });
    setCompanyType(pool.company_type || "individual");
    setOwner({ full_name: pool.owner?.full_name || "", email: pool.owner?.email || "", phone: pool.owner?.phone || "" });
    setBankDetails({ account_number: pool.bank_details?.account_number || "", account_number_confirm: pool.bank_details?.account_number || "", ifsc: pool.bank_details?.ifsc || "", holder_name: pool.bank_details?.holder_name || "", cheque: pool.bank_details?.cheque || null });
    setAdminList(pool.admins || []);
    setTabKey("gst"); setShowModal(true);
  };

  const handleToggleStatus = async (pool: Pool) => {
    const newStatus = pool.status === "active" ? "inactive" : "active";
    if (!window.confirm(`Mark this pool as ${newStatus}?`)) return;
    try {
      await updatePool(pool._id, { status: newStatus });
      fetchInitialData();
      toast.success(`Pool status updated to ${newStatus}`);
    } catch { toast.error("Failed to update status"); }
  };

  /* Admin management */
  const handleUserSearch = async (email: string) => {
    const trimmed = email.trim();
    if (!trimmed) return;
    try {
      const user = await getUser(trimmed);
      if (!user || user.length === 0) { toast.warn("User not found"); return; }
      const u = user[0];
      if (adminList.some(a => a._id === u._id)) { toast.info("Already added"); return; }
      setAdminList(prev => [...prev, u]);
      toast.success("Admin added");
    } catch { toast.error("Error searching user"); }
  };

  const removeAdmin = (id: string) => setAdminList(adminList.filter(a => a._id !== id));

  /* GST */
  const verifyGst = async () => {
    const gstin = gst.gstin.trim();
    if (!gstin) { toast.warn("Please enter GSTIN"); return; }
    if (!validateGSTIN(gstin)) { toast.error("Invalid GSTIN format"); return; }
    setGst(s => ({ ...s, loading: true, message: "" }));
    try {
      const data = await getGST(gstin);
      const ct = data.company_type?.replaceAll(" ", "_").toLowerCase() || "";
      setGst({ gstin, loading: false, verified: true, company_type: ct, business_name: data.business_name || "", legal_name: data.business_name || "", address: data.address || "", state: data.state || "", message: "GST verified successfully" });
      setBusinessDetails(b => ({ ...b, name: data.business_name || b.name }));
      setCompanyType(ct || "individual");
      toast.success("GST verified and details autofilled");
    } catch {
      setGst(s => ({ ...s, loading: false, verified: false, message: "GST verification failed" }));
      toast.error("GST verification failed");
    }
  };

  /* Validation */
  const validateForm = (): boolean => {
    if (!businessDetails.name.trim()) { toast.error("Business name is required"); setTabKey("gst"); return false; }
    if (!companyType) { toast.error("Company type is required"); setTabKey("company"); return false; }
    if (!owner.full_name.trim()) { toast.error("Owner name is required"); setTabKey("owner"); return false; }
    if (!bankDetails.account_number.trim()) { toast.error("Bank account number is required"); setTabKey("bank"); return false; }
    if (bankDetails.account_number !== bankDetails.account_number_confirm) { toast.error("Account numbers do not match"); setTabKey("bank"); return false; }
    if (!bankDetails.ifsc.trim()) { toast.error("IFSC code is required"); setTabKey("bank"); return false; }
    if (!validateIFSC(bankDetails.ifsc)) { toast.error("Invalid IFSC code format"); setTabKey("bank"); return false; }
    if (!bankDetails.holder_name.trim()) { toast.error("Account holder name is required"); setTabKey("bank"); return false; }
    if (!kycFiles.pan && !editingPool) { toast.error("PAN card is required"); setTabKey("kyc"); return false; }
    if (!bankDetails.cheque && !editingPool) { toast.error("Cancelled cheque is required"); setTabKey("kyc"); return false; }
    if (!agree) { toast.error("Please confirm all details are correct"); setTabKey("review"); return false; }
    return true;
  };

  /* Submit */
  const transformAndSubmit = async (status: "active" | "draft" = "active") => {
    if (status === "active" && !validateForm()) { toast.error("Please fill all the details in different tabs."); return; }
    try {
      const payload: any = {
        name: businessDetails.name, company_type: companyType,
        website: businessDetails.website || undefined,
        admins: adminList.map(a => a._id),
        owner: { full_name: owner.full_name || undefined, email: owner.email || undefined, phone: owner.phone || undefined },
        bank_details: { account_number: bankDetails.account_number || undefined, ifsc: bankDetails.ifsc || undefined, holder_name: bankDetails.holder_name || undefined },
        kyc_documents: [], status,
      };
      if (gst.verified) { payload.gstin = gst.gstin; payload.address = gst.address; payload.state = gst.state; }
      if (businessDetails.logo instanceof File) {
        const d = await createAmazonS3(`logos/${Date.now()}-${businessDetails.logo.name.replace(/ /g, "_")}`, await fileToBase64(businessDetails.logo));
        payload.business_logo = d.url;
      } else if (typeof businessDetails.logo === "string") payload.business_logo = businessDetails.logo;
      if (kycFiles.pan) {
        if (kycFiles.pan instanceof File) {
          const d = await createAmazonS3(`kyc/${Date.now()}-${kycFiles.pan.name.replace(/ /g, "_")}`, await fileToBase64(kycFiles.pan));
          payload.kyc_documents.push({ section: "PAN", document_type: "PAN", value: d.url, is_optional: false });
        } else payload.kyc_documents.push({ section: "PAN", document_type: "PAN", value: kycFiles.pan, is_optional: false });
      }
      if (bankDetails.cheque) {
        if (bankDetails.cheque instanceof File) {
          const d = await createAmazonS3(`cheques/${Date.now()}-${bankDetails.cheque.name.replace(/ /g, "_")}`, await fileToBase64(bankDetails.cheque));
          payload.bank_details.cheque = d.url;
        } else payload.bank_details.cheque = bankDetails.cheque;
      }
      if (editingPool) { await updatePool(editingPool._id, payload); toast.success(status === "active" ? "Pool updated" : "Progress saved"); }
      else { await createPool(payload); toast.success(status === "active" ? "Pool created" : "Progress saved"); }
      fetchInitialData(); handleClose();
    } catch (e) { toast.error("Failed to save pool"); console.error(e); }
  };

  /* ─── Status helpers ──────────────────────────────────────────── */
  const statusColor: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    inactive: "bg-slate-100 text-slate-500 border border-slate-200",
    draft: "bg-amber-100 text-amber-700 border border-amber-200",
  };

  const kycColor: Record<string, string> = {
    approved: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    pending: "bg-amber-100 text-amber-700 border border-amber-200",
    rejected: "bg-red-100 text-red-600 border border-red-200",
  };

  /* ─── Pagination helpers ───────────────────────────────────────── */
  const totalPages = Math.ceil(totalRecords / limit);
  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, totalRecords);

  /* ════════════════════════════════════════════════════════════════
     TAB PANELS
  ════════════════════════════════════════════════════════════════ */
  const GSTTab = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">GST Verification</h3>
        <p className="text-xs text-slate-400">Optional — autofills company info if valid</p>
      </div>

      <div>
        <label className={labelCls}>GSTIN</label>
        <div className="flex gap-2">
          <input
            className={inputCls + " flex-1"}
            placeholder="e.g. 22AAAAA0000A1Z5"
            value={gst.gstin}
            onChange={e => setGst(s => ({ ...s, gstin: e.target.value.toUpperCase() }))}
          />
          <button
            type="button"
            onClick={verifyGst}
            disabled={gst.loading}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-95 disabled:opacity-60 transition"
          >
            {gst.loading ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block" /> : "Verify"}
          </button>
        </div>
      </div>

      {gst.verified && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-1">
          <p className="font-semibold text-slate-800">{gst.business_name}</p>
          <p className="text-xs text-slate-500">{gst.legal_name}</p>
          <p className="text-xs text-slate-500">{gst.address}</p>
          <span className="inline-block mt-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs text-white font-medium">✓ GST Verified</span>
        </div>
      )}

      {gst.message && (
        <p className={`text-xs font-medium ${gst.verified ? "text-emerald-600" : "text-amber-600"}`}>{gst.message}</p>
      )}

      <div className="border-t border-slate-100 pt-4">
        <label className={labelCls}>Business Name <span className="text-red-500">*</span></label>
        <input
          className={inputCls}
          placeholder="Enter business name"
          value={businessDetails.name}
          onChange={e => setBusinessDetails({ ...businessDetails, name: e.target.value })}
        />
      </div>
    </div>
  );

  const CompanyTab = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">Company Information</h3>
      </div>

      <div>
        <label className={labelCls}>Company Type <span className="text-red-500">*</span></label>
        <select
          className={inputCls}
          value={companyType}
          onChange={e => setCompanyType(e.target.value)}
          disabled={gst.verified}
        >
          <option value="">Select Company Type</option>
          {COMPANY_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {gst.verified && <p className="text-xs text-slate-400 mt-1">Auto-filled from GST verification</p>}
      </div>

      <div>
        <label className={labelCls}>Website</label>
        <input
          className={inputCls}
          type="url"
          placeholder="https://example.com"
          value={businessDetails.website}
          onChange={e => setBusinessDetails({ ...businessDetails, website: e.target.value })}
        />
      </div>

      <div>
        <label className={labelCls}>Business Logo</label>
        <div className="flex items-center gap-4">
          {businessDetails.logo && typeof businessDetails.logo === "string" && (
            <img src={businessDetails.logo} alt="logo" className="h-14 w-14 rounded-xl object-contain border border-slate-200 bg-slate-50" />
          )}
          <label className="cursor-pointer rounded-xl border-2 border-dashed border-slate-200 px-5 py-3 text-sm text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition">
            Click to upload image
            <input type="file" accept="image/*" className="hidden" onChange={(e: any) => { const f = e.target.files?.[0]; if (f) setBusinessDetails({ ...businessDetails, logo: f }); }} />
          </label>
        </div>
      </div>
    </div>
  );

  const OwnerTab = () => {
    const [emailInput, setEmailInput] = useState("");
    return (
      <div className="space-y-5">
        <h3 className="text-base font-semibold text-slate-800">Owner / Authorized Person</h3>

        <div>
          <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
          <input className={inputCls} placeholder="Name of authorized person" value={owner.full_name} onChange={e => setOwner({ ...owner, full_name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Email</label>
            <input className={inputCls} type="email" placeholder="Email address" value={owner.email} onChange={e => setOwner({ ...owner, email: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input className={inputCls} type="tel" placeholder="Phone number" value={owner.phone} onChange={e => setOwner({ ...owner, phone: e.target.value })} />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <label className={labelCls}>Add Admin by Email</label>
          <div className="flex gap-2">
            <input
              className={inputCls + " flex-1"}
              type="email"
              placeholder="Enter email and press Enter or click Add"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              onKeyDown={async e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  await handleUserSearch(emailInput);
                  setEmailInput("");
                }
              }}
            />
            <button
              type="button"
              onClick={async () => { await handleUserSearch(emailInput); setEmailInput(""); }}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-95 transition"
            >Add</button>
          </div>
          {adminList.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {adminList.map(a => (
                <span key={a._id} className="flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-medium text-indigo-700">
                  {a.name}
                  <button type="button" onClick={() => removeAdmin(a._id)} className="text-indigo-400 hover:text-red-500 transition">✕</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const BankTab = () => (
    <div className="space-y-5">
      <h3 className="text-base font-semibold text-slate-800">Bank Details</h3>

      <div>
        <label className={labelCls}>Account Number <span className="text-red-500">*</span></label>
        <input className={inputCls} placeholder="Bank account number" value={bankDetails.account_number} onChange={e => setBankDetails({ ...bankDetails, account_number: e.target.value })} />
      </div>

      <div>
        <label className={labelCls}>Confirm Account Number <span className="text-red-500">*</span></label>
        <input
          className={inputCls + (bankDetails.account_number_confirm && bankDetails.account_number !== bankDetails.account_number_confirm ? " border-red-400 focus:border-red-400 focus:ring-red-100" : "")}
          placeholder="Re-enter account number"
          value={bankDetails.account_number_confirm}
          onChange={e => setBankDetails({ ...bankDetails, account_number_confirm: e.target.value })}
        />
        {bankDetails.account_number_confirm && bankDetails.account_number !== bankDetails.account_number_confirm && (
          <p className="text-xs text-red-500 mt-1">Account numbers do not match</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>IFSC Code <span className="text-red-500">*</span></label>
          <input className={inputCls} placeholder="e.g. SBIN0001234" value={bankDetails.ifsc} onChange={e => setBankDetails({ ...bankDetails, ifsc: e.target.value.toUpperCase() })} />
        </div>
        <div>
          <label className={labelCls}>Account Holder Name <span className="text-red-500">*</span></label>
          <input className={inputCls} placeholder="As per bank records" value={bankDetails.holder_name} onChange={e => setBankDetails({ ...bankDetails, holder_name: e.target.value })} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Cancelled Cheque <span className="text-red-500">*</span></label>
        <label className="flex flex-col items-center justify-center gap-2 cursor-pointer rounded-xl border-2 border-dashed border-slate-200 p-6 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition">
          {bankDetails.cheque instanceof File ? (
            <span className="text-sm text-emerald-600 font-medium">✓ {bankDetails.cheque.name}</span>
          ) : bankDetails.cheque ? (
            <a href={bankDetails.cheque as string} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 underline" onClick={e => e.stopPropagation()}>View uploaded cheque</a>
          ) : (
            <>
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              <span className="text-sm">Upload image or PDF</span>
            </>
          )}
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e: any) => { const f = e.target.files?.[0]; if (f) setBankDetails({ ...bankDetails, cheque: f }); }} />
        </label>
      </div>
    </div>
  );

  const KYCTab = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-slate-800">KYC Documents</h3>
        <p className="text-xs text-slate-400">Required for remittances</p>
      </div>

      <div>
        <label className={labelCls}>PAN Card <span className="text-red-500">*</span></label>
        <label className="flex flex-col items-center justify-center gap-2 cursor-pointer rounded-xl border-2 border-dashed border-slate-200 p-6 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition">
          {kycFiles.pan instanceof File ? (
            <span className="text-sm text-emerald-600 font-medium">✓ {kycFiles.pan.name}</span>
          ) : kycFiles.pan ? (
            <a href={kycFiles.pan as string} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 underline" onClick={e => e.stopPropagation()}>View uploaded PAN</a>
          ) : (
            <>
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              <span className="text-sm">Upload image or PDF</span>
            </>
          )}
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e: any) => { const f = e.target.files?.[0]; if (f) setKycFiles(k => ({ ...k, pan: f })); }} />
        </label>
      </div>

      {bankDetails.cheque && (
        <div className="rounded-xl bg-sky-50 border border-sky-200 px-4 py-3 text-sm text-sky-700">
          ✓ Cancelled cheque already uploaded in Bank Details
        </div>
      )}
    </div>
  );

  const ReviewTab = () => (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-slate-800">Review & Confirm</h3>

      {/* Business */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Business</p>
        <p className="text-sm font-medium text-slate-800">{businessDetails.name || "—"}</p>
        <p className="text-xs text-slate-500">{COMPANY_TYPE_OPTIONS.find(c => c.value === companyType)?.label || "—"}</p>
        {businessDetails.website && <p className="text-xs text-slate-500">{businessDetails.website}</p>}
        {gst.verified && <span className="inline-block mt-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs text-white">GST Verified</span>}
      </div>

      {/* Owner */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Owner</p>
        <p className="text-sm font-medium text-slate-800">{owner.full_name || "—"}</p>
        {owner.email && <p className="text-xs text-slate-500">{owner.email}</p>}
        {owner.phone && <p className="text-xs text-slate-500">{owner.phone}</p>}
      </div>

      {/* Admins */}
      {adminList.length > 0 && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Admins ({adminList.length})</p>
          {adminList.map(a => <p key={a._id} className="text-xs text-slate-600">• {a.name}</p>)}
        </div>
      )}

      {/* Bank */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Bank</p>
        <p className="text-xs text-slate-600">Account: {bankDetails.account_number ? `****${bankDetails.account_number.slice(-4)}` : "—"}</p>
        <p className="text-xs text-slate-600">IFSC: {bankDetails.ifsc || "—"}</p>
        <p className="text-xs text-slate-600">Holder: {bankDetails.holder_name || "—"}</p>
        {bankDetails.cheque && <span className="inline-block mt-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs text-white">Cheque Uploaded</span>}
      </div>

      {/* KYC */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">KYC Documents</p>
        <p className="text-xs text-slate-600">PAN: {kycFiles.pan ? (typeof kycFiles.pan === "string" ? <a href={kycFiles.pan} target="_blank" rel="noreferrer" className="text-indigo-600 underline">View</a> : (kycFiles.pan as File).name) : "Not uploaded"}</p>
        <p className="text-xs text-slate-600">Cancelled Cheque: {bankDetails.cheque ? (typeof bankDetails.cheque === "string" ? <a href={bankDetails.cheque as string} target="_blank" rel="noreferrer" className="text-indigo-600 underline">View</a> : (bankDetails.cheque as File).name) : "Not uploaded"}</p>
      </div>

      {/* Agreement */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-indigo-600" checked={agree} onChange={e => setAgree(e.target.checked)} />
        <span className="text-sm text-slate-700">I confirm all details are correct and agree to the terms</span>
      </label>

      <div className="rounded-xl bg-sky-50 border border-sky-200 px-4 py-3 text-xs text-sky-700">
        After submission, our team will verify documents within 48 working hours.
      </div>
    </div>
  );

  const tabContent: Record<TabKey, React.ReactNode> = {
    gst: <GSTTab />,
    company: <CompanyTab />,
    owner: <OwnerTab />,
    bank: <BankTab />,
    kyc: <KYCTab />,
    review: <ReviewTab />,
  };

  /* ════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 p-6 font-sans">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pools</h1>
          <p className="text-sm text-slate-500 mt-0.5">{totalRecords} total pools</p>
        </div>
        <button
          onClick={openNewPoolModal}
          className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add New Pool
        </button>
      </div>

      {/* ── Card Grid ───────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          <p className="text-sm text-slate-400">Loading pools…</p>
        </div>
      ) : pools.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
            <svg className="h-8 w-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <p className="text-slate-400 text-sm">No pools found. Create your first one!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pools.map(pool => (
            <div
              key={pool._id}
              className="group relative flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
            >
              {/* Top accent bar */}
              <div className={`h-1.5 w-full ${pool.status === "active" ? "bg-gradient-to-r from-emerald-400 to-teal-400" : pool.status === "inactive" ? "bg-slate-200" : "bg-amber-300"}`} />

              <div className="p-5 flex flex-col flex-1 gap-4">
                {/* Logo + Name */}
                <div className="flex items-start gap-3">
                  {pool.business_logo && typeof pool.business_logo === "string" ? (
                    <img src={pool.business_logo} alt={pool.name} className="h-10 w-10 rounded-xl object-contain border border-slate-100 bg-slate-50 flex-shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-base font-bold text-indigo-400">{pool.name?.[0]?.toUpperCase() || "P"}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <button
                      onClick={() => handleEdit(pool)}
                      className="text-sm font-semibold text-slate-800 hover:text-indigo-600 transition text-left leading-snug truncate max-w-full block"
                    >
                      {pool.name}
                    </button>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {COMPANY_TYPE_OPTIONS.find(c => c.value === pool.company_type)?.label || pool.company_type || "—"}
                    </p>
                  </div>
                </div>

                {/* Badges row */}
                <div className="flex flex-wrap gap-1.5">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor[pool.status] || statusColor["draft"]}`}>
                    {pool.status}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${kycColor[pool.kyc_status] || "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                    KYC: {pool.kyc_status}
                  </span>
                </div>

                {/* Wallet */}
                <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Wallet</span>
                  <span className={`text-sm font-bold ${pool.wallet_balance && pool.wallet_balance > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                    ₹{pool.wallet_balance?.toFixed(2) || "0.00"}
                  </span>
                </div>

                {/* Meta */}
                <div className="space-y-1 text-xs text-slate-400">
                  {pool.created_by?.name && <p>By <span className="text-slate-600">{pool.created_by.name}</span></p>}
                  {pool.createdAt && <p>{new Date(pool.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>}
                </div>

                {/* Action */}
                <div className="mt-auto pt-1">
                  {pool.kyc_status === "approved" ? (
                    <button
                      onClick={() => handleToggleStatus(pool)}
                      className={`w-full rounded-xl py-2 text-xs font-semibold transition active:scale-95 ${pool.status === "active" ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"}`}
                    >
                      {pool.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                  ) : (
                    <div className="w-full rounded-xl py-2 text-center text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200">
                      KYC Pending
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────── */}
      {!loading && totalRecords > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            Showing <span className="font-medium text-slate-700">{startRecord}–{endRecord}</span> of <span className="font-medium text-slate-700">{totalRecords}</span>
          </p>
          <div className="flex items-center gap-2">
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm outline-none focus:border-indigo-300"
              value={limit}
              onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
            >
              {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
            </select>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
            >← Prev</button>
            <span className="text-sm text-slate-500">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
            >Next →</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          WIZARD MODAL
      ══════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={handleClose} />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-white shadow-2xl flex flex-col max-h-[90vh]">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{editingPool ? "Edit Pool" : "Create New Pool"}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Step {TABS.findIndex(t => t.key === tabKey) + 1} of {TABS.length}: {TABS.find(t => t.key === tabKey)?.label}</p>
              </div>
              <button onClick={handleClose} className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">✕</button>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-slate-100">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                style={{ width: `${((TABS.findIndex(t => t.key === tabKey) + 1) / TABS.length) * 100}%` }}
              />
            </div>

            {/* Tab pills */}
            <div className="flex gap-1 px-6 py-3 overflow-x-auto scrollbar-none border-b border-slate-100">
              {TABS.map((tab, i) => {
                const active = tab.key === tabKey;
                const done = TABS.findIndex(t => t.key === tabKey) > i;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setTabKey(tab.key)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${active ? "bg-indigo-600 text-white" : done ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "text-slate-500 hover:bg-slate-50"}`}
                  >
                    <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${active ? "bg-white/20" : done ? "bg-emerald-200 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                      {done ? "✓" : i + 1}
                    </span>
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <form
              onSubmit={e => { e.preventDefault(); transformAndSubmit("active"); }}
              noValidate
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {tabContent[tabKey]}
              </div>

              {/* Modal footer */}
              <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between gap-3">
                <div className="flex gap-2">
                  {TABS.findIndex(t => t.key === tabKey) > 0 && (
                    <button
                      type="button"
                      onClick={() => setTabKey(TABS[TABS.findIndex(t => t.key === tabKey) - 1].key)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                    >← Back</button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => transformAndSubmit("draft")}
                    className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition"
                  >Save Draft</button>
                  {TABS.findIndex(t => t.key === tabKey) < TABS.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setTabKey(TABS[TABS.findIndex(t => t.key === tabKey) + 1].key)}
                      className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-95 transition"
                    >Next →</button>
                  ) : (
                    <button
                      type="submit"
                      className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-95 transition"
                    >{editingPool ? "Update Pool" : "Create Pool"}</button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pools;
export { Pools };

import React, { useState, useRef, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";

import { createWarehouse } from "../../APIs/user/warehouse";
import { drpCrmBaseUrl } from "../../axios/urls";

const GOOGLE_MAPS_API_KEY = "AIzaSyANgy6kbp_ciumVNTAwakMFTXdCW3rVZfg";
const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };
const LIBRARIES: "places"[] = ["places"];

export interface Warehouse {
  _id?: string;
  name: string;
  address1: string;
  address2?: string;
  City: string;
  State: string;
  Country?: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
}

const INDIAN_STATES = [
  "Andaman and Nicobar Islands","Andhra Pradesh","Arunachal Pradesh","Assam",
  "Bihar","Chandigarh","Chhattisgarh","Dadra and Nagar Haveli and Daman and Diu",
  "Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jammu and Kashmir",
  "Jharkhand","Karnataka","Kerala","Ladakh","Lakshadweep","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Puducherry",
  "Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal",
];

const getAddressComponent = (
  components: google.maps.GeocoderAddressComponent[],
  type: string
): string => {
  const match = components.find((c) => c.types.includes(type));
  return match ? match.long_name : "";
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f5f6fa",
    padding: "20px 16px",
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    maxWidth: 860,
    margin: "0 auto",
    background: "#ffffff",
    borderRadius: 12,
    boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
    overflow: "hidden",
  },
  cardHeader: {
    padding: "18px 28px 16px",
    borderBottom: "1px solid #f0f1f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.2px",
  },
  subtitle: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  badge: {
    background: "#fff7ed",
    color: "#f5891e",
    border: "1px solid #fed7aa",
    borderRadius: 20,
    padding: "3px 10px",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.3px",
    whiteSpace: "nowrap" as const,
  },
  cardBody: {
    padding: "22px 28px",
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "1px",
    textTransform: "uppercase" as const,
    color: "#94a3b8",
    marginBottom: 10,
  },
  mapBox: {
    borderRadius: 10,
    overflow: "hidden",
    border: "1.5px solid #e2e8f0",
    marginBottom: 24,
    background: "#f8fafc",
  },
  mapSearchWrap: {
    padding: "10px 12px 9px",
    borderBottom: "1px solid #e2e8f0",
    background: "#fff",
  },
  mapSearchInput: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 7,
    border: "1.5px solid #e2e8f0",
    fontSize: 13,
    color: "#1e293b",
    outline: "none",
    background: "#f8fafc",
    transition: "border-color 0.2s",
    boxSizing: "border-box" as const,
  },
  coordBar: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "8px 12px",
    background: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
    fontSize: 11,
    color: "#64748b",
  },
  coordItem: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  coordLabel: {
    fontWeight: 600,
    color: "#475569",
  },
  coordSuccess: {
    marginLeft: "auto",
    color: "#16a34a",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  divider: {
    border: "none",
    borderTop: "1px solid #f0f1f5",
    margin: "0 0 20px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px 20px",
  },
  formGridFull: {
    gridColumn: "1 / -1",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#374151",
  },
  input: {
    padding: "8px 11px",
    borderRadius: 7,
    border: "1.5px solid #e2e8f0",
    fontSize: 13,
    color: "#1e293b",
    background: "#fff",
    outline: "none",
    transition: "border-color 0.18s, box-shadow 0.18s",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  inputFocus: {
    borderColor: "#f5891e",
    boxShadow: "0 0 0 3px rgba(245,137,30,0.1)",
  },
  select: {
    padding: "8px 11px",
    borderRadius: 7,
    border: "1.5px solid #e2e8f0",
    fontSize: 13,
    color: "#1e293b",
    background: "#fff",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
    cursor: "pointer",
    appearance: "auto" as const,
  },
  sectionDivider: {
    borderTop: "1px solid #f0f1f5",
    margin: "20px 0 16px",
  },
  footerRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20,
    paddingTop: 18,
    borderTop: "1px solid #f0f1f5",
  },
  btnSecondary: {
    padding: "8px 18px",
    borderRadius: 7,
    border: "1.5px solid #e2e8f0",
    background: "#fff",
    color: "#475569",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnPrimary: {
    padding: "8px 22px",
    borderRadius: 7,
    border: "none",
    background: "#f5891e",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "0.1px",
  },
  btnDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
  helpText: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
};

const FocusInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{ ...styles.input, ...(focused ? styles.inputFocus : {}), ...props.style }}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
    />
  );
};

const MakeWarehouse: React.FC<{ handleNext: () => void }> = ({ handleNext }) => {
  const [submitting, setSubmitting] = useState(false);
  const [fetchingPincode, setFetchingPincode] = useState(false);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [email, setEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [formAddress1, setFormAddress1] = useState("");
  const [formAddress2, setFormAddress2] = useState("");
  const [formPincode, setFormPincode] = useState("");
  const [formPerson, setFormPerson] = useState("");
  const [formPhone, setFormPhone] = useState("");

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const resetForm = () => {
    setCity(""); setState(""); setEmail(""); setFormName("");
    setFormAddress1(""); setFormAddress2(""); setFormPincode("");
    setFormPerson(""); setFormPhone(""); setMarkerPosition(null);
  };

  const fillAddressFromPlace = (place: google.maps.places.PlaceResult) => {
    if (!place.address_components) return;
    const c = place.address_components;

    const premise = getAddressComponent(c, "premise");
    const sublocality =
      getAddressComponent(c, "sublocality_level_1") ||
      getAddressComponent(c, "sublocality") ||
      getAddressComponent(c, "neighborhood");
    const route = getAddressComponent(c, "route");
    const parts = [premise, sublocality, route].filter(Boolean);
    if (parts.length > 0) setFormAddress2(parts.join(", "));

    const locality =
      getAddressComponent(c, "locality") ||
      getAddressComponent(c, "administrative_area_level_3");
    if (locality) setCity(locality);

    const stateName = getAddressComponent(c, "administrative_area_level_1");
    if (stateName) {
      const exact = INDIAN_STATES.find((s) => s.toLowerCase() === stateName.toLowerCase());
      if (exact) setState(exact);
      else {
        const partial = INDIAN_STATES.find((s) => s.toLowerCase().includes(stateName.toLowerCase()));
        setState(partial || stateName.charAt(0).toUpperCase() + stateName.slice(1).toLowerCase());
      }
    }

    const pincode = getAddressComponent(c, "postal_code");
    if (pincode) setFormPincode(pincode);
  };

  const reverseGeocode = (lat: number, lng: number) => {
    if (!window.google) return;
    new google.maps.Geocoder().geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        fillAddressFromPlace(results[0] as unknown as google.maps.places.PlaceResult);
      }
    });
  };

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat(), lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      reverseGeocode(lat, lng);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setMarkerPosition({ lat, lng });
        map?.panTo({ lat, lng });
        map?.setZoom(15);
        fillAddressFromPlace(place);
      } else {
        toast.error("No details available for: '" + place.name + "'");
      }
    }
  };

  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setFormPincode(value);
    if (value.length === 6) {
      try {
        setFetchingPincode(true);
        const { data } = await axios.get(`${drpCrmBaseUrl}/pincode?pincode=${value}`);
        if (Array.isArray(data) && data.length > 0) {
          const info = data[0];
          setCity(info.district || "");
          setState(info.statename.charAt(0).toUpperCase() + info.statename.slice(1).toLowerCase() || "");
        }
      } catch {
        toast.warn("Failed to fetch city/state from pincode");
      } finally {
        setFetchingPincode(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city || !state) { toast.warn("City and State are required"); return; }
    setSubmitting(true);
    const payload: Warehouse = {
      name: formName.trim(), address1: formAddress1.trim(),
      address2: formAddress2.trim() || undefined,
      City: city, State: state, Country: "IN", pincode: formPincode,
      contact_person: formPerson.trim(), contact_phone: formPhone.trim(),
      contact_email: email.trim(),
      latitude: markerPosition?.lat, longitude: markerPosition?.lng,
    };
    try {
      await createWarehouse(payload);
      toast.success("Warehouse created successfully");
      handleNext(); resetForm();
    } catch (err) {
      console.error(err); toast.error("Failed to create warehouse");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={styles.page}>
        <div style={styles.card}>
          {/* Header */}
          <div style={styles.cardHeader}>
            <div>
              <h4 style={styles.title}>Create Warehouse</h4>
              <p style={styles.subtitle}>Set up a fulfillment location to start receiving orders.</p>
            </div>
            <span style={styles.badge}>Onboarding</span>
          </div>

          <div style={styles.cardBody}>
            {/* Map Section */}
            <p style={styles.sectionLabel}>📍 Location</p>
            <div style={styles.mapBox}>
              {isLoaded ? (
                <>
                  <div style={styles.mapSearchWrap}>
                    <Autocomplete
                      onLoad={(ac) => (autocompleteRef.current = ac)}
                      onPlaceChanged={onPlaceChanged}
                      options={{ componentRestrictions: { country: "in" } }}
                    >
                      <input
                        type="text"
                        placeholder="Search location (e.g. Okhla Phase 3, Delhi)"
                        style={styles.mapSearchInput}
                        onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                      />
                    </Autocomplete>
                  </div>
                  <div style={{ height: 240, width: "100%" }}>
                    <GoogleMap
                      mapContainerStyle={{ height: "100%", width: "100%" }}
                      center={markerPosition || DEFAULT_CENTER}
                      zoom={markerPosition ? 15 : 5}
                      onLoad={(m) => setMap(m)}
                      onClick={onMapClick}
                      options={{ streetViewControl: false, mapTypeControl: false }}
                    >
                      {markerPosition && <Marker position={markerPosition} />}
                    </GoogleMap>
                  </div>
                  <div style={styles.coordBar}>
                    <span style={styles.coordItem}>
                      <span style={styles.coordLabel}>Lat:</span>
                      {markerPosition?.lat.toFixed(6) ?? "—"}
                    </span>
                    <span style={styles.coordItem}>
                      <span style={styles.coordLabel}>Lng:</span>
                      {markerPosition?.lng.toFixed(6) ?? "—"}
                    </span>
                    {markerPosition && (
                      <span style={styles.coordSuccess}>✓ Location pinned</span>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>Loading map…</div>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              {/* Warehouse Details */}
              <p style={styles.sectionLabel}>🏭 Warehouse Details</p>
              <div style={styles.formGrid}>
                <div style={{ ...styles.fieldGroup, ...styles.formGridFull }}>
                  <label style={styles.label}>Warehouse Name</label>
                  <FocusInput value={formName} onChange={(e) => setFormName(e.target.value)} required placeholder="e.g. Delhi Central Warehouse" />
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Address Line 1</label>
                  <FocusInput value={formAddress1} onChange={(e) => setFormAddress1(e.target.value)} required placeholder="Building / flat no., floor" />
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Address Line 2</label>
                  <FocusInput value={formAddress2} onChange={(e) => setFormAddress2(e.target.value)} placeholder="Street / area / locality" />
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Pincode</label>
                  <FocusInput
                    value={formPincode} maxLength={6} inputMode="numeric"
                    onChange={handlePincodeChange} required placeholder="6-digit pincode"
                  />
                  {fetchingPincode && <span style={styles.helpText}>Fetching location…</span>}
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>City</label>
                  <FocusInput value={city} onChange={(e) => setCity(e.target.value)} required placeholder="City" />
                </div>

                <div style={{ ...styles.fieldGroup, ...styles.formGridFull }}>
                  <label style={styles.label}>State</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                    style={styles.select}
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <hr style={styles.sectionDivider} />

              {/* Contact Details */}
              <p style={styles.sectionLabel}>👤 Contact Details</p>
              <div style={styles.formGrid}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Contact Person</label>
                  <FocusInput value={formPerson} onChange={(e) => setFormPerson(e.target.value)} required placeholder="Full name" />
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Contact Phone</label>
                  <FocusInput
                    value={formPhone} onChange={(e) => setFormPhone(e.target.value)}
                    pattern="[6-9]\d{9}" required maxLength={10} inputMode="numeric"
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div style={{ ...styles.fieldGroup, ...styles.formGridFull }}>
                  <label style={styles.label}>Contact Email</label>
                  <FocusInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@company.com" />
                </div>
              </div>

              {/* Footer */}
              <div style={styles.footerRow}>
                <button type="button" style={styles.btnSecondary} onClick={resetForm}>
                  Reset
                </button>
                <button
                  type="submit"
                  style={{ ...styles.btnPrimary, ...(submitting || fetchingPincode ? styles.btnDisabled : {}) }}
                  disabled={submitting || fetchingPincode}
                >
                  {submitting ? "Creating…" : "Create Warehouse"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default MakeWarehouse;

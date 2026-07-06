import { useState, useRef, useEffect } from "react";
import { C } from "../data.js";

export default function CustomSelect({ value, onChange, options, placeholder = "Select an option..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = value || placeholder;

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: "11px 14px",
          background: C.input,
          border: `1px solid ${C.border}`,
          borderRadius: 7,
          color: C.textPrimary,
          fontSize: 13,
          outline: "none",
          boxSizing: "border-box",
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>{selectedLabel}</span>
        <span style={{ fontSize: 10 }}>{isOpen ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            background: "#ffffff",
            border: `2px solid #000000`,
            borderRadius: 7,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
            zIndex: 9999,
            maxHeight: 300,
            overflowY: "auto",
            minWidth: "100%",
          }}
        >
          {options && options.length > 0 ? (
            options.map((option, idx) => (
              <div
                key={`${option}-${idx}`}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: value === option ? "#e0e0e0" : "#ffffff",
                  color: "#000000",
                  fontSize: 14,
                  fontWeight: value === option ? 600 : 400,
                  textAlign: "left",
                  cursor: "pointer",
                  borderBottom: `1px solid #e0e0e0`,
                  transition: "all 0.15s",
                  boxSizing: "border-box",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f0f0f0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = value === option ? "#e0e0e0" : "#ffffff";
                }}
              >
                {value === option ? "✓ " : "  "}
                {option}
              </div>
            ))
          ) : (
            <div style={{ padding: "12px 14px", color: "#666666" }}>No options</div>
          )}
        </div>
      )}
    </div>
  );
}

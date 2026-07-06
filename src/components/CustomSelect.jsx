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
            border: `1px solid ${C.border}`,
            borderRadius: 7,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            zIndex: 1000,
            maxHeight: 250,
            overflowY: "auto",
          }}
        >
          {options.map((option) => (
            <button
              key={option}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "none",
                background: value === option ? `${C.primary}20` : "transparent",
                color: "#000000",
                fontSize: 13,
                textAlign: "left",
                cursor: "pointer",
                borderBottom: `1px solid ${C.border}`,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${C.primary}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = value === option ? `${C.primary}20` : "transparent";
              }}
            >
              {value === option && "✓ "}
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

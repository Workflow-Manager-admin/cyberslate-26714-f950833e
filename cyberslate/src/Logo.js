import React from "react";

/**
 * PUBLIC_INTERFACE
 * Logo component for CyberRecon Suite:
 * Renders an SVG with concentric orange circles (inner dot + outer ring with gap)
 * and displays the app name in a modern, tech-inspired font.
 *
 * Props:
 *   size (number) - Diameter of the logo in px
 *   fontSize (string/number) - Font size for the text
 *   direction ("row"|"column") - Layout direction
 *   gap (number) - gap between icon and text
 *   hideText (boolean) - Only show symbol (for icon-only spots)
 */
function Logo({
  size = 32,
  fontSize = "1.35rem",
  direction = "row",
  gap = 12,
  hideText = false,
  style = {},
  textStyle = {},
  ...props
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: direction,
        alignItems: "center",
        gap,
        userSelect: "none",
        ...style,
      }}
      aria-label="CyberRecon Suite Logo"
      {...props}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 38 38"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          display: "block",
          minWidth: size,
          minHeight: size,
          maxWidth: size,
          maxHeight: size,
        }}
        aria-hidden="true"
        focusable="false"
      >
        {/* Outer ring */}
        <circle
          cx="19"
          cy="19"
          r="15"
          stroke="#ff9800"
          strokeWidth="4.6"
          fill="none"
        />
        {/* Inner solid dot */}
        <circle
          cx="19"
          cy="19"
          r="6"
          fill="#ff9800"
        />
      </svg>
      {!hideText && (
        <span
          style={{
            fontFamily: "'Orbitron', 'Poppins', 'Inter', 'Segoe UI', Arial, sans-serif",
            fontWeight: 700,
            fontSize,
            letterSpacing: "0.07em",
            color: "var(--text-color)",
            textShadow: "0 3px 10px #1a1a1ad2",
            ...textStyle,
          }}
        >
          CyberRecon Suite
        </span>
      )}
    </span>
  );
}

export default Logo;

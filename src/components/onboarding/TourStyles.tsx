'use client';

/**
 * Custom styles for driver.js tour (B5 Onboarding)
 *
 * These styles override the default driver.js theme to match GANO's design system.
 * Injected as a style tag to ensure they load properly with the component.
 */
export function TourStyles() {
  return (
    <style jsx global>{`
      /* Driver.js custom theme for GANO */
      .driver-popover.gano-tour-popover {
        background-color: hsl(var(--surface));
        border: 1px solid hsl(var(--border));
        border-radius: 12px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        color: hsl(var(--primary));
        max-width: 340px;
      }

      .driver-popover.gano-tour-popover .driver-popover-title {
        font-size: 16px;
        font-weight: 600;
        color: hsl(var(--primary));
        margin-bottom: 8px;
      }

      .driver-popover.gano-tour-popover .driver-popover-description {
        font-size: 14px;
        color: hsl(var(--secondary));
        line-height: 1.5;
      }

      .driver-popover.gano-tour-popover .driver-popover-progress-text {
        font-size: 12px;
        color: hsl(var(--muted));
        font-family: var(--font-jetbrains), monospace;
      }

      .driver-popover.gano-tour-popover .driver-popover-navigation-btns {
        gap: 8px;
      }

      .driver-popover.gano-tour-popover .driver-popover-prev-btn {
        background-color: transparent;
        border: 1px solid hsl(var(--border));
        color: hsl(var(--secondary));
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.15s ease;
      }

      .driver-popover.gano-tour-popover .driver-popover-prev-btn:hover {
        background-color: hsl(var(--background));
        color: hsl(var(--primary));
      }

      .driver-popover.gano-tour-popover .driver-popover-next-btn,
      .driver-popover.gano-tour-popover .driver-popover-close-btn {
        background-color: hsl(var(--accent));
        color: white;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        border: none;
        transition: all 0.15s ease;
      }

      .driver-popover.gano-tour-popover .driver-popover-next-btn:hover,
      .driver-popover.gano-tour-popover .driver-popover-close-btn:hover {
        background-color: hsl(var(--accent) / 0.9);
      }

      /* Highlight overlay */
      .driver-overlay {
        background-color: rgba(0, 0, 0, 0.7);
      }

      /* Highlighted element */
      .driver-active-element {
        border-radius: 8px;
      }

      /* Arrow styling */
      .driver-popover.gano-tour-popover .driver-popover-arrow {
        border-color: hsl(var(--surface));
      }

      .driver-popover.gano-tour-popover .driver-popover-arrow-side-left {
        border-left-color: hsl(var(--surface));
      }

      .driver-popover.gano-tour-popover .driver-popover-arrow-side-right {
        border-right-color: hsl(var(--surface));
      }

      .driver-popover.gano-tour-popover .driver-popover-arrow-side-top {
        border-top-color: hsl(var(--surface));
      }

      .driver-popover.gano-tour-popover .driver-popover-arrow-side-bottom {
        border-bottom-color: hsl(var(--surface));
      }

      /* Close button in header */
      .driver-popover.gano-tour-popover .driver-popover-close-btn-inside {
        color: hsl(var(--muted));
        opacity: 0.7;
      }

      .driver-popover.gano-tour-popover .driver-popover-close-btn-inside:hover {
        opacity: 1;
        color: hsl(var(--secondary));
      }

      /* Footer section */
      .driver-popover.gano-tour-popover .driver-popover-footer {
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid hsl(var(--border));
      }
    `}</style>
  );
}

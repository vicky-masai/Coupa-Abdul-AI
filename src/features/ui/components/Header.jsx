import { useState, useRef, useEffect } from "react";
import EllipsesIcon from "../icons/EllipsesIcon";
import CrossIcon from "../icons/CrossIcon";
import { useOaf } from "../../oaf/useOaf";
import { VITE_APP_TITLE } from "../../oaf/viteEnv.js";
import { EVENT_TYPES, LABELS, STYLES } from "../constants";

const { MENU_ITEM_CLASSES } = STYLES;

// Prefer `VITE_APP_TITLE` in `.env`; otherwise constants / default.
const TITLE =
  VITE_APP_TITLE ||
  LABELS?.APP_TITLE?.trim?.() ||
  "Abdul AI Agent";

// Header component for the Oaf App UI
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const {
    minimiseApp,
    maximiseApp,
    makeAppSidepanel,
    dockAppToLeft,
    dockAppToRight,
    closeApp,
  } = useOaf();

  // Ref for the menu to detect outside clicks
  const menuRef = useRef(null);

  const toggleMenu = (e) => {
    e.stopPropagation(); // Prevent immediate close from body click
    setIsMenuOpen((prev) => !prev);
  };

  // Effect to close menu when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener(EVENT_TYPES.MOUSE_DOWN, handleClickOutside);
    return () =>
      document.removeEventListener(EVENT_TYPES.MOUSE_DOWN, handleClickOutside);
  }, [isMenuOpen]);

  // Helper to call an action and update minimized state
  const handleAction = (action) => {
    setIsMenuOpen(false); // Close menu
    action(); // Call the action
  };

  return (
    <div className="sticky top-0 z-20">
      <div className="bg-white border border-gray-200 rounded-lg shadow-xl flex flex-col h-full">
        {/* Header/Title Bar */}
        <header className="coupa-primary text-white p-3 flex items-center justify-between rounded-t-lg shadow-md cursor-grab">
          {/* App Title */}
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-semibold truncate">{TITLE}</h1>
          </div>

          {/* Controls: Ellipsis menu and Close button */}
          <div className="relative flex items-center space-x-1" ref={menuRef}>
            {/* Ellipsis Menu Toggle */}
            <button
              onClick={toggleMenu}
              className="p-2 control-btn coupa-accent-hover"
              title="Options"
            >
              <EllipsesIcon className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div
                id="control-menu"
                className="absolute right-0 top-full mt-3 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 origin-top-right animate-in fade-in-0 zoom-in-95"
              >
                {[
                  { action: minimiseApp, label: LABELS.HEADER_LABELS.MINIMIZE },
                  { action: maximiseApp, label: LABELS.HEADER_LABELS.MAXIMIZE },
                  {
                    action: makeAppSidepanel,
                    label: LABELS.HEADER_LABELS.MAKE_SIDE_PANEL,
                  },
                  {
                    action: dockAppToLeft,
                    label: LABELS.HEADER_LABELS.DOCK_TO_LEFT,
                  },
                  {
                    action: dockAppToRight,
                    label: LABELS.HEADER_LABELS.DOCK_TO_RIGHT,
                  },
                ].map(({ action, label }) => (
                  <button
                    key={label}
                    onClick={() => handleAction(action)}
                    className={MENU_ITEM_CLASSES}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={() => handleAction(closeApp)}
              className="p-2 control-btn transition-colors hover:bg-red-600"
              title="Close App"
            >
              <CrossIcon className="w-5 h-5" />
            </button>
          </div>
        </header>
      </div>
    </div>
  );
};

export default Header;
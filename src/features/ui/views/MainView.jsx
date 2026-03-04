// src/features/ui/views/MainView.jsx
import React from "react";
import ExpandedView from "./ExpandedView";
import MinimisedView from "./MinimisedView";
import { useOaf } from "../../oaf/useOaf";
import { LAYOUT_STATES } from "../../oaf/oafConstants";

// ⬇️ Add this import to show the create-user form in Expanded mode
import CreateCoupaUser from "../../users/CreateCoupaUser";

const MainView = () => {
  const { currLayoutState } = useOaf();

  // When NOT minimized, we render your ExpandedView AND the user form
  return (
    <div>
      {currLayoutState === LAYOUT_STATES.MINIMIZED ? (
        <MinimisedView />
      ) : (
        <>
          <ExpandedView />
          <div style={{ marginTop: 16 }}>
            <CreateCoupaUser />
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(MainView);
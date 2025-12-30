import React, { createContext, useState } from 'react';

export const SessionContext = createContext({
  selectedSessionId: null,
  setSelectedSessionId: () => {},
  sessionData: null,
  setSessionData: () => {},
});

export function SessionProvider({ children }) {
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  return (
    <SessionContext.Provider
      value={{
        selectedSessionId,
        setSelectedSessionId,
        sessionData,
        setSessionData,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
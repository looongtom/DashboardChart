import React, { createContext, useState } from 'react';

export const SessionContext = createContext({
  selectedSessionId: null,
  setSelectedSessionId: () => {},
  selectedSessionName: null,
  setSelectedSessionName: () => {},
  sessionMessages: null,
  setSessionMessages: () => {},
  sessionData: null,
  setSessionData: () => {},
});

export function SessionProvider({ children }) {
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [selectedSessionName, setSelectedSessionName] = useState(null);
  const [sessionMessages, setSessionMessages] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  return (
    <SessionContext.Provider
      value={{
        selectedSessionId,
        setSelectedSessionId,
        selectedSessionName,
        setSelectedSessionName,
        sessionMessages,
        setSessionMessages,
        sessionData,
        setSessionData,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
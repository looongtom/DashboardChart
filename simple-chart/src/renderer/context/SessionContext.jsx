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
  isRecording: false,
  setIsRecording: () => {},
  activeSessionId: null,
  setActiveSessionId: () => {},
  activeSessionName: null,
  setActiveSessionName: () => {},
});

export function SessionProvider({ children }) {
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [selectedSessionName, setSelectedSessionName] = useState(null);
  const [sessionMessages, setSessionMessages] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeSessionName, setActiveSessionName] = useState(null);

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
        isRecording,
        setIsRecording,
        activeSessionId,
        setActiveSessionId,
        activeSessionName,
        setActiveSessionName,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
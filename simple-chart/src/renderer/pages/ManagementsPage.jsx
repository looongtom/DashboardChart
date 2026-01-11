import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/managements.css';
import { SessionContext } from '../context/SessionContext';
import { fetchSessionMessages, fetchSessions, startDetailSession, startRecordingSession, stopRecordingSession } from '../js/sessionApi';

function ManagementsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);
  const navigate = useNavigate();
  const { 
    setSelectedSessionId, 
    setSelectedSessionName, 
    setSessionMessages,
    isRecording,
    setIsRecording,
    activeSessionId,
    setActiveSessionId,
    activeSessionName,
    setActiveSessionName
  } = useContext(SessionContext);

  // Fetch sessions on component mount and when recording state changes
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        setError(null);
        const sessionsData = await fetchSessions();
        
        // If there's an active recording session, ensure it's in the list and marked as running
        if (isRecording && activeSessionId) {
          const activeSessionIndex = sessionsData.findIndex(s => s.id === activeSessionId);
          if (activeSessionIndex >= 0) {
            // Update existing session to running status
            sessionsData[activeSessionIndex] = {
              ...sessionsData[activeSessionIndex],
              status: 'running'
            };
          } else {
            // Add active session to the top of the list
            sessionsData.unshift({
              id: activeSessionId,
              name: activeSessionName || `Session_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}`,
              status: 'running',
              startTime: new Date().toLocaleString('vi-VN'),
              endTime: null,
              records: 0
            });
          }
        }
        
        setSessions(sessionsData);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError(err.message || 'Không thể tải danh sách phiên. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [isRecording, activeSessionId, activeSessionName]);

  const filteredSessions = sessions.filter(session =>
    session.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatNumber = (num) => {
    return num.toLocaleString('vi-VN');
  };

  const handleViewDetails = async (sessionId) => {
    try {
      console.log('View details for session:', sessionId);

      // Tìm session để lấy tên
      const session = sessions.find(s => s.id === sessionId);
      
      if (!session) {
        console.error('Session not found:', sessionId);
        return;
      }
      
      // Lưu session đang chọn vào context
      setSelectedSessionId(sessionId);
      setSelectedSessionName(session.name || `Session_${sessionId}`);

      // If this is the active recording session, it's live data
      if (sessionId === activeSessionId && session.status === 'running') {
        // For live session, we'll let DashboardPage handle it
        // Just navigate and DashboardPage will detect it's a live session
        navigate('/');
        return;
      }

      // For ended sessions, fetch historical data
      const messages = await fetchSessionMessages(sessionId);
      if (messages && messages.length > 0) {
        setSessionMessages(messages);
        console.log(`Loaded ${messages.length} messages for session ${sessionId}`);
      } else {
        console.warn('No messages found for session:', sessionId);
        setSessionMessages([]);
      }

      // Start payload message streaming for historical data
      try {
        await startDetailSession();
      } catch (error) {
        console.error('Error starting detail session:', error);
        // Don't block navigation if this fails
      }

      // Điều hướng sang Dashboard để xem chi tiết
      navigate('/');
    } catch (error) {
      console.error('Error viewing session details:', error);
      alert('Có lỗi xảy ra khi tải chi tiết phiên. Vui lòng thử lại.');
    }
  };

  const generateSessionName = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    return `Session_${dateStr}_${timeStr}`;
  };

  const handleStartRecording = async () => {
    try {
      console.log('Starting new recording session...');
      const result = await startRecordingSession();
      
      // Generate session name if not provided by API
      const sessionName = result.sessionName || generateSessionName();
      const startTime = result.startTime || new Date().toLocaleString('vi-VN');
      
      // Update context with active session info
      setIsRecording(true);
      setActiveSessionId(result.sessionId);
      setActiveSessionName(sessionName);
      
      // Add new session to the top of the list
      const newSession = {
        id: result.sessionId,
        name: sessionName,
        status: 'running',
        startTime: startTime,
        endTime: null,
        records: 0
      };
      
      setSessions(prevSessions => [newSession, ...prevSessions]);
      
      console.log('Recording session started successfully:', result);
    } catch (error) {
      console.error('Error starting recording session:', error);
      alert('Có lỗi xảy ra khi bắt đầu phiên ghi log. Vui lòng thử lại.');
    }
  };

  const handleStopRecording = async () => {
    if (!activeSessionId) {
      console.error('No active session to stop');
      setShowStopConfirmation(false);
      return;
    }

    try {
      console.log('Stopping recording session:', activeSessionId);
      const result = await stopRecordingSession(activeSessionId);
      
      const endTime = result.endTime || new Date().toLocaleString('vi-VN');
      const totalRecords = result.totalRecords || 0;
      
      // Update context
      setIsRecording(false);
      
      // Update session in the list
      setSessions(prevSessions => 
        prevSessions.map(session => 
          session.id === activeSessionId
            ? {
                ...session,
                status: 'ended',
                endTime: endTime,
                records: totalRecords
              }
            : session
        )
      );
      
      // Clear active session
      setActiveSessionId(null);
      setActiveSessionName(null);
      
      setShowStopConfirmation(false);
      console.log('Recording session stopped successfully:', result);
    } catch (error) {
      console.error('Error stopping recording session:', error);
      alert('Có lỗi xảy ra khi dừng phiên ghi log. Vui lòng thử lại.');
      setShowStopConfirmation(false);
    }
  };

  const handleDownload = (sessionId) => {
    console.log('Download session:', sessionId);
    // Implement download logic
  };

  const handleDelete = (sessionId) => {
    console.log('Delete session:', sessionId);
    // Implement delete logic
  };

  return (
    <div className="managements-page">
      <div className="managements-header">
        <h1 className="page-title">Quản lý Phiên Log</h1>
        <p className="page-subtitle">Tổng hợp và quản lý các phiên ghi log của hệ thống</p>
      </div>

      <div className="managements-actions">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm theo tên phiên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="filter-button">
          <span className="filter-icon">⚙️</span>
          Lọc
        </button>
        <button 
          className={isRecording ? "stop-session-button" : "create-session-button"}
          onClick={isRecording ? () => setShowStopConfirmation(true) : handleStartRecording}
        >
          {isRecording ? 'Dừng phiên log' : 'Bắt đầu phiên log mới'}
        </button>
        <button className="import-log-button">
          <span className="import-icon">📤</span>
          Import Log
        </button>
      </div>

      <div className="managements-table-container">
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Đang tải danh sách phiên...</p>
          </div>
        )}
        {error && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
            <p>Lỗi: {error}</p>
          </div>
        )}
        {!loading && !error && (
          <table className="managements-table">
            <thead>
              <tr>
                <th>TÊN PHIÊN</th>
                <th>TRẠNG THÁI</th>
                <th>THỜI GIAN</th>
                <th>SỐ BẢN TIN</th>
                <th>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                    Không có phiên nào
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr key={session.id}>
                    <td className="session-name">{session.name}</td>
                    <td>
                      <div className="status-cell">
                        <span className={`status-dot ${session.status}`}></span>
                        <span className="status-text">
                          {session.status === 'running' ? 'Đang chạy' : 'Đã kết thúc'}
                        </span>
                      </div>
                    </td>
                    <td className="time-cell">
                      {session.endTime 
                        ? `${session.startTime} → ${session.endTime}`
                        : session.startTime
                      }
                    </td>
                    <td className="records-cell">{formatNumber(session.records)}</td>
                    <td>
                      <div className="actions-cell">
                        <button 
                          className="view-details-button"
                          onClick={() => handleViewDetails(session.id)}
                        >
                          Xem chi tiết
                        </button>
                        <button 
                          className="icon-button"
                          onClick={() => handleDownload(session.id)}
                          title="Tải xuống"
                        >
                          ⬇️
                        </button>
                        <button 
                          className="icon-button"
                          onClick={() => handleDelete(session.id)}
                          title="Xóa"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Stop Confirmation Modal */}
      {showStopConfirmation && (
        <div className="confirmation-modal-overlay" onClick={() => setShowStopConfirmation(false)}>
          <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirmation-title">Xác nhận dừng phiên</h3>
            <p className="confirmation-message">
              Bạn có chắc chắn muốn dừng phiên ghi log hiện tại không?
            </p>
            <div className="confirmation-buttons">
              <button 
                className="confirmation-button cancel-button"
                onClick={() => setShowStopConfirmation(false)}
              >
                Hủy
              </button>
              <button 
                className="confirmation-button confirm-button"
                onClick={handleStopRecording}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagementsPage;


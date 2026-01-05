import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/managements.css';
import { SessionContext } from '../context/SessionContext';
import { fetchSessionMessages, fetchSessions, startDetailSession } from '../js/sessionApi';

function ManagementsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { setSelectedSessionId, setSelectedSessionName, setSessionMessages } = useContext(SessionContext);

  // Fetch sessions on component mount
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        setError(null);
        const sessionsData = await fetchSessions();
        setSessions(sessionsData);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError(err.message || 'Không thể tải danh sách phiên. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

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

      // Fetch danh sách bản tin trong phiên này
      const messages = await fetchSessionMessages(sessionId);
      if (messages && messages.length > 0) {
        setSessionMessages(messages);
        console.log(`Loaded ${messages.length} messages for session ${sessionId}`);
      } else {
        console.warn('No messages found for session:', sessionId);
        setSessionMessages([]);
      }

      // Start payload message streaming
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
        <button className="create-session-button">
          + Tạo phiên Online
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
    </div>
  );
}

export default ManagementsPage;


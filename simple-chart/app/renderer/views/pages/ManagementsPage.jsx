import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/managements.css';
import { SessionContext } from '../context/SessionContext';
import { fetchSessionMessages } from '../js/sessionApi';

const mockSessions = [
  {
    id: 1,
    name: 'Session_20241230_001',
    status: 'running',
    startTime: '2024-12-30 08:00',
    endTime: null,
    records: 1543
  },
  {
    id: 2,
    name: 'Session_20241229_005',
    status: 'ended',
    startTime: '2024-12-29 14:30',
    endTime: '2024-12-29 16:45',
    records: 3421
  },
  {
    id: 3,
    name: 'Session_20241229_003',
    status: 'ended',
    startTime: '2024-12-29 09:15',
    endTime: '2024-12-29 11:20',
    records: 2156
  },
  {
    id: 4,
    name: 'Session_20241228_012',
    status: 'ended',
    startTime: '2024-12-28 16:00',
    endTime: '2024-12-28 18:30',
    records: 4892
  }
];

function ManagementsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sessions] = useState(mockSessions);
  const navigate = useNavigate();
  const { setSelectedSessionId, setSelectedSessionName, setSessionMessages } = useContext(SessionContext);

  const filteredSessions = sessions.filter(session =>
    session.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatNumber = (num) => {
    return num.toLocaleString('vi-VN');
  };

  const handleViewDetails = async (sessionId) => {
    console.log('View details for session:', sessionId);

    // Tìm session để lấy tên
    const session = sessions.find(s => s.id === sessionId);
    
    // Lưu session đang chọn vào context
    setSelectedSessionId(sessionId);
    setSelectedSessionName(session?.name || `Session_${sessionId}`);

    // Mock call API để lấy danh sách bản tin trong phiên này
    const messages = await fetchSessionMessages(sessionId);
    setSessionMessages(messages);

    // Điều hướng sang Dashboard để xem chi tiết
    navigate('/');
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
            {filteredSessions.map((session) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ManagementsPage;


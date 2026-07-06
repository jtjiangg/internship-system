import React, { useState, useEffect } from 'react';
import CompanyDirectory from '/workspaces/internship-system/client/CompanyDirectory.jsx';

function Dashboard({ user, onLogout }) {
  // View Router State: 'home', 'logbook', or 'companies'
  const [currentView, setCurrentView] = useState('home');
  
  const [logbooks, setLogbooks] = useState([]);
  
  // Logbook Form State
  const [date, setDate] = useState('');
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [report, setReport] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);

  const fetchLogbooks = async () => {
    const token = localStorage.getItem('internship_token');
    try {
      const response = await fetch('/api/logbooks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLogbooks(data);
      }
    } catch (error) {
      console.error("Failed to fetch logbooks:", error);
    }
  };

  useEffect(() => {
    fetchLogbooks();
  }, []);

  const handleLogbookSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('internship_token');

    const formData = new FormData();
    formData.append('date', date);
    formData.append('clock_in', clockIn);
    formData.append('clock_out', clockOut);
    formData.append('task_description', report);
    if (evidenceFile) {
      formData.append('evidence', evidenceFile);
    }

    try {
      const response = await fetch('/api/logbooks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}` 
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        alert("Success! Your logbook entry has been safely saved.");
        setDate(''); setClockIn(''); setClockOut(''); setReport(''); setEvidenceFile(null);
        setCurrentView('home'); // Go back to home after submitting
        fetchLogbooks(); // Refresh the table
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Could not connect to the server.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* --- GLOBAL HEADER --- */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Welcome back, {user?.full_name}!</h1>
            <p className="text-gray-600 mt-1">Role: {user?.role}</p>
          </div>
          <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
            Logout
          </button>
        </div>

        {/* --- VIEW ROUTER --- */}

        {/* 1. COMPANY DIRECTORY VIEW */}
        {currentView === 'companies' && (
          <CompanyDirectory onBack={() => setCurrentView('home')} />
        )}

        {/* 2. LOGBOOK FORM VIEW */}
        {currentView === 'logbook' && (
          <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">New Logbook Entry</h2>
              <button onClick={() => setCurrentView('home')} className="text-gray-500 hover:text-gray-800 font-semibold">
                &larr; Back to Dashboard
              </button>
            </div>

            <form onSubmit={handleLogbookSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Date:</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Clock In:</label>
                  <input type="time" value={clockIn} onChange={(e) => setClockIn(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded" required />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Clock Out:</label>
                  <input type="time" value={clockOut} onChange={(e) => setClockOut(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded" required />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Report / Description:</label>
                <textarea value={report} onChange={(e) => setReport(e.target.value)} rows="4" placeholder="Describe the tasks you completed today..." className="w-full px-4 py-2 border border-gray-300 rounded" required></textarea>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Upload Evidence (Photos / PDF Documents):</label>
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={(e) => setEvidenceFile(e.target.files[0])} 
                  className="w-full px-4 py-2 border border-gray-300 rounded bg-gray-50 file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                />
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded mt-4">
                Submit Entry
              </button>
            </form>
          </div>
        )}

        {/* 3. HOME VIEW (Action Grid + History Table) */}
        {currentView === 'home' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Daily Logbook</h2>
                <p className="text-gray-600 mb-4">Submit and track your daily activities and progress.</p>
                <button onClick={() => setCurrentView('logbook')} className="text-blue-600 font-semibold hover:underline">
                  + New Entry
                </button>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-green-500">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Company List</h2>
                <p className="text-gray-600 mb-4">Browse approved companies for your internship placement.</p>
                <button onClick={() => setCurrentView('companies')} className="text-green-600 font-semibold hover:underline">
                  View Companies &rarr;
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800">Your Logbook History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                      <th className="px-6 py-3 font-semibold">Date</th>
                      <th className="px-6 py-3 font-semibold">Time / Duration</th>
                      <th className="px-6 py-3 font-semibold">Report</th>
                      <th className="px-6 py-3 font-semibold">Evidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {logbooks.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                          No logbook entries found. Click "+ New Entry" to create your first report!
                        </td>
                      </tr>
                    ) : (
                      logbooks.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                            {new Date(log.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <span className="font-medium">{log.clock_in?.substring(0,5)} - {log.clock_out?.substring(0,5)}</span>
                            <br/>
                            <span className="text-xs text-gray-400">({Number(log.hours_worked).toFixed(1)} hrs)</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                            {log.task_description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {log.evidence_url ? (
                              <a 
                                href={log.evidence_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-blue-600 hover:underline font-semibold"
                              >
                                View File
                              </a>
                            ) : (
                              <span className="text-gray-400">None</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
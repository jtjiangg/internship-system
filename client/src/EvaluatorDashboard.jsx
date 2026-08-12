import React, { useState, useEffect } from 'react';

function EvaluatorDashboard({ user, onLogout }) {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [logbooks, setLogbooks] = useState([]);
  
  // --- NEW: Modal State for File Viewer ---
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  // Fetch assigned students
  useEffect(() => {
    const fetchStudents = async () => {
      const token = sessionStorage.getItem('internship_token');
      try {
        const response = await fetch('/api/evaluator/students', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setStudents(data);
        }
      } catch (error) {
        console.error("Failed to fetch students:", error);
      }
    };
    fetchStudents();
  }, []);

  // Fetch logbooks for the selected student
  useEffect(() => {
    if (!selectedStudent) {
      setLogbooks([]);
      return;
    }
    
    const fetchStudentLogbooks = async () => {
      const token = sessionStorage.getItem('internship_token');
      try {
        const response = await fetch(`/api/evaluator/logbooks/${selectedStudent}`, {
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
    fetchStudentLogbooks();
  }, [selectedStudent]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto relative">
        
        {/* --- GLOBAL HEADER --- */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 flex justify-between items-center border-t-4 border-purple-600">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Evaluator Dashboard</h1>
            <p className="text-gray-600 mt-1">{user?.full_name} | Role: {user?.role.replace('_', ' ')}</p>
          </div>
          <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded">
            Logout
          </button>
        </div>

        {/* --- STUDENT SELECTOR --- */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <label className="block text-gray-700 font-bold mb-2">Select a Student Intern to View Logbooks:</label>
          <select 
            value={selectedStudent} 
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 outline-none bg-gray-50"
          >
            <option value="">-- Choose a Student --</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.full_name} ({student.email})
              </option>
            ))}
          </select>
        </div>

        {/* --- LOGBOOKS TABLE --- */}
        {selectedStudent && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-purple-50 px-6 py-4 border-b border-purple-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Internship Logbooks</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold">Time / Duration</th>
                    <th className="px-6 py-3 font-semibold w-1/2">Report</th>
                    <th className="px-6 py-3 font-semibold text-center">Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logbooks.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        No logbooks submitted by this student yet.
                      </td>
                    </tr>
                  ) : (
                    logbooks.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-medium">
                          {new Date(log.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <span className="font-medium">{log.clock_in?.substring(0,5)} - {log.clock_out?.substring(0,5)}</span>
                          <br/>
                          <span className="text-xs text-gray-400">({Number(log.hours_worked).toFixed(1)} hrs)</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {log.task_description}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          {log.evidence_url ? (
                            // 👇 Updated button to trigger the Modal instead of opening a new tab
                            <button 
                              onClick={() => setSelectedEvidence(log.evidence_url)}
                              className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1 rounded-full text-sm font-semibold transition-colors shadow-sm"
                            >
                              View Evidence
                            </button>
                          ) : (
                            <span className="text-gray-400 text-sm italic">None</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
      </div>

      {/* --- EVIDENCE VIEWER MODAL --- */}
      {selectedEvidence && (
        <div 
          className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" 
          onClick={() => setSelectedEvidence(null)} // Close when clicking outside the box
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-5xl w-full p-4 relative flex flex-col max-h-[90vh]" 
            onClick={e => e.stopPropagation()} // Stop click from passing through to background
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-xl font-bold text-gray-800">Attached Evidence</h3>
              <button 
                onClick={() => setSelectedEvidence(null)} 
                className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-1 rounded font-bold transition-colors"
              >
                Close
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-auto bg-gray-100 rounded border border-gray-300 flex justify-center items-center p-2">
              {selectedEvidence.toLowerCase().endsWith('.pdf') ? (
                <iframe 
                  src={selectedEvidence} 
                  className="w-full h-[75vh] rounded" 
                  title="PDF Evidence"
                ></iframe>
              ) : (
                <img 
                  src={selectedEvidence} 
                  alt="Evidence" 
                  className="max-w-full max-h-[75vh] object-contain rounded" 
                />
              )}
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

export default EvaluatorDashboard;
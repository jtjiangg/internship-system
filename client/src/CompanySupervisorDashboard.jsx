import React, { useState, useEffect } from 'react';

function CompanySupervisorDashboard({ user, onLogout }) {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  
  // Rubric State based on design draft
  const [rubric, setRubric] = useState({
    attendance: 0,   // out of 20
    performance: 0,  // out of 40
    teamwork: 0,     // out of 20
    attitude: 0      // out of 20
  });

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

  useEffect(() => {
    fetchStudents();
  }, []);

  const totalScore = Number(rubric.attendance) + Number(rubric.performance) + Number(rubric.teamwork) + Number(rubric.attitude);

  const handleEvaluationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return alert("Please select a student first.");

    const token = sessionStorage.getItem('internship_token');
    
    try {
      const response = await fetch('/api/evaluator/company-score', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ student_id: selectedStudent, score: totalScore })
      });

      if (response.ok) {
        alert("Evaluation submitted successfully!");
        setRubric({ attendance: 0, performance: 0, teamwork: 0, attitude: 0 });
        setSelectedStudent('');
        fetchStudents(); // Refresh to update status
      } else {
        alert("Failed to submit evaluation.");
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 flex justify-between items-center border-t-4 border-blue-600">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Company Supervisor Dashboard</h1>
            <p className="text-gray-600 mt-1">{user?.full_name} | Final Evaluation Portal</p>
          </div>
          <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded">
            Logout
          </button>
        </div>

        {/* --- NEW: Student Information List --- */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <h2 className="text-xl font-bold text-gray-800">Assigned Student Interns</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-sm uppercase tracking-wider">
                  <th className="px-6 py-3 font-semibold">Student ID</th>
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Email</th>
                  <th className="px-6 py-3 font-semibold">Evaluation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      No students currently assigned.
                    </td>
                  </tr>
                ) : (
                  students.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-mono text-sm text-gray-500">#{student.id}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">{student.full_name}</td>
                      <td className="px-6 py-4 text-gray-600">{student.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          student.company_evaluated ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {student.company_evaluated ? `Completed (${student.company_score}/100)` : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- EXISTING: Evaluation Rubric --- */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
            <h2 className="text-xl font-bold text-gray-800">Final Evaluation (100%)</h2>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2">Select Student to Evaluate:</label>
              <select 
                value={selectedStudent} 
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">-- Choose a Student --</option>
                {students.map(student => (
                  <option key={student.id} value={student.id} disabled={student.company_evaluated}>
                    {student.full_name} {student.company_evaluated ? '(Already Evaluated)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleEvaluationSubmit}>
              <table className="w-full text-left border-collapse mb-6">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider border-y border-gray-200">
                    <th className="px-6 py-3 font-semibold">No.</th>
                    <th className="px-6 py-3 font-semibold">Rubric Criteria</th>
                    <th className="px-6 py-3 font-semibold w-32">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">1</td>
                    <td className="px-6 py-4">Attendance & Punctuality (Max 20)</td>
                    <td className="px-6 py-4">
                      <input type="number" min="0" max="20" value={rubric.attendance} onChange={(e) => setRubric({...rubric, attendance: e.target.value})} className="w-full px-2 py-1 border rounded" required />
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">2</td>
                    <td className="px-6 py-4">Technical Performance (Max 40)</td>
                    <td className="px-6 py-4">
                      <input type="number" min="0" max="40" value={rubric.performance} onChange={(e) => setRubric({...rubric, performance: e.target.value})} className="w-full px-2 py-1 border rounded" required />
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">3</td>
                    <td className="px-6 py-4">Teamwork & Communication (Max 20)</td>
                    <td className="px-6 py-4">
                      <input type="number" min="0" max="20" value={rubric.teamwork} onChange={(e) => setRubric({...rubric, teamwork: e.target.value})} className="w-full px-2 py-1 border rounded" required />
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">4</td>
                    <td className="px-6 py-4">Professional Attitude (Max 20)</td>
                    <td className="px-6 py-4">
                      <input type="number" min="0" max="20" value={rubric.attitude} onChange={(e) => setRubric({...rubric, attitude: e.target.value})} className="w-full px-2 py-1 border rounded" required />
                    </td>
                  </tr>
                  <tr className="bg-blue-50 font-bold">
                    <td colSpan="2" className="px-6 py-4 text-right">Total Score:</td>
                    <td className={`px-6 py-4 ${totalScore > 100 ? 'text-red-600' : 'text-green-600'}`}>
                      {totalScore} / 100
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <button 
                type="submit" 
                disabled={totalScore > 100 || !selectedStudent}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded transition-colors"
              >
                Submit Official Score
              </button>
            </form>
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default CompanySupervisorDashboard;
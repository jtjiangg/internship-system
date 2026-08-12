import React, { useState, useEffect } from 'react';

function LecturerSupervisorDashboard({ user, onLogout }) {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  
  // Lecturer Rubric State
  const [rubric, setRubric] = useState({
    reportQuality: 0, // Max 40
    presentation: 0,  // Max 30
    understanding: 0, // Max 30
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

  const currentLecturerTotal = Number(rubric.reportQuality) + Number(rubric.presentation) + Number(rubric.understanding);
  
  // Find the selected student's data to show the final calculation
  const activeStudentData = students.find(s => s.id === Number(selectedStudent));
  const companyScore = activeStudentData?.company_score || 0;
  
  // Calculate weighted totals
  const weightedCompany = (companyScore * 0.30).toFixed(1);
  const weightedLecturer = (currentLecturerTotal * 0.70).toFixed(1);
  const finalGrade = (Number(weightedCompany) + Number(weightedLecturer)).toFixed(1);

  const handleEvaluationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return alert("Please select a student.");

    const token = sessionStorage.getItem('internship_token');
    
    try {
      const response = await fetch('/api/evaluator/lecturer-score', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ student_id: selectedStudent, score: currentLecturerTotal })
      });

      if (response.ok) {
        alert("Evaluation submitted successfully!");
        setRubric({ reportQuality: 0, presentation: 0, understanding: 0 });
        setSelectedStudent('');
        fetchStudents();
      } else {
        alert("Failed to submit evaluation.");
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 flex justify-between items-center border-t-4 border-purple-600">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Lecturer Supervisor Dashboard</h1>
            <p className="text-gray-600 mt-1">{user?.full_name} | Academic Evaluation Portal</p>
          </div>
          <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded">
            Logout
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="bg-purple-50 px-6 py-4 border-b border-purple-100">
            <h2 className="text-xl font-bold text-gray-800">Final Evaluation</h2>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2">Select Student to Evaluate:</label>
              <select 
                value={selectedStudent} 
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="">-- Choose a Student --</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} 
                  </option>
                ))}
              </select>
            </div>

            {selectedStudent && (
              <form onSubmit={handleEvaluationSubmit}>
                <table className="w-full text-left border-collapse mb-8">
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
                      <td className="px-6 py-4">Final Report Quality (Max 40)</td>
                      <td className="px-6 py-4">
                        <input type="number" min="0" max="40" value={rubric.reportQuality} onChange={(e) => setRubric({...rubric, reportQuality: e.target.value})} className="w-full px-2 py-1 border rounded" required />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4">2</td>
                      <td className="px-6 py-4">Presentation (Max 30)</td>
                      <td className="px-6 py-4">
                        <input type="number" min="0" max="30" value={rubric.presentation} onChange={(e) => setRubric({...rubric, presentation: e.target.value})} className="w-full px-2 py-1 border rounded" required />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4">3</td>
                      <td className="px-6 py-4">System Understanding (Max 30)</td>
                      <td className="px-6 py-4">
                        <input type="number" min="0" max="30" value={rubric.understanding} onChange={(e) => setRubric({...rubric, understanding: e.target.value})} className="w-full px-2 py-1 border rounded" required />
                      </td>
                    </tr>
                    <tr className="bg-purple-50 font-bold">
                      <td colSpan="2" className="px-6 py-4 text-right">Lecturer Total:</td>
                      <td className={`px-6 py-4 ${currentLecturerTotal > 100 ? 'text-red-600' : 'text-purple-600'}`}>
                        {currentLecturerTotal} / 100
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* FINAL MARKS CALCULATION TABLE */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Total Internship Marks</h3>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-gray-600 text-sm border-b">
                        <th className="py-2">Evaluator</th>
                        <th className="py-2">Raw Score</th>
                        <th className="py-2">Weight</th>
                        <th className="py-2 text-right">Weighted Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 font-medium">Company Supervisor</td>
                        <td className="py-3">{companyScore} / 100</td>
                        <td className="py-3">30%</td>
                        <td className="py-3 text-right font-semibold">{weightedCompany}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 font-medium">Lecturer Supervisor</td>
                        <td className="py-3">{currentLecturerTotal} / 100</td>
                        <td className="py-3">70%</td>
                        <td className="py-3 text-right font-semibold">{weightedLecturer}</td>
                      </tr>
                      <tr className="text-lg">
                        <td colSpan="3" className="py-4 font-bold text-right">Final Grade:</td>
                        <td className="py-4 text-right font-bold text-purple-700">{finalGrade}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <button 
                  type="submit" 
                  disabled={currentLecturerTotal > 100}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded transition-colors"
                >
                  Confirm Final Grade
                </button>
              </form>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default LecturerSupervisorDashboard;
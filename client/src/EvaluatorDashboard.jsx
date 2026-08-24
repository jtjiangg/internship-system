import React, { useState, useEffect } from 'react';
// Import the unified design system components
import { Card, CardHeader, CardContent, Label, Select, Button } from './components/ui';

function EvaluatorDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('logbooks'); // 'logbooks' or 'evaluation'
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [logbooks, setLogbooks] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  // Evaluation State
  const [scores, setScores] = useState([0, 0, 0, 0, 0]);
  const [studentEvaluations, setStudentEvaluations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Professional Rubrics based on Role
  const rubrics = user?.role === 'Company_Supervisor' ? [
    "Practical Skills & Job Knowledge",
    "Quality of Work & Accuracy",
    "Professionalism & Work Ethic",
    "Communication & Teamwork",
    "Problem Solving & Initiative"
  ] : [
    "Application of Academic Concepts",
    "Logbook Quality & Reporting",
    "Critical Thinking & Analysis",
    "Communication & Presentation Skills",
    "Overall Professional Growth"
  ];

  // Fetch assigned students
  useEffect(() => {
    const fetchStudents = async () => {
      const token = sessionStorage.getItem('internship_token');
      try {
        const response = await fetch('/api/evaluator/students', { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) setStudents(await response.json());
      } catch (error) {
        console.error(error);
      }
    };
    fetchStudents();
  }, []);

  // Fetch logbooks and evaluations when a student is selected
  useEffect(() => {
    if (!selectedStudent) {
      setLogbooks([]);
      setStudentEvaluations([]);
      return;
    }
    
    const fetchStudentData = async () => {
      const token = sessionStorage.getItem('internship_token');
      try {
        // Fetch Logbooks
        const logRes = await fetch(`/api/evaluator/logbooks/${selectedStudent}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (logRes.ok) setLogbooks(await logRes.json());

        // Fetch Evaluations
        const evalRes = await fetch(`/api/evaluations/${selectedStudent}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (evalRes.ok) setStudentEvaluations(await evalRes.json());
      } catch (error) {
        console.error(error);
      }
    };
    fetchStudentData();
    // Reset scores when switching students
    setScores([0, 0, 0, 0, 0]); 
  }, [selectedStudent, activeTab]);

  const handleScoreChange = (index, value) => {
    const newScores = [...scores];
    newScores[index] = parseInt(value, 10);
    setScores(newScores);
  };

  const handleEvaluationSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const token = sessionStorage.getItem('internship_token');
    try {
      const response = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ student_id: selectedStudent, scores })
      });

      if (response.ok) {
        alert("Evaluation submitted successfully!");
        // Refresh evaluations to show the updated calculation table
        const evalRes = await fetch(`/api/evaluations/${selectedStudent}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (evalRes.ok) setStudentEvaluations(await evalRes.json());
      } else {
        alert("Failed to submit evaluation.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTotalScore = scores.reduce((a, b) => a + b, 0);

  // Extract scores for the final table
  const companyEval = studentEvaluations.find(e => e.evaluator_role === 'Company_Supervisor');
  const lecturerEval = studentEvaluations.find(e => e.evaluator_role === 'Lecturer');
  const companyScore = companyEval ? companyEval.total_score : 0;
  const lecturerScore = lecturerEval ? lecturerEval.total_score : 0;
  
  // Calculate weighted total (Company 30%, Lecturer 70%)
  const finalWeightedGrade = ((companyScore * 0.3) + (lecturerScore * 0.7)).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Evaluator Dashboard</h1>
            <p className="text-gray-500 mt-1">{user?.full_name} | Role: {user?.role.replace('_', ' ')}</p>
          </div>
          <Button variant="danger" onClick={onLogout}>
            Logout
          </Button>
        </div>

        {/* STUDENT SELECTOR */}
        <Card className="mb-6">
          <CardContent className="py-5">
            <Label>Select a Student Intern</Label>
            <Select 
              value={selectedStudent} 
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <option value="">-- Choose a Student --</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.full_name} ({student.email})
                </option>
              ))}
            </Select>
          </CardContent>
        </Card>

        {selectedStudent && (
          <>
            {/* NAVIGATION TABS */}
            <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg border border-gray-200 w-fit">
              <Button 
                variant={activeTab === 'logbooks' ? 'primary' : 'ghost'} 
                onClick={() => setActiveTab('logbooks')}
              >
                Review Logbooks
              </Button>
              <Button 
                variant={activeTab === 'evaluation' ? 'primary' : 'ghost'} 
                onClick={() => setActiveTab('evaluation')}
              >
                Final Evaluation
              </Button>
            </div>

            {/* VIEW: LOGBOOKS */}
            {activeTab === 'logbooks' && (
              <Card>
                <CardHeader title="Internship Logbooks" subtitle="Review daily reports and evidence" />
                <CardContent className="p-0 sm:p-6">
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-left border-collapse bg-white">
                      <thead>
                        <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                          <th className="px-4 py-4 font-semibold">Date</th>
                          <th className="px-4 py-4 font-semibold">Time</th>
                          <th className="px-4 py-4 font-semibold w-1/2">Report</th>
                          <th className="px-4 py-4 font-semibold text-center">Evidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {logbooks.length === 0 ? (
                          <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">No logbooks submitted.</td></tr>
                        ) : (
                          logbooks.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-4 text-gray-900 font-medium whitespace-nowrap">{new Date(log.date).toLocaleDateString()}</td>
                              <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{log.clock_in?.substring(0,5)} - {log.clock_out?.substring(0,5)}</td>
                              <td className="px-4 py-4 text-sm text-gray-700">{log.task_description}</td>
                              <td className="px-4 py-4 text-center">
                                {log.evidence_url ? (
                                  <button onClick={() => setSelectedEvidence(log.evidence_url)} className="text-gray-900 underline font-semibold text-sm hover:text-gray-600 transition-colors">View File</button>
                                ) : <span className="text-gray-400 text-xs italic">None</span>}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* VIEW: FINAL EVALUATION */}
            {activeTab === 'evaluation' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Rubric Form */}
                <Card>
                  <CardHeader title="Submit Rubric Assessment" subtitle="Evaluate the intern based on your designated rubrics" />
                  <CardContent>
                    <form onSubmit={handleEvaluationSubmit}>
                      <div className="overflow-x-auto rounded-lg border border-gray-200 mb-6">
                        <table className="w-full text-left border-collapse bg-white">
                          <thead>
                            <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                              <th className="px-4 py-4 font-semibold w-12 text-center">No</th>
                              <th className="px-4 py-4 font-semibold">Rubric Criterion</th>
                              <th className="px-4 py-4 font-semibold text-center w-32">Points (0-20)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {rubrics.map((rubric, index) => (
                              <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-4 text-center font-medium text-gray-500">{index + 1}</td>
                                <td className="px-4 py-4 font-medium text-gray-900 text-sm">{rubric}</td>
                                <td className="px-4 py-3">
                                  <Select 
                                    value={scores[index]} 
                                    onChange={(e) => handleScoreChange(index, e.target.value)}
                                    className="text-center font-semibold"
                                  >
                                    {[...Array(21)].map((_, i) => (
                                      <option key={i} value={i}>{i}</option>
                                    ))}
                                  </Select>
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-gray-50 border-t border-gray-200">
                              <td colSpan="2" className="px-4 py-4 text-right font-bold text-gray-900">TOTAL</td>
                              <td className="px-4 py-4 text-center font-bold text-gray-900">{currentTotalScore} / 100</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? 'Saving...' : 'Save Evaluation'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Final Marks Display */}
                <Card className="h-fit">
                  <CardHeader title="Total Internship Marks" subtitle="Combined evaluation breakdown" />
                  <CardContent>
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full text-left border-collapse bg-white">
                        <thead>
                          <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                            <th className="px-4 py-4 font-semibold">Supervisor Evaluation</th>
                            <th className="px-4 py-4 font-semibold text-center">100%</th>
                            <th className="px-4 py-4 font-semibold text-center">Weight</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          <tr>
                            <td className="px-4 py-4 font-medium text-gray-900 text-sm">1. Company Supervisor</td>
                            <td className="px-4 py-4 text-center font-semibold text-gray-700">{companyEval ? companyScore : '-'}</td>
                            <td className="px-4 py-4 text-center text-gray-500 text-sm">30%</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-4 font-medium text-gray-900 text-sm">2. Lecturer Supervisor</td>
                            <td className="px-4 py-4 text-center font-semibold text-gray-700">{lecturerEval ? lecturerScore : '-'}</td>
                            <td className="px-4 py-4 text-center text-gray-500 text-sm">70%</td>
                          </tr>
                          <tr className="bg-gray-50 border-t border-gray-200">
                            <td className="px-4 py-5 text-right font-bold text-gray-900">FINAL GRADE</td>
                            <td colSpan="2" className="px-4 py-5 text-center font-bold text-lg text-gray-900">
                              {companyEval && lecturerEval ? `${finalWeightedGrade}%` : 'Pending'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    {!companyEval || !lecturerEval ? (
                      <p className="text-sm text-gray-500 mt-4 italic text-center">* Total grade will calculate once both evaluations are submitted.</p>
                    ) : null}
                  </CardContent>
                </Card>

              </div>
            )}
          </>
        )}
      </div>

      {/* Modal logic stays the same ... */}
      {selectedEvidence && (
        <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setSelectedEvidence(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full p-6 relative flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-xl font-bold text-gray-900">Attached Evidence</h3>
              <Button variant="ghost" onClick={() => setSelectedEvidence(null)} className="text-gray-500 hover:text-gray-900">Close</Button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50 rounded-lg flex justify-center items-center p-2 border border-gray-200">
              {selectedEvidence.toLowerCase().endsWith('.pdf') ? (
                <iframe src={selectedEvidence} className="w-full h-[75vh] rounded" title="PDF Evidence"></iframe>
              ) : <img src={selectedEvidence} alt="Evidence" className="max-w-full max-h-[75vh] object-contain rounded" />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EvaluatorDashboard;
import React, { useState, useEffect } from 'react';
import CompanyDirectory from '/workspaces/internship-system/client/src/CompanyDirectory.jsx';
import { Card, CardHeader, CardContent, Label, Input, Textarea, Button } from './components/ui';

function Dashboard({ user, onLogout }) {
  // View Router State: 'home', 'logbook', or 'companies'
  const [currentView, setCurrentView] = useState('home');
  
  const [logbooks, setLogbooks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guidelinesText, setGuidelinesText] = useState('');
  
  // Resources State
  const [resources, setResources] = useState([]);
  
  // Logbook Form State
  const [date, setDate] = useState('');
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [report, setReport] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);

  const fetchLogbooks = async () => {
    const token = sessionStorage.getItem('internship_token');
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

  const fetchResources = async () => {
    const token = sessionStorage.getItem('internship_token');
    try {
      const response = await fetch('/api/resources', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setResources(data);
      }
    } catch (error) {
      console.error("Failed to fetch resources:", error);
    }
  };

  const fetchGuidelines = async () => {
    const token = sessionStorage.getItem('internship_token');
    try {
      const response = await fetch('/api/settings/guidelines', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setGuidelinesText(data.guidelines);
      }
    } catch (error) {
      console.error("Failed to fetch guidelines:", error);
    }
  };

  useEffect(() => {
    fetchLogbooks();
    fetchResources();
    fetchGuidelines();
  }, []);

  const handleLogbookSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; 
    setIsSubmitting(true); 

    const token = sessionStorage.getItem('internship_token');
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
        setCurrentView('home'); 
        fetchLogbooks(); 
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Could not connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* --- GLOBAL HEADER --- */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.full_name}!</h1>
            <p className="text-gray-500 mt-1">
              Role: {user?.role.replace('_', ' ')} 
              <span className="mx-2">|</span> 
              {/* Dynamically show placement status */}
              Placement: <span className="font-semibold text-gray-900">{user?.assigned_company || 'Pending Assignment'}</span>
            </p>
          </div>
          <Button variant="danger" onClick={onLogout}>
            Logout
          </Button>
        </div>

        {/* --- VIEW ROUTER --- */}

        {/* 1. COMPANY DIRECTORY VIEW */}
        {currentView === 'companies' && (
          <CompanyDirectory onBack={() => setCurrentView('home')} />
        )}

        {/* 2. LOGBOOK FORM VIEW */}
        {currentView === 'logbook' && user?.assigned_company && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader 
              title="New Logbook Entry" 
              subtitle="Document your daily tasks and hours"
              action={
                <Button variant="ghost" onClick={() => setCurrentView('home')}>
                  &larr; Back
                </Button>
              }
            />
            <CardContent>
              <form onSubmit={handleLogbookSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Clock In</Label>
                    <Input type="time" value={clockIn} onChange={(e) => setClockIn(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Clock Out</Label>
                    <Input type="time" value={clockOut} onChange={(e) => setClockOut(e.target.value)} required />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Report / Description</Label>
                  <Textarea 
                    value={report} 
                    onChange={(e) => setReport(e.target.value)} 
                    placeholder="Describe the tasks you completed today..." 
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Upload Evidence (Photos / PDF Documents)</Label>
                  <Input 
                    type="file" 
                    accept="image/*,application/pdf"
                    onChange={(e) => setEvidenceFile(e.target.files[0])} 
                    className="pt-1.5 cursor-pointer file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-900 hover:file:bg-gray-200" 
                  />
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Entry'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 3. HOME VIEW */}
        {currentView === 'home' && (
          <div className="space-y-6">
            
            {/* Action Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6 flex flex-col h-full">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Daily Logbook</h2>
                  <p className="text-gray-500 mb-6 text-sm flex-grow">Submit and track your daily activities, hours, and visual evidence of your progress.</p>
                  
                  {/* LOGIC GATE: Only allow entry if assigned to a company */}
                  {user?.assigned_company ? (
                    <Button onClick={() => setCurrentView('logbook')} className="w-full">
                      + New Logbook Entry
                    </Button>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg text-sm text-center font-medium">
                      🔒 Logbook locked. Waiting for Admin placement.
                    </div>
                  )}
                  
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 flex flex-col h-full">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Company Directory</h2>
                  <p className="text-gray-500 mb-6 text-sm flex-grow">Browse approved companies and registered supervisors for your internship placement.</p>
                  <Button variant="secondary" onClick={() => setCurrentView('companies')} className="w-full">
                    View Companies &rarr;
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Official Forms */}
            <Card>
              <CardHeader title="Official Forms & Information" subtitle="SUCCMS Internship Rules and Regulations" />
              <CardContent>
                
                {/* 1. The Official Guidelines Text */}
                <div className="bg-gray-50 border border-gray-200 p-5 rounded-lg whitespace-pre-wrap text-gray-700 text-sm mb-6 leading-relaxed">
                  {guidelinesText || "No official guidelines have been posted yet."}
                </div>

                {/* 2. Downloadable Resources */}
                <h3 className="font-bold text-gray-900 mb-3 text-xs uppercase tracking-wider">Downloadable Forms</h3>
                <ul className="space-y-3">
                  {resources.length === 0 ? (
                    <li className="text-gray-500 text-sm">No documents available at this time.</li>
                  ) : (
                    resources.map((doc, index) => (
                      <li key={doc.id} className="flex items-center text-gray-900">
                        <span className="font-bold text-gray-400 mr-3 text-sm">{index + 1}.</span>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline text-sm">
                          {doc.title}
                        </a>
                        <span className="ml-3 text-xs font-semibold px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full border border-gray-200">
                          {doc.category}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
                
              </CardContent>
            </Card>

            {/* Logbook History */}
            <Card>
              <CardHeader title="Your Logbook History" subtitle="A complete record of your submitted reports" />
              <CardContent className="p-0 sm:p-6">
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-left border-collapse bg-white">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                        <th className="px-6 py-4 font-semibold">Date</th>
                        <th className="px-6 py-4 font-semibold">Time / Duration</th>
                        <th className="px-6 py-4 font-semibold">Report</th>
                        <th className="px-6 py-4 font-semibold">Evidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {logbooks.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                            No logbook entries found. Click "+ New Logbook Entry" to create your first report!
                          </td>
                        </tr>
                      ) : (
                        logbooks.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">
                              {new Date(log.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              <span className="font-medium text-gray-900">{log.clock_in?.substring(0,5)} - {log.clock_out?.substring(0,5)}</span>
                              <br/>
                              <span className="text-xs text-gray-400">({Number(log.hours_worked).toFixed(1)} hrs)</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                              {log.task_description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {log.evidence_url ? (
                                <a 
                                  href={log.evidence_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-gray-900 font-medium hover:text-gray-600 hover:underline transition-colors"
                                >
                                  View File
                                </a>
                              ) : (
                                <span className="text-gray-400 italic">None</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
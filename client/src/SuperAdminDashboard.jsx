import React, { useState, useEffect } from 'react';

function SuperAdminDashboard({ user, onLogout }) {
  // Navigation State
  const [activeTab, setActiveTab] = useState('createUser'); // 'createUser' or 'manageLogbooks'

  // --- USER CREATION STATE ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '', student_staff_id: '', email: '', contact_number: '', role: 'Student', program: '',
    company_name: '', company_id_number: '', address: '', company_phone: '', supervisor_name: ''
  });
  const [photoFile, setPhotoFile] = useState(null);

  // --- LOGBOOK MANAGEMENT STATE ---
  const [systemLogbooks, setSystemLogbooks] = useState([]);

  // Fetch all system logbooks when opening the logbook tab
  useEffect(() => {
    if (activeTab === 'manageLogbooks') {
      fetchSystemLogbooks();
    }
  }, [activeTab]);

  const fetchSystemLogbooks = async () => {
    const token = sessionStorage.getItem('internship_token');
    try {
      // Assuming you have an admin route to fetch all logbooks. 
      // If not, this is a placeholder for that data fetch.
      const response = await fetch('/api/admin/logbooks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSystemLogbooks(data);
      }
    } catch (error) {
      console.error("Failed to fetch system logbooks:", error);
    }
  };

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const token = sessionStorage.getItem('internship_token');
    const submitData = new FormData();
    
    Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
    
    if (formData.role === 'Company_Supervisor' && photoFile) {
      submitData.append('photo', photoFile);
    }

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: submitData
      });

      const data = await response.json();
      if (response.ok) {
        alert("User successfully created! Default password is 'succms2026'.");
        setFormData({
          full_name: '', student_staff_id: '', email: '', contact_number: '', role: 'Student', program: '',
          company_name: '', company_id_number: '', address: '', company_phone: '', supervisor_name: ''
        });
        setPhotoFile(null);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLogbook = async (logbookId) => {
    if (!window.confirm("Are you sure you want to permanently delete this logbook record? This cannot be undone.")) return;
  
    const token = sessionStorage.getItem('internship_token');
    try {
      const response = await fetch(`/api/admin/logbooks/${logbookId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
  
      if (response.ok) {
        alert("Record deleted.");
        fetchSystemLogbooks(); // Refresh the list
      } else {
        alert("Failed to delete record.");
      }
    } catch (error) {
      console.error(error);
      alert("Network error.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* --- GLOBAL HEADER --- */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 flex justify-between items-center border-t-4 border-slate-800">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">System Administrator</h1>
            <p className="text-gray-600 mt-1">{user?.full_name} | Control Panel</p>
          </div>
          <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded">
            Logout
          </button>
        </div>

        {/* --- NAVIGATION TABS --- */}
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setActiveTab('createUser')}
            className={`px-6 py-2 font-bold rounded ${activeTab === 'createUser' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-200'}`}
          >
            Create New User
          </button>
          <button 
            onClick={() => setActiveTab('manageLogbooks')}
            className={`px-6 py-2 font-bold rounded ${activeTab === 'manageLogbooks' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-200'}`}
          >
            Manage System Logbooks
          </button>
        </div>

        {/* --- VIEW: CREATE USER --- */}
        {activeTab === 'createUser' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-gray-800">User Management Hub</h2>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6">
              <div className="flex flex-col md:flex-row gap-8">
                
                {/* LEFT PANEL: Basic User Details */}
                <div className="flex-1 space-y-4">
                  <h3 className="font-bold text-lg border-b pb-2 text-slate-700">Account Details</h3>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name:</label>
                    <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-slate-400" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Student / Staff ID:</label>
                    <input type="text" name="student_staff_id" value={formData.student_staff_id} onChange={handleInputChange} className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-slate-400" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">E-Mail:</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-slate-400" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Number:</label>
                    <input type="text" name="contact_number" value={formData.contact_number} onChange={handleInputChange} className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-slate-400" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Role:</label>
                    <select name="role" value={formData.role} onChange={handleInputChange} className="w-full border p-2 rounded bg-white outline-none focus:ring-2 focus:ring-slate-400">
                      <option value="Student">1. Student</option>
                      <option value="Company_Supervisor">2. Company Supervisor</option>
                      <option value="Lecturer">3. Lecturer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Program:</label>
                    <input type="text" name="program" value={formData.program} onChange={handleInputChange} className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-slate-400" />
                  </div>
                </div>

                {/* RIGHT PANEL: Dynamic Company Details */}
                {formData.role === 'Company_Supervisor' && (
                  <div className="flex-1 space-y-4 border-t md:border-t-0 md:border-l md:pl-8 border-gray-200 mt-6 md:mt-0 pt-6 md:pt-0">
                    <h3 className="font-bold text-lg border-b pb-2 text-blue-700">Company Supervisor Details</h3>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name:</label>
                      <input type="text" name="company_name" value={formData.company_name} onChange={handleInputChange} className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-400" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Company ID / Number:</label>
                      <input type="text" name="company_id_number" value={formData.company_id_number} onChange={handleInputChange} className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-400" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Address:</label>
                      <textarea name="address" value={formData.address} onChange={handleInputChange} className="w-full border p-2 rounded h-20 outline-none focus:ring-2 focus:ring-blue-400" required></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Company Phone:</label>
                      <input type="text" name="company_phone" value={formData.company_phone} onChange={handleInputChange} className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-400" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Supervisor (Name):</label>
                      <input type="text" name="supervisor_name" value={formData.supervisor_name} onChange={handleInputChange} className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-400" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Supervisor Photo:</label>
                      <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} className="w-full border p-2 rounded bg-white outline-none focus:ring-2 focus:ring-blue-400" required />
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="mt-8 pt-6 border-t flex gap-4">
                <button type="submit" disabled={isSubmitting} className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-8 rounded disabled:opacity-50 transition-colors">
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
                <button type="button" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-8 rounded transition-colors">
                  Edit
                </button>
                <button type="button" className="bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 px-8 rounded transition-colors">
                  Delete
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- VIEW: MANAGE LOGBOOKS --- */}
        {activeTab === 'manageLogbooks' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">System Logbooks Directory</h2>
              <span className="bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">
                Total Records: {systemLogbooks.length}
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-sm uppercase tracking-wider">
                    <th className="px-6 py-3 font-semibold">ID</th>
                    <th className="px-6 py-3 font-semibold">Student ID</th>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold">Report Snippet</th>
                    <th className="px-6 py-3 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {systemLogbooks.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        No logbooks found in the database.
                      </td>
                    </tr>
                  ) : (
                    systemLogbooks.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-mono text-sm text-gray-500">#{log.id}</td>
                        <td className="px-6 py-4 font-semibold text-gray-800">{log.student_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {new Date(log.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 truncate max-w-xs">
                          {log.task_description}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => handleDeleteLogbook(log.id)}
                            className="text-red-500 hover:text-red-700 font-semibold text-sm transition-colors"
                          >
                            Delete Record
                          </button>
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
    </div>
  );
}

export default SuperAdminDashboard;
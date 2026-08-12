import React, { useState, useEffect } from 'react';

function SuperAdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('createUser'); 

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '', student_staff_id: '', email: '', contact_number: '', role: 'Student', program: '',
    company_name: '', company_id_number: '', address: '', company_phone: '', supervisor_name: '',
    assigned_company: '', assigned_supervisor_id: '', internship_duration: ''
  });
  const [photoFile, setPhotoFile] = useState(null);

  // Data Fetching State
  const [systemLogbooks, setSystemLogbooks] = useState([]);
  const [supervisorList, setSupervisorList] = useState([]);

  // Pagination State for Company Directory
  const [currentPage, setCurrentPage] = useState(1);
  const companiesPerPage = 5;

  useEffect(() => {
    if (activeTab === 'manageLogbooks') fetchSystemLogbooks();
    // We always want to fetch supervisors on load so the "Create User" dropdowns work immediately
    fetchSupervisors(); 
  }, [activeTab]);

  const fetchSystemLogbooks = async () => {
    const token = sessionStorage.getItem('internship_token');
    try {
      const response = await fetch('/api/admin/logbooks', { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) setSystemLogbooks(await response.json());
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSupervisors = async () => {
    const token = sessionStorage.getItem('internship_token');
    try {
      const response = await fetch('/api/admin/supervisors', { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) setSupervisorList(await response.json());
    } catch (error) {
      console.error(error);
    }
  };

  const uniqueCompanies = [...new Set(supervisorList.map(s => s.company_name).filter(Boolean))];
  const filteredSupervisors = formData.assigned_company 
    ? supervisorList.filter(s => s.company_name === formData.assigned_company)
    : supervisorList;

  // --- Pagination Logic ---
  const indexOfLastCompany = currentPage * companiesPerPage;
  const indexOfFirstCompany = indexOfLastCompany - companiesPerPage;
  const currentCompanies = supervisorList.slice(indexOfFirstCompany, indexOfLastCompany);
  const totalPages = Math.ceil(supervisorList.length / companiesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handlePrint = () => {
    window.print();
  };

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
    if (formData.role === 'Company_Supervisor' && photoFile) submitData.append('photo', photoFile);

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
          company_name: '', company_id_number: '', address: '', company_phone: '', supervisor_name: '',
          assigned_company: '', assigned_supervisor_id: '', internship_duration: ''
        });
        setPhotoFile(null);
        fetchSupervisors(); // Refresh list to catch any newly created companies
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

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:bg-white print:p-0">
      <div className="max-w-7xl mx-auto">
        
        {/* Header - Hidden on Print */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 flex justify-between items-center border-t-4 border-slate-800 print:hidden">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">System Administrator</h1>
            <p className="text-gray-600 mt-1">{user?.full_name} | Control Panel</p>
          </div>
          <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded">
            Logout
          </button>
        </div>

        {/* Tabs - Hidden on Print */}
        <div className="flex gap-4 mb-6 print:hidden">
          <button onClick={() => setActiveTab('createUser')} className={`px-6 py-2 font-bold rounded ${activeTab === 'createUser' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-200'}`}>
            Create New User
          </button>
          <button onClick={() => setActiveTab('manageLogbooks')} className={`px-6 py-2 font-bold rounded ${activeTab === 'manageLogbooks' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-200'}`}>
            Manage System Logbooks
          </button>
          <button onClick={() => setActiveTab('manageCompanies')} className={`px-6 py-2 font-bold rounded ${activeTab === 'manageCompanies' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-200'}`}>
            Company Directory
          </button>
        </div>

        {/* VIEW: CREATE USER (Hidden on Print) */}
        {activeTab === 'createUser' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden print:hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-gray-800">User Management Hub</h2>
            </div>
            <form onSubmit={handleCreateUser} className="p-6">
              <div className="flex flex-col md:flex-row gap-8">
                
                {/* LEFT PANEL */}
                <div className="flex-1 space-y-4">
                  <h3 className="font-bold text-lg border-b pb-2 text-slate-700">Account Details</h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name:</label>
                    <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} className="w-full border p-2 rounded" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Student / Staff ID:</label>
                    <input type="text" name="student_staff_id" value={formData.student_staff_id} onChange={handleInputChange} className="w-full border p-2 rounded" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Programme:</label>
                    <input type="text" name="program" value={formData.program} onChange={handleInputChange} className="w-full border p-2 rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Contact:</label>
                    <input type="text" name="contact_number" value={formData.contact_number} onChange={handleInputChange} className="w-full border p-2 rounded" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">E-Mail:</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full border p-2 rounded" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Role:</label>
                    <select name="role" value={formData.role} onChange={handleInputChange} className="w-full border p-2 rounded bg-white">
                      <option value="Student">1. Student</option>
                      <option value="Company_Supervisor">2. Company Supervisor</option>
                      <option value="Lecturer">3. Lecturer</option>
                    </select>
                  </div>
                </div>

                {/* RIGHT PANEL A: Student Assignment */}
                {formData.role === 'Student' && (
                  <div className="flex-1 space-y-4 border-t md:border-t-0 md:border-l md:pl-8 border-gray-200 mt-6 md:mt-0 pt-6 md:pt-0">
                    <h3 className="font-bold text-lg border-b pb-2 text-emerald-700">Internship Assignment</h3>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Internship Company:</label>
                      <select name="assigned_company" value={formData.assigned_company} onChange={handleInputChange} className="w-full border p-2 rounded bg-white">
                        <option value="">-- Select Company --</option>
                        {uniqueCompanies.map((company, i) => (
                          <option key={i} value={company}>{company}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Person In Charge (PIC):</label>
                      <select name="assigned_supervisor_id" value={formData.assigned_supervisor_id} onChange={handleInputChange} className="w-full border p-2 rounded bg-white">
                        <option value="">-- Select Supervisor --</option>
                        {filteredSupervisors.map(sup => (
                          <option key={sup.id} value={sup.id}>{sup.supervisor_name} ({sup.company_name})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Duration:</label>
                      <input type="text" name="internship_duration" value={formData.internship_duration} onChange={handleInputChange} placeholder="e.g., 3 Months" className="w-full border p-2 rounded" />
                    </div>
                  </div>
                )}

                {/* RIGHT PANEL B: Company Profile */}
                {formData.role === 'Company_Supervisor' && (
                  <div className="flex-1 space-y-4 border-t md:border-t-0 md:border-l md:pl-8 border-gray-200 mt-6 md:mt-0 pt-6 md:pt-0">
                    <h3 className="font-bold text-lg border-b pb-2 text-blue-700">Create Company Supervisor</h3>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name:</label>
                      <input type="text" name="company_name" value={formData.company_name} onChange={handleInputChange} className="w-full border p-2 rounded" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Company ID / Number:</label>
                      <input type="text" name="company_id_number" value={formData.company_id_number} onChange={handleInputChange} className="w-full border p-2 rounded" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Address:</label>
                      <textarea name="address" value={formData.address} onChange={handleInputChange} className="w-full border p-2 rounded h-20" required></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Phone:</label>
                      <input type="text" name="company_phone" value={formData.company_phone} onChange={handleInputChange} className="w-full border p-2 rounded" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Supervisor (Name):</label>
                      <input type="text" name="supervisor_name" value={formData.supervisor_name} onChange={handleInputChange} className="w-full border p-2 rounded" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Photo (Upload):</label>
                      <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} className="w-full border p-2 rounded bg-white" required />
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-8 pt-6 border-t flex gap-4">
                <button type="submit" disabled={isSubmitting} className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-8 rounded disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW: COMPANY DIRECTORY */}
        {activeTab === 'manageCompanies' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden print:shadow-none print:w-full">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center print:bg-white print:border-b-2 print:border-black">
              <h2 className="text-xl font-bold text-gray-800">List of Companies</h2>
              <span className="text-sm font-bold text-gray-500 print:hidden">Total: {supervisorList.length}</span>
            </div>
            
            <div className="overflow-x-auto p-6">
              <table className="w-full text-left border-collapse border border-gray-300 print:border-black">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 text-sm tracking-wider print:bg-gray-200">
                    <th className="px-4 py-3 border border-gray-300 font-bold text-center w-12">No.</th>
                    <th className="px-4 py-3 border border-gray-300 font-bold">Company Name</th>
                    <th className="px-4 py-3 border border-gray-300 font-bold">Company ID</th>
                    <th className="px-4 py-3 border border-gray-300 font-bold">Address</th>
                    <th className="px-4 py-3 border border-gray-300 font-bold">Phone</th>
                    <th className="px-4 py-3 border border-gray-300 font-bold">Person in Charge</th>
                    <th className="px-4 py-3 border border-gray-300 font-bold text-center">Photo</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCompanies.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500 border border-gray-300">
                        No companies registered yet.
                      </td>
                    </tr>
                  ) : (
                    currentCompanies.map((company, index) => (
                      <tr key={company.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 border border-gray-300 text-center font-semibold text-gray-600">
                          {indexOfFirstCompany + index + 1}
                        </td>
                        <td className="px-4 py-3 border border-gray-300 font-bold text-gray-800">
                          {company.company_name}
                        </td>
                        <td className="px-4 py-3 border border-gray-300 text-gray-600 font-mono text-sm">
                          {company.company_id_number}
                        </td>
                        <td className="px-4 py-3 border border-gray-300 text-gray-700 text-sm max-w-xs">
                          {company.address}
                        </td>
                        <td className="px-4 py-3 border border-gray-300 text-gray-600 whitespace-nowrap">
                          {company.company_phone}
                        </td>
                        <td className="px-4 py-3 border border-gray-300 text-gray-800 font-medium">
                          {company.supervisor_name}
                        </td>
                        <td className="px-4 py-3 border border-gray-300 text-center">
                          {company.photo_url ? (
                            <img src={company.photo_url} alt="PIC" className="h-10 w-10 object-cover rounded-full mx-auto shadow-sm border border-gray-200" />
                          ) : (
                            <span className="text-gray-400 text-xs italic">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6 print:hidden">
                  <button 
                    onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50 font-semibold"
                  >
                    Prev
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => paginate(i + 1)}
                      className={`px-3 py-1 rounded font-bold ${currentPage === i + 1 ? 'bg-slate-800 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50 font-semibold"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 mt-8 pt-4 border-t print:hidden">
                <button onClick={handlePrint} className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-8 rounded transition-colors">
                  Print
                </button>
                <button onClick={() => setActiveTab('createUser')} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-8 rounded transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default SuperAdminDashboard;
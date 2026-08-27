import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, Label, Input, Select, Textarea, Button } from './components/ui';

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
  const [usersList, setUsersList] = useState([]);

  // User Management State
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const usersPerPage = 10;

  // Data Fetching State
  const [systemLogbooks, setSystemLogbooks] = useState([]);
  const [supervisorList, setSupervisorList] = useState([]);
  const [placementRequests, setPlacementRequests] = useState([]); // NEW STATE

  // Pagination State for Company Directory
  const [currentPage, setCurrentPage] = useState(1);
  const companiesPerPage = 5;

  const [guidelinesText, setGuidelinesText] = useState('');

  useEffect(() => {
    if (activeTab === 'manageLogbooks') fetchSystemLogbooks();
    if (activeTab === 'placementRequests') fetchPlacementRequests();
    if (activeTab === 'manageUsers') fetchUsersList();
    if (activeTab === 'manageGuidelines') fetchGuidelines();
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

  const handleDeleteLogbook = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this logbook?')) return;
    const token = sessionStorage.getItem('internship_token');
    try {
      const response = await fetch(`/api/admin/logbooks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert('Logbook deleted.');
        fetchSystemLogbooks();
      } else {
        alert('Failed to delete logbook.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUsersList = async () => {
    const token = sessionStorage.getItem('internship_token');
    try {
      const response = await fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) setUsersList(await response.json());
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteUser = async (id, role) => {
    if (!window.confirm(`Are you sure you want to permanently delete this ${role.replace('_', ' ')}? This action cannot be undone.`)) return;
    
    const token = sessionStorage.getItem('internship_token');
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert('User deleted successfully.');
        fetchUsersList(); // Refresh the table
      } else {
        const data = await response.json();
        alert(data.error);
      }
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

  const fetchGuidelines = async () => {
    const token = sessionStorage.getItem('internship_token');
    try {
      const response = await fetch('/api/settings/guidelines', { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setGuidelinesText(data.guidelines);
      }
    } catch (error) { console.error(error); }
  };

  const handleSaveGuidelines = async () => {
    const token = sessionStorage.getItem('internship_token');
    try {
      const response = await fetch('/api/settings/guidelines', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ guidelines: guidelinesText })
      });
      if (response.ok) alert('Official Guidelines updated successfully!');
    } catch (error) { console.error(error); }
  };

  const fetchPlacementRequests = async () => {
    const token = sessionStorage.getItem('internship_token');
    try {
      const response = await fetch('/api/admin/placement-requests', { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) setPlacementRequests(await response.json());
    } catch (error) {
      console.error(error);
    }
  };

  const handleRequestAction = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this placement?`)) return;
    
    const token = sessionStorage.getItem('internship_token');
    try {
      const response = await fetch(`/api/admin/placement-requests/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        alert(`Request ${status.toLowerCase()} successfully.`);
        fetchPlacementRequests(); // Refresh the list
      } else {
        const data = await response.json();
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const uniqueCompanies = [...new Set(supervisorList.map(s => s.company_name).filter(Boolean))];
  const filteredSupervisors = formData.assigned_company 
    ? supervisorList.filter(s => s.company_name === formData.assigned_company)
    : supervisorList;

  const indexOfLastCompany = currentPage * companiesPerPage;
  const indexOfFirstCompany = indexOfLastCompany - companiesPerPage;
  const currentCompanies = supervisorList.slice(indexOfFirstCompany, indexOfLastCompany);
  const totalPages = Math.ceil(supervisorList.length / companiesPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handlePrint = () => window.print();

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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
        fetchSupervisors(); 
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

  // --- USER MANAGEMENT LOGIC ---
  const filteredUsers = usersList.filter(user => {
    // Check if the search term matches the name, email, or company
    const matchesSearch = 
      user.full_name.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (user.own_company_name && user.own_company_name.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
      (user.assigned_company && user.assigned_company.toLowerCase().includes(userSearchTerm.toLowerCase()));
    
    // Check if the role matches the dropdown filter
    const matchesRole = userRoleFilter === 'All' || user.role === userRoleFilter;
    
    return matchesSearch && matchesRole;
  });

  const indexOfLastUser = usersCurrentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginateUsers = (pageNumber) => setUsersCurrentPage(pageNumber);

  return (
    <div className="min-h-screen bg-gray-50 p-8 print:bg-white print:p-0">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex justify-between items-center mb-8 print:hidden">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Administrator</h1>
            <p className="text-gray-500 mt-1">{user?.full_name} | Control Panel</p>
          </div>
          <Button variant="danger" onClick={onLogout}>Logout</Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 print:hidden bg-white p-1 rounded-lg border border-gray-200 w-fit">
          <Button variant={activeTab === 'createUser' ? 'primary' : 'ghost'} onClick={() => setActiveTab('createUser')}>
            Create New User
          </Button>
          <Button variant={activeTab === 'placementRequests' ? 'primary' : 'ghost'} onClick={() => setActiveTab('placementRequests')}>
            Placement Requests {placementRequests.length > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{placementRequests.length}</span>}
          </Button>
          <Button variant={activeTab === 'manageLogbooks' ? 'primary' : 'ghost'} onClick={() => setActiveTab('manageLogbooks')}>
            Manage System Logbooks
          </Button>
          <Button variant={activeTab === 'manageCompanies' ? 'primary' : 'ghost'} onClick={() => setActiveTab('manageCompanies')}>
            Company Directory
          </Button>
          <Button variant={activeTab === 'manageUsers' ? 'primary' : 'ghost'} onClick={() => setActiveTab('manageUsers')}>
            Manage Users
          </Button>
          <Button variant={activeTab === 'manageGuidelines' ? 'primary' : 'ghost'} onClick={() => setActiveTab('manageGuidelines')}>
            Official Guidelines
          </Button>
        </div>

        {/* VIEW: CREATE USER */}
        {activeTab === 'createUser' && (
          <Card className="print:hidden">
            <CardHeader title="User Management Hub" />
            <CardContent>
              <form onSubmit={handleCreateUser}>
                <div className="flex flex-col md:flex-row gap-8">
                  {/* LEFT PANEL */}
                  <div className="flex-1 space-y-4">
                    <h3 className="font-semibold text-lg text-gray-900 border-b border-gray-100 pb-2 mb-4">Account Details</h3>
                    <div className="space-y-1.5">
                      <Label>Full Name</Label>
                      <Input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Student / Staff ID</Label>
                      <Input type="text" name="student_staff_id" value={formData.student_staff_id} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Programme</Label>
                      <Input type="text" name="program" value={formData.program} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Contact</Label>
                      <Input type="text" name="contact_number" value={formData.contact_number} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>E-Mail</Label>
                      <Input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Role</Label>
                      <Select name="role" value={formData.role} onChange={handleInputChange}>
                        <option value="Student">1. Student</option>
                        <option value="Company_Supervisor">2. Company Supervisor</option>
                        <option value="Lecturer">3. Lecturer</option>
                      </Select>
                    </div>
                  </div>

                  {/* RIGHT PANEL A: Student Assignment */}
                  {formData.role === 'Student' && (
                    <div className="flex-1 space-y-4 border-t md:border-t-0 md:border-l md:pl-8 border-gray-100 mt-6 md:mt-0 pt-6 md:pt-0">
                      <h3 className="font-semibold text-lg text-gray-900 border-b border-gray-100 pb-2 mb-4">Internship Assignment</h3>
                      <div className="space-y-1.5">
                        <Label>Internship Company</Label>
                        <Select name="assigned_company" value={formData.assigned_company} onChange={handleInputChange}>
                          <option value="">-- Select Company --</option>
                          {uniqueCompanies.map((company, i) => (
                            <option key={i} value={company}>{company}</option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Person In Charge (PIC)</Label>
                        <Select name="assigned_supervisor_id" value={formData.assigned_supervisor_id} onChange={handleInputChange}>
                          <option value="">-- Select Supervisor --</option>
                          {filteredSupervisors.map(sup => (
                            <option key={sup.id} value={sup.id}>{sup.supervisor_name} ({sup.company_name})</option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Duration</Label>
                        <Input type="text" name="internship_duration" value={formData.internship_duration} onChange={handleInputChange} placeholder="e.g., 3 Months" />
                      </div>
                    </div>
                  )}

                  {/* RIGHT PANEL B: Company Profile */}
                  {formData.role === 'Company_Supervisor' && (
                    <div className="flex-1 space-y-4 border-t md:border-t-0 md:border-l md:pl-8 border-gray-100 mt-6 md:mt-0 pt-6 md:pt-0">
                      <h3 className="font-semibold text-lg text-gray-900 border-b border-gray-100 pb-2 mb-4">Company Supervisor Profile</h3>
                      <div className="space-y-1.5">
                        <Label>Company Name</Label>
                        <Input type="text" name="company_name" value={formData.company_name} onChange={handleInputChange} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Company ID / Number</Label>
                        <Input type="text" name="company_id_number" value={formData.company_id_number} onChange={handleInputChange} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Address</Label>
                        <Textarea name="address" value={formData.address} onChange={handleInputChange} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Phone</Label>
                        <Input type="text" name="company_phone" value={formData.company_phone} onChange={handleInputChange} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Supervisor (Name)</Label>
                        <Input type="text" name="supervisor_name" value={formData.supervisor_name} onChange={handleInputChange} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Photo (Upload)</Label>
                        <Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} required className="pt-1.5" />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save User Record'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* VIEW: PLACEMENT REQUESTS */}
        {activeTab === 'placementRequests' && (
          <Card>
            <CardHeader title="Pending Placement Requests" subtitle="Review and approve student placement requests" />
            <CardContent className="p-0 sm:p-6">
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left border-collapse bg-white">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                      <th className="px-4 py-4 font-semibold">Date</th>
                      <th className="px-4 py-4 font-semibold">Student Name</th>
                      <th className="px-4 py-4 font-semibold">Requested Company</th>
                      <th className="px-4 py-4 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {placementRequests.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                          No pending requests.
                        </td>
                      </tr>
                    ) : (
                      placementRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-4 text-gray-500 text-sm whitespace-nowrap">
                            {new Date(request.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 font-medium text-gray-900">
                            {request.student_name}
                            <div className="text-xs text-gray-500">{request.student_email}</div>
                          </td>
                          <td className="px-4 py-4 text-gray-900">
                            <span className="font-semibold">{request.company_name}</span>
                            <div className="text-xs text-gray-500">PIC: {request.supervisor_name}</div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex justify-center gap-2">
                              <Button size="sm" onClick={() => handleRequestAction(request.id, 'Approved')}>Approve</Button>
                              <Button size="sm" variant="danger" onClick={() => handleRequestAction(request.id, 'Rejected')}>Reject</Button>
                            </div>
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

        {/* VIEW: MANAGE SYSTEM LOGBOOKS */}
        {activeTab === 'manageLogbooks' && (
          <Card>
            <CardHeader title="System Logbooks" subtitle="Monitor and manage all student logbook entries" />
            <CardContent className="p-0 sm:p-6">
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left border-collapse bg-white">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-6 py-4 font-semibold">Student</th>
                      <th className="px-6 py-4 font-semibold">Company</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {systemLogbooks.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                          No logbooks found in the system.
                        </td>
                      </tr>
                    ) : (
                      systemLogbooks.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">
                            {new Date(log.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-gray-900 font-medium">
                            {log.student_name}
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            {log.assigned_company || 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                              log.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                              log.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-yellow-50 text-yellow-700 border-yellow-200'
                            }`}>
                              {log.status || 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Button size="sm" variant="danger" onClick={() => handleDeleteLogbook(log.id)}>
                              Delete
                            </Button>
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

        {/* VIEW: COMPANY DIRECTORY */}
        {activeTab === 'manageCompanies' && (
          <Card className="print:shadow-none print:border-none print:w-full">
            <CardHeader 
              title="Company Directory" 
              className="print:bg-white print:border-b-2 print:border-black"
              action={<span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 print:hidden">Total: {supervisorList.length}</span>}
            />
            
            <CardContent className="p-0 sm:p-6 print:p-0">
              <div className="overflow-x-auto rounded-lg border border-gray-200 print:border-black print:rounded-none">
                <table className="w-full text-left border-collapse bg-white">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider print:bg-gray-100 border-b border-gray-200 print:border-black">
                      <th className="px-4 py-4 font-semibold text-center w-12">No.</th>
                      <th className="px-4 py-4 font-semibold">Company Name</th>
                      <th className="px-4 py-4 font-semibold">Company ID</th>
                      <th className="px-4 py-4 font-semibold">Address</th>
                      <th className="px-4 py-4 font-semibold">Phone</th>
                      <th className="px-4 py-4 font-semibold">Person in Charge</th>
                      <th className="px-4 py-4 font-semibold text-center">Photo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 print:divide-gray-400">
                    {currentCompanies.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                          No companies registered yet.
                        </td>
                      </tr>
                    ) : (
                      currentCompanies.map((company, index) => (
                        <tr key={company.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-4 text-center font-medium text-gray-500">
                            {indexOfFirstCompany + index + 1}
                          </td>
                          <td className="px-4 py-4 font-semibold text-gray-900">
                            {company.company_name}
                          </td>
                          <td className="px-4 py-4 text-gray-500 font-mono text-sm">
                            {company.company_id_number}
                          </td>
                          <td className="px-4 py-4 text-gray-600 text-sm max-w-xs">
                            {company.address}
                          </td>
                          <td className="px-4 py-4 text-gray-600 whitespace-nowrap text-sm">
                            {company.company_phone}
                          </td>
                          <td className="px-4 py-4 text-gray-900 font-medium text-sm">
                            {company.supervisor_name}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {company.photo_url ? (
                              <img src={company.photo_url} alt="PIC" className="h-10 w-10 object-cover rounded-full mx-auto ring-2 ring-gray-100" />
                            ) : (
                              <span className="text-gray-400 text-xs italic">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-1.5 mt-8 print:hidden">
                  <Button variant="secondary" onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)} disabled={currentPage === 1}>Prev</Button>
                  {[...Array(totalPages)].map((_, i) => (
                    <Button key={i} variant={currentPage === i + 1 ? 'primary' : 'ghost'} onClick={() => paginate(i + 1)} className="px-3 min-w-[2.5rem]">{i + 1}</Button>
                  ))}
                  <Button variant="secondary" onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)} disabled={currentPage === totalPages}>Next</Button>
                </div>
              )}

              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100 print:hidden">
                <Button onClick={handlePrint}>Print Directory</Button>
                <Button variant="secondary" onClick={() => setActiveTab('createUser')}>Close View</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* VIEW: MANAGE USERS */}
        {activeTab === 'manageUsers' && (
          <Card>
            <CardHeader 
              title="User Management" 
              subtitle="Search, filter, and remove system users" 
              action={<span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">Total: {filteredUsers.length}</span>}
            />
            <CardContent className="p-0 sm:p-6">
              
              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6 px-4 sm:px-0">
                <Input 
                  type="text" 
                  placeholder="Search by name, email, or company..." 
                  value={userSearchTerm}
                  onChange={(e) => { setUserSearchTerm(e.target.value); setUsersCurrentPage(1); }}
                  className="flex-1"
                />
                <Select 
                  value={userRoleFilter} 
                  onChange={(e) => { setUserRoleFilter(e.target.value); setUsersCurrentPage(1); }}
                  className="w-full sm:w-48"
                >
                  <option value="All">All Roles</option>
                  <option value="Student">Student</option>
                  <option value="Company_Supervisor">Company Supervisor</option>
                  <option value="Lecturer">Lecturer</option>
                  <option value="Super_Admin">Super Admin</option>
                </Select>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left border-collapse bg-white">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                      <th className="px-6 py-4 font-semibold">Name</th>
                      <th className="px-6 py-4 font-semibold">Role</th>
                      <th className="px-6 py-4 font-semibold">Company / Affiliation</th>
                      <th className="px-6 py-4 font-semibold">Joined Date</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                          No users found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      currentUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{u.full_name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{u.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                              u.role === 'Super_Admin' ? 'bg-purple-100 text-purple-700' :
                              u.role === 'Company_Supervisor' ? 'bg-blue-100 text-blue-700' :
                              u.role === 'Lecturer' ? 'bg-orange-100 text-orange-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {u.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {u.role === 'Company_Supervisor' ? (
                              <span className="font-medium text-blue-800">{u.own_company_name || 'N/A'}</span>
                            ) : u.role === 'Student' ? (
                              <span className="text-gray-600">{u.assigned_company || 'Unassigned'}</span>
                            ) : (
                              <span className="text-gray-400 italic">SUCCMS Staff</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-sm">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button 
                              size="sm" 
                              variant="danger" 
                              disabled={u.id === user.id} 
                              onClick={() => handleDeleteUser(u.id, u.role)}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalUserPages > 1 && (
                <div className="flex justify-center items-center gap-1.5 mt-6 pb-2">
                  <Button variant="secondary" onClick={() => paginateUsers(usersCurrentPage > 1 ? usersCurrentPage - 1 : 1)} disabled={usersCurrentPage === 1}>Prev</Button>
                  {[...Array(totalUserPages)].map((_, i) => (
                    <Button key={i} variant={usersCurrentPage === i + 1 ? 'primary' : 'ghost'} onClick={() => paginateUsers(i + 1)} className="px-3 min-w-[2.5rem]">{i + 1}</Button>
                  ))}
                  <Button variant="secondary" onClick={() => paginateUsers(usersCurrentPage < totalUserPages ? usersCurrentPage + 1 : totalUserPages)} disabled={usersCurrentPage === totalUserPages}>Next</Button>
                </div>
              )}

            </CardContent>
          </Card>
        )}

        {/* VIEW: MANAGE GUIDELINES */}
              {activeTab === 'manageGuidelines' && (
                <Card>
                  <CardHeader title="Official Forms and Information" subtitle="Update the rules and regulations visible to students and lecturers." />
                  <CardContent>
                    <textarea 
                      className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={guidelinesText}
                      onChange={(e) => setGuidelinesText(e.target.value)}
                      placeholder="Enter internship rules, formatting guidelines, or announcements here..."
                    />
                    <div className="mt-4 flex justify-end">
                      <Button onClick={handleSaveGuidelines}>Save Guidelines</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

      </div>
    </div>
  );
}

export default SuperAdminDashboard;
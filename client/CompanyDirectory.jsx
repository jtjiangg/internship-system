import React, { useState, useEffect } from 'react';

function CompanyDirectory({ onBack }) {
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCompanies = async () => {
      const token = sessionStorage.getItem('internship_token');
      try {
        const response = await fetch('/api/companies', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setCompanies(data);
        }
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      }
    };
    fetchCompanies();
  }, []);

  // Simple search filter
  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.roles.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-green-500 max-w-6xl mx-auto">
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Company Directory</h2>
          <p className="text-gray-600">Browse approved internship partners.</p>
        </div>
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800 font-semibold">
          &larr; Back to Dashboard
        </button>
      </div>

      <div className="mb-6">
        <input 
          type="text" 
          placeholder="Search by company name or role (e.g., 'React')..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.length === 0 ? (
          <p className="text-gray-500 col-span-full text-center py-8">No companies found matching your search.</p>
        ) : (
          filteredCompanies.map((company) => (
            <div key={company.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow duration-200 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">{company.name}</h3>
                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold mb-3">
                  {company.industry}
                </span>
                <p className="text-sm text-gray-600 mb-4">{company.description}</p>
              </div>
              
              <div className="border-t border-gray-100 pt-3 mt-auto">
                <p className="text-sm text-gray-800"><span className="font-semibold">📍 Location:</span> {company.location}</p>
                <p className="text-sm text-gray-800 mt-1"><span className="font-semibold">💼 Roles:</span> {company.roles}</p>
                
                <button className="w-full mt-4 bg-green-50 border border-green-600 text-green-700 hover:bg-green-600 hover:text-white font-bold py-2 px-4 rounded transition-colors duration-200">
                  Request Placement
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CompanyDirectory;
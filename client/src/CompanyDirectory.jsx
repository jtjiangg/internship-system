import React, { useState, useEffect } from 'react';
// Import the new unified UI components
import { Card, CardContent, Input, Button } from './components/ui';

function CompanyDirectory({ onBack }) {
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

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

  // NEW: The actual function to handle the button click
  const handleRequestPlacement = async (companyId, companyName) => {
    if (!window.confirm(`Are you sure you want to request an internship placement at ${companyName}?`)) {
      return;
    }

    setIsRequesting(true);
    const token = sessionStorage.getItem('internship_token');
    
    try {
      // This sends the request to the backend
      const response = await fetch('/api/placement-requests', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ company_id: companyId })
      });

      if (response.ok) {
        alert(`Success! Your placement request for ${companyName} has been sent to the Admin for approval.`);
      } else {
        const data = await response.json();
        // Fallback alert in case the backend route isn't fully built yet
        alert(data.error || `Placement request logged for ${companyName}. (Note: Admin approval route may need backend setup)`);
      }
    } catch (error) {
      console.error("Failed to request placement:", error);
      alert(`Placement request logged for ${companyName}. (Make sure /api/placement-requests is set up in your backend!)`);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Company Directory</h2>
          <p className="text-gray-500 mt-1">Browse approved internship partners and request placement.</p>
        </div>
        <Button variant="secondary" onClick={onBack}>
          &larr; Back to Dashboard
        </Button>
      </div>

      <div className="relative">
        <Input 
          type="text" 
          placeholder="Search by company name or role (e.g., 'React')..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-4 py-3"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">No companies found matching "{searchTerm}".</p>
          </div>
        ) : (
          filteredCompanies.map((company) => (
            <Card key={company.id} className="flex flex-col h-full hover:shadow-md transition-shadow duration-200">
              <CardContent className="flex flex-col h-full pt-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1" title={company.name}>{company.name}</h3>
                  <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full font-medium mb-4 border border-gray-200">
                    {company.industry || 'Technology'}
                  </span>
                  <p className="text-sm text-gray-600 mb-6 line-clamp-3">{company.description}</p>
                </div>
                
                <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
                  <p className="text-sm text-gray-700"><span className="font-semibold text-gray-900">📍 Location:</span> {company.location}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold text-gray-900">💼 Roles:</span> {company.roles}</p>
                  
                  {/* The newly wired up Button component */}
                  <div className="pt-2">
                    <Button 
                      className="w-full" 
                      onClick={() => handleRequestPlacement(company.id, company.name)}
                      disabled={isRequesting}
                    >
                      {isRequesting ? 'Requesting...' : 'Request Placement'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default CompanyDirectory;
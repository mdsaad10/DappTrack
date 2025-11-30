import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllOrganizations, getProjectsByOrg, getAllExpenses } from "@/view-functions/getOrganizationData";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const config = new AptosConfig({ 
  network: Network.TESTNET,
  fullnode: "https://api.testnet.aptoslabs.com/v1"
});
const aptos = new Aptos(config);

interface Organization {
  id: number;
  name: string;
  description: string;
}

interface Project {
  id: number;
  org_id: number;
  name: string;
  description: string;
  target_amount: number;
  raised_amount: number;
  spent_amount: number;
  status: number;
}

interface Donation {
  id: number;
  org_id: number;
  project_id: number;
  donor: string;
  amount: number;
  message: string;
  donated_at: number;
}

interface Expense {
  id: number;
  org_id: number;
  project_id: number;
  description: string;
  amount: number;
  ipfs_proof: string;
  spent_by: string;
  spent_at: number;
}

export default function TrackPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [selectedOrg, setSelectedOrg] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadAllData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      handleRefresh();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load organizations
      const orgs = await getAllOrganizations();
      setOrganizations(orgs);

      // Load all projects from all organizations
      let allProjects: Project[] = [];
      for (const org of orgs) {
        const orgProjects = await getProjectsByOrg(org.id);
        allProjects = [...allProjects, ...orgProjects];
      }
      setProjects(allProjects);

      // Load all donations
      let allDonations: Donation[] = [];
      for (const org of orgs) {
        try {
          const orgDonations = await aptos.view({
            payload: {
              function: `${import.meta.env.VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS}::dapptrack_v2::get_donations_by_org`,
              functionArguments: [org.id],
            },
          });
          allDonations = [...allDonations, ...(orgDonations[0] as Donation[])];
        } catch (e) {
          console.log(`No donations for org ${org.id}`);
        }
      }
      setDonations(allDonations);

      // Load all expenses
      const allExpenses = await getAllExpenses();
      setExpenses(allExpenses);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const getOrgName = (orgId: number) => {
    const org = organizations.find(o => o.id === orgId);
    return org ? org.name : `Organization #${orgId}`;
  };

  const getProjectName = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : `Project #${projectId}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatAmount = (amount: number) => {
    return (Number(amount) / 100000000).toFixed(4);
  };

  // Filter donations
  const filteredDonations = donations.filter(d => {
    if (selectedOrg && d.org_id !== selectedOrg) return false;
    if (selectedProject && d.project_id !== selectedProject) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        getOrgName(d.org_id).toLowerCase().includes(query) ||
        getProjectName(d.project_id).toLowerCase().includes(query) ||
        d.message.toLowerCase().includes(query) ||
        d.donor.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Filter expenses
  const filteredExpenses = expenses.filter(e => {
    if (selectedOrg && e.org_id !== selectedOrg) return false;
    if (selectedProject && e.project_id !== selectedProject) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        getOrgName(e.org_id).toLowerCase().includes(query) ||
        getProjectName(e.project_id).toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Filter projects
  const filteredProjects = projects.filter(p => {
    if (selectedOrg && p.org_id !== selectedOrg) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        getOrgName(p.org_id).toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Calculate statistics
  const totalDonated = filteredDonations.reduce((sum, d) => sum + Number(d.amount), 0);
  const totalSpent = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Track Donations & Funds</h1>
          <p className="text-gray-600">Monitor all donations, projects, and spending with complete transparency</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "🔄 Refresh"}
        </Button>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total Donations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatAmount(totalDonated)} APT</p>
            <p className="text-xs text-gray-500">{filteredDonations.length} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatAmount(totalSpent)} APT</p>
            <p className="text-xs text-gray-500">{filteredExpenses.length} expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{formatAmount(totalDonated - totalSpent)} APT</p>
            <p className="text-xs text-gray-500">Remaining funds</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{filteredProjects.filter(p => p.status === 0).length}</p>
            <p className="text-xs text-gray-500">of {filteredProjects.length} total</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div>
            <Input
              placeholder="🔍 Search donations, projects, or organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Organization Filter */}
          <div>
            <p className="text-sm font-semibold mb-2">Filter by Organization:</p>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={selectedOrg === null ? "default" : "outline"}
                onClick={() => setSelectedOrg(null)}
              >
                All Organizations
              </Button>
              {organizations.map((org) => (
                <Button
                  key={org.id}
                  size="sm"
                  variant={selectedOrg === org.id ? "default" : "outline"}
                  onClick={() => setSelectedOrg(org.id)}
                >
                  {org.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Project Filter */}
          {selectedOrg && (
            <div>
              <p className="text-sm font-semibold mb-2">Filter by Project:</p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={selectedProject === null ? "default" : "outline"}
                  onClick={() => setSelectedProject(null)}
                >
                  All Projects
                </Button>
                {projects.filter(p => p.org_id === selectedOrg).map((project) => (
                  <Button
                    key={project.id}
                    size="sm"
                    variant={selectedProject === project.id ? "default" : "outline"}
                    onClick={() => setSelectedProject(project.id)}
                  >
                    {project.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {(selectedOrg || selectedProject || searchQuery) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedOrg(null);
                setSelectedProject(null);
                setSearchQuery("");
              }}
            >
              ✕ Clear All Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="donations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="donations">
            💚 Donations ({filteredDonations.length})
          </TabsTrigger>
          <TabsTrigger value="expenses">
            💸 Spending ({filteredExpenses.length})
          </TabsTrigger>
          <TabsTrigger value="projects">
            📊 Projects ({filteredProjects.length})
          </TabsTrigger>
        </TabsList>

        {/* Donations Tab */}
        <TabsContent value="donations" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center">Loading donations...</CardContent>
            </Card>
          ) : filteredDonations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No donations found matching your filters
              </CardContent>
            </Card>
          ) : (
            filteredDonations.sort((a, b) => b.donated_at - a.donated_at).map((donation) => (
              <Card key={`${donation.org_id}-${donation.id}`} className="border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-green-600">
                        +{formatAmount(donation.amount)} APT Donated
                      </CardTitle>
                      <CardDescription>
                        To: {getOrgName(donation.org_id)} → {getProjectName(donation.project_id)}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{formatDate(donation.donated_at)}</p>
                      <p className="text-xs text-gray-400">Donation #{donation.id}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600">Donor Address</p>
                    <p className="text-xs font-mono break-all bg-gray-50 p-2 rounded">{donation.donor}</p>
                  </div>
                  {donation.message && (
                    <div>
                      <p className="text-xs text-gray-600">Message</p>
                      <p className="text-sm italic bg-blue-50 p-2 rounded">"{donation.message}"</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.location.href = `/organizations/${donation.org_id}`}
                    >
                      View Organization
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center">Loading expenses...</CardContent>
            </Card>
          ) : filteredExpenses.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No expenses found matching your filters
              </CardContent>
            </Card>
          ) : (
            filteredExpenses.sort((a, b) => b.spent_at - a.spent_at).map((expense) => (
              <Card key={`${expense.org_id}-${expense.id}`} className="border-l-4 border-l-red-500">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-red-600">
                        -{formatAmount(expense.amount)} APT Spent
                      </CardTitle>
                      <CardDescription>
                        By: {getOrgName(expense.org_id)} → {getProjectName(expense.project_id)}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{formatDate(expense.spent_at)}</p>
                      <p className="text-xs text-gray-400">Expense #{expense.id}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600">Description</p>
                    <p className="text-sm bg-gray-50 p-2 rounded">{expense.description}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm font-semibold text-blue-900 mb-2">📎 Proof Document</p>
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${expense.ipfs_proof}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        View Receipt/Invoice on IPFS 🔗
                      </Button>
                    </a>
                    <p className="text-xs text-blue-700 mt-2 font-mono break-all">
                      IPFS Hash: {expense.ipfs_proof}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Recorded by</p>
                    <p className="text-xs font-mono break-all bg-gray-50 p-2 rounded">{expense.spent_by}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center">Loading projects...</CardContent>
            </Card>
          ) : filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No projects found matching your filters
              </CardContent>
            </Card>
          ) : (
            filteredProjects.map((project) => {
              const progress = project.target_amount > 0
                ? (Number(project.raised_amount) / Number(project.target_amount)) * 100
                : 0;
              const statusText = project.status === 0 ? "Active" : project.status === 1 ? "Completed" : "Cancelled";
              const statusColor = project.status === 0 ? "text-green-600" : project.status === 1 ? "text-blue-600" : "text-red-600";

              return (
                <Card key={`${project.org_id}-${project.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{project.name}</CardTitle>
                        <CardDescription>{getOrgName(project.org_id)}</CardDescription>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${statusColor}`}>{statusText}</p>
                        <p className="text-xs text-gray-400">Project #{project.id}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-700">{project.description}</p>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span className="font-semibold">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-green-600 h-3 rounded-full transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Financial Details */}
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-3 bg-green-50 rounded">
                        <p className="text-xs text-gray-600">Raised</p>
                        <p className="font-bold text-green-600">{formatAmount(project.raised_amount)} APT</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded">
                        <p className="text-xs text-gray-600">Spent</p>
                        <p className="font-bold text-red-600">{formatAmount(project.spent_amount)} APT</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded">
                        <p className="text-xs text-gray-600">Target</p>
                        <p className="font-bold text-blue-600">{formatAmount(project.target_amount)} APT</p>
                      </div>
                    </div>

                    {/* Available Balance */}
                    <div className="bg-purple-50 p-3 rounded">
                      <p className="text-xs text-gray-600">Available Balance</p>
                      <p className="font-bold text-purple-600 text-lg">
                        {formatAmount(Number(project.raised_amount) - Number(project.spent_amount))} APT
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOrg(project.org_id);
                          setSelectedProject(project.id);
                        }}
                      >
                        View Transactions
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => window.location.href = `/organizations/${project.org_id}`}
                      >
                        Donate to Project
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Help Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">💡 How to Use Tracking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-900">
          <p><strong>1. Filter by Organization:</strong> Click organization buttons to see specific org's activity</p>
          <p><strong>2. Filter by Project:</strong> Select an org first, then choose a specific project</p>
          <p><strong>3. Search:</strong> Type keywords to find donations, projects, or organizations</p>
          <p><strong>4. View Details:</strong> Click on cards to see full transaction details and proofs</p>
          <p><strong>5. Monitor Progress:</strong> Check project progress bars and financial breakdowns</p>
          <p className="pt-2 border-t border-blue-300">🔒 All data is verified on the Aptos blockchain - 100% transparent and immutable</p>
        </CardContent>
      </Card>
    </div>
  );
}

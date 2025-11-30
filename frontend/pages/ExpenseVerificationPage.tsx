import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAllOrganizations, getAllExpenses, getProjectsByOrg } from "@/view-functions/getOrganizationData";

interface Organization {
  id: number;
  name: string;
  description: string;
}

interface Project {
  id: number;
  org_id: number;
  name: string;
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

export default function ExpenseVerificationPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Filters
  const [selectedOrg, setSelectedOrg] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      handleRefresh();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      loadProjectsForOrg(selectedOrg);
    }
  }, [selectedOrg]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orgs, allExpenses] = await Promise.all([
        getAllOrganizations(),
        getAllExpenses()
      ]);
      setOrganizations(orgs);
      setExpenses(allExpenses);

      // Load all projects
      let allProjects: Project[] = [];
      for (const org of orgs) {
        const orgProjects = await getProjectsByOrg(org.id);
        allProjects = [...allProjects, ...orgProjects];
      }
      setProjects(allProjects);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectsForOrg = async (orgId: number) => {
    try {
      const orgProjects = await getProjectsByOrg(orgId);
      // Update projects for the selected org
      setProjects(prev => [...prev.filter(p => p.org_id !== orgId), ...orgProjects]);
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
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

  // Filter and sort expenses
  let filteredExpenses = expenses.filter(e => {
    if (selectedOrg && e.org_id !== selectedOrg) return false;
    if (selectedProject && e.project_id !== selectedProject) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        e.description.toLowerCase().includes(query) ||
        getOrgName(e.org_id).toLowerCase().includes(query) ||
        getProjectName(e.project_id).toLowerCase().includes(query) ||
        e.ipfs_proof.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Sort expenses
  filteredExpenses = filteredExpenses.sort((a, b) => {
    if (sortBy === "date") {
      return b.spent_at - a.spent_at;
    } else {
      return Number(b.amount) - Number(a.amount);
    }
  });

  // Calculate statistics
  const totalExpenses = filteredExpenses.length;
  const totalAmount = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const uniqueOrgs = new Set(filteredExpenses.map(e => e.org_id)).size;
  const uniqueProjects = new Set(filteredExpenses.map(e => e.project_id)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Verify Organization Spending</h1>
          <p className="text-gray-600">Public transparency - Review all expenses with proof documents</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "🔄 Refresh"}
        </Button>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{totalExpenses}</p>
            <p className="text-xs text-gray-500">Verified transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total Amount Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatAmount(totalAmount)} APT</p>
            <p className="text-xs text-gray-500">With proof documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{uniqueOrgs}</p>
            <p className="text-xs text-gray-500">With recorded expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{uniqueProjects}</p>
            <p className="text-xs text-gray-500">With spending activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div>
            <Input
              placeholder="🔍 Search by description, organization, project, or IPFS hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Organization Filter */}
          <div>
            <p className="text-sm font-semibold mb-2">Filter by Organization:</p>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={selectedOrg === null ? "default" : "outline"}
                onClick={() => {
                  setSelectedOrg(null);
                  setSelectedProject(null);
                }}
              >
                All Organizations
              </Button>
              {organizations.map((org) => (
                <Button
                  key={org.id}
                  size="sm"
                  variant={selectedOrg === org.id ? "default" : "outline"}
                  onClick={() => {
                    setSelectedOrg(org.id);
                    setSelectedProject(null);
                  }}
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

          {/* Sort Options */}
          <div>
            <p className="text-sm font-semibold mb-2">Sort by:</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={sortBy === "date" ? "default" : "outline"}
                onClick={() => setSortBy("date")}
              >
                📅 Date (Newest First)
              </Button>
              <Button
                size="sm"
                variant={sortBy === "amount" ? "default" : "outline"}
                onClick={() => setSortBy("amount")}
              >
                💰 Amount (Highest First)
              </Button>
            </div>
          </div>

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

      {/* Expenses List */}
      {loading ? (
        <Card>
          <CardContent className="py-8 text-center">Loading expenses...</CardContent>
        </Card>
      ) : filteredExpenses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <p className="text-lg mb-2">No expenses found</p>
            <p className="text-sm">Try adjusting your filters or search query</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredExpenses.map((expense) => (
            <Card key={`${expense.org_id}-${expense.id}`} className="border-l-4 border-l-red-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-red-600">
                      -{formatAmount(expense.amount)} APT Spent
                    </CardTitle>
                    <CardDescription>
                      {getOrgName(expense.org_id)} → {getProjectName(expense.project_id)}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{formatDate(expense.spent_at)}</p>
                    <p className="text-xs text-gray-400">Expense #{expense.id}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Description */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">📝 Description</p>
                  <p className="text-sm bg-gray-50 p-3 rounded">{expense.description}</p>
                </div>

                {/* Proof Document - Prominent Display */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                        📎 Proof Document (Receipt/Invoice)
                      </p>
                      <p className="text-xs text-blue-700 font-mono break-all mb-3 bg-white p-2 rounded">
                        IPFS: {expense.ipfs_proof}
                      </p>
                      <div className="flex gap-2">
                        <a
                          href={`https://gateway.pinata.cloud/ipfs/${expense.ipfs_proof}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            🔗 View on IPFS Gateway
                          </Button>
                        </a>
                        <a
                          href={`https://ipfs.io/ipfs/${expense.ipfs_proof}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline">
                            🌐 View on IPFS.io
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recorded By */}
                <div>
                  <p className="text-xs text-gray-600 mb-1">Recorded by Organization Admin</p>
                  <p className="text-xs font-mono break-all bg-gray-50 p-2 rounded">{expense.spent_by}</p>
                </div>

                {/* Blockchain Verification Notice */}
                <div className="bg-green-50 p-3 rounded-md border border-green-200">
                  <p className="text-sm text-green-900 flex items-start gap-2">
                    <span className="text-lg">✓</span>
                    <span>
                      <strong>Blockchain Verified:</strong> This expense is permanently recorded on the Aptos 
                      blockchain and cannot be altered or deleted. The proof document is stored on IPFS 
                      (InterPlanetary File System) for permanent, decentralized access.
                    </span>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.href = `/organizations/${expense.org_id}`}
                  >
                    View Organization
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedOrg(expense.org_id);
                      setSelectedProject(expense.project_id);
                    }}
                  >
                    View All Project Expenses
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Transparency Notice */}
      <Card className="bg-purple-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-900">🔒 100% Public Transparency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-purple-900">
          <p>
            <strong>Every expense is verified:</strong> Organizations must upload proof documents (receipts, 
            invoices, photos) to IPFS before recording expenses on the blockchain.
          </p>
          <p>
            <strong>Immutable records:</strong> Once recorded, expenses cannot be modified or deleted - ensuring 
            complete accountability.
          </p>
          <p>
            <strong>Public access:</strong> Anyone can verify how donated funds are being spent, fostering trust 
            and transparency.
          </p>
          <p>
            <strong>Decentralized storage:</strong> Proof documents stored on IPFS are permanent and accessible 
            from multiple gateways worldwide.
          </p>
        </CardContent>
      </Card>

      {/* Usage Guide */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">💡 How to Verify Expenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-900">
          <p><strong>1. Browse All Expenses:</strong> See complete spending history across all organizations</p>
          <p><strong>2. Filter by Organization:</strong> Focus on specific organizations you're interested in</p>
          <p><strong>3. Filter by Project:</strong> View expenses for particular projects you donated to</p>
          <p><strong>4. Search:</strong> Find specific expenses by keywords or IPFS hashes</p>
          <p><strong>5. View Proofs:</strong> Click "View on IPFS" to see actual receipts and invoices</p>
          <p><strong>6. Sort:</strong> Organize by date or amount to analyze spending patterns</p>
          <p className="pt-2 border-t border-blue-300">
            💡 <strong>Tip:</strong> Bookmark this page to regularly check how organizations are using donations!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

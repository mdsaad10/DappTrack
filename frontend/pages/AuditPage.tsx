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
  admin: string;
  wallet_balance: number;
  total_received: number;
  total_spent: number;
  created_at: number;
}

interface Project {
  id: number;
  org_id: number;
  name: string;
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

interface AuditEntry {
  timestamp: number;
  type: "donation" | "expense";
  org_id: number;
  project_id: number;
  amount: number;
  address: string;
  details: string;
  id: number;
}

export default function AuditPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  
  // Filters
  const [selectedOrg, setSelectedOrg] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "donation" | "expense">("all");

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    // Build audit trail whenever data changes
    buildAuditTrail();
  }, [donations, expenses, organizations, projects]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load organizations
      const orgs = await getAllOrganizations();
      setOrganizations(orgs);

      // Load all projects
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

  const buildAuditTrail = () => {
    const entries: AuditEntry[] = [];

    // Add donations
    donations.forEach(d => {
      entries.push({
        timestamp: d.donated_at,
        type: "donation",
        org_id: d.org_id,
        project_id: d.project_id,
        amount: d.amount,
        address: d.donor,
        details: d.message || "No message",
        id: d.id,
      });
    });

    // Add expenses
    expenses.forEach(e => {
      entries.push({
        timestamp: e.spent_at,
        type: "expense",
        org_id: e.org_id,
        project_id: e.project_id,
        amount: e.amount,
        address: e.spent_by,
        details: e.description,
        id: e.id,
      });
    });

    // Sort by timestamp (newest first)
    entries.sort((a, b) => b.timestamp - a.timestamp);
    setAuditTrail(entries);
  };

  const getOrgName = (orgId: number) => {
    const org = organizations.find(o => o.id === orgId);
    return org ? org.name : `Organization #${orgId}`;
  };

  const getProjectName = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : `Project #${projectId}`;
  };

  const formatAmount = (amount: number) => {
    return (Number(amount) / 100000000).toFixed(4);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Filter audit trail
  let filteredTrail = auditTrail.filter(entry => {
    if (selectedOrg && entry.org_id !== selectedOrg) return false;
    if (filterType !== "all" && entry.type !== filterType) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        getOrgName(entry.org_id).toLowerCase().includes(query) ||
        getProjectName(entry.project_id).toLowerCase().includes(query) ||
        entry.address.toLowerCase().includes(query) ||
        entry.details.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Calculate statistics
  const totalDonations = filteredTrail.filter(e => e.type === "donation").reduce((sum, e) => sum + Number(e.amount), 0);
  const totalExpenses = filteredTrail.filter(e => e.type === "expense").reduce((sum, e) => sum + Number(e.amount), 0);
  const netBalance = totalDonations - totalExpenses;
  const donationCount = filteredTrail.filter(e => e.type === "donation").length;
  const expenseCount = filteredTrail.filter(e => e.type === "expense").length;

  // Organization breakdown
  const orgBreakdown = organizations.map(org => {
    const orgDonations = donations.filter(d => d.org_id === org.id).reduce((sum, d) => sum + Number(d.amount), 0);
    const orgExpenses = expenses.filter(e => e.org_id === org.id).reduce((sum, e) => sum + Number(e.amount), 0);
    return {
      ...org,
      donations: orgDonations,
      expenses: orgExpenses,
      balance: orgDonations - orgExpenses,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Complete Audit Trail</h1>
          <p className="text-gray-600">Full transparency - Every transaction, every fund movement</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "🔄 Refresh"}
        </Button>
      </div>

      {/* Overall Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total Donations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatAmount(totalDonations)} APT</p>
            <p className="text-xs text-gray-500">{donationCount} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatAmount(totalExpenses)} APT</p>
            <p className="text-xs text-gray-500">{expenseCount} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${netBalance >= 0 ? "text-blue-600" : "text-red-600"}`}>
              {formatAmount(netBalance)} APT
            </p>
            <p className="text-xs text-gray-500">Available funds</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{filteredTrail.length}</p>
            <p className="text-xs text-gray-500">Audit entries</p>
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
              placeholder="🔍 Search by organization, project, address, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Transaction Type Filter */}
          <div>
            <p className="text-sm font-semibold mb-2">Transaction Type:</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={filterType === "all" ? "default" : "outline"}
                onClick={() => setFilterType("all")}
              >
                All Transactions
              </Button>
              <Button
                size="sm"
                variant={filterType === "donation" ? "default" : "outline"}
                onClick={() => setFilterType("donation")}
              >
                💚 Donations Only
              </Button>
              <Button
                size="sm"
                variant={filterType === "expense" ? "default" : "outline"}
                onClick={() => setFilterType("expense")}
              >
                💸 Expenses Only
              </Button>
            </div>
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

          {(selectedOrg || searchQuery || filterType !== "all") && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedOrg(null);
                setSearchQuery("");
                setFilterType("all");
              }}
            >
              ✕ Clear All Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline">⏱️ Transaction Timeline</TabsTrigger>
          <TabsTrigger value="orgs">📊 Organization Breakdown</TabsTrigger>
        </TabsList>

        {/* Timeline View */}
        <TabsContent value="timeline" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center">Loading audit trail...</CardContent>
            </Card>
          ) : filteredTrail.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No transactions found matching your filters
              </CardContent>
            </Card>
          ) : (
            filteredTrail.map((entry, index) => (
              <Card 
                key={`${entry.type}-${entry.id}-${index}`}
                className={`border-l-4 ${entry.type === "donation" ? "border-l-green-500" : "border-l-red-500"}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className={`text-lg ${entry.type === "donation" ? "text-green-600" : "text-red-600"}`}>
                        {entry.type === "donation" ? "+" : "-"}{formatAmount(entry.amount)} APT
                        <span className="ml-2 text-sm font-normal text-gray-600">
                          {entry.type === "donation" ? "💚 Donation" : "💸 Expense"}
                        </span>
                      </CardTitle>
                      <CardDescription>
                        {getOrgName(entry.org_id)} → {getProjectName(entry.project_id)}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{formatDate(entry.timestamp)}</p>
                      <p className="text-xs text-gray-400">ID: {entry.id}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600">{entry.type === "donation" ? "Donor Address" : "Recorded By"}</p>
                    <p className="text-xs font-mono break-all bg-gray-50 p-2 rounded">{entry.address}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">{entry.type === "donation" ? "Message" : "Description"}</p>
                    <p className="text-sm bg-gray-50 p-2 rounded">{entry.details}</p>
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.location.href = `/organizations/${entry.org_id}`}
                    >
                      View Organization
                    </Button>
                    {entry.type === "expense" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = `/verify-expenses`}
                      >
                        View Proof
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Organization Breakdown View */}
        <TabsContent value="orgs" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center">Loading organization data...</CardContent>
            </Card>
          ) : orgBreakdown.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No organizations found
              </CardContent>
            </Card>
          ) : (
            orgBreakdown.map((org) => (
              <Card key={org.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{org.name}</CardTitle>
                      <CardDescription>Organization #{org.id}</CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedOrg(org.id)}
                    >
                      Filter Timeline
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Financial Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 p-3 rounded text-center">
                      <p className="text-xs text-gray-600">Total Received</p>
                      <p className="font-bold text-lg text-green-600">{formatAmount(org.donations)} APT</p>
                      <p className="text-xs text-gray-500">
                        {donations.filter(d => d.org_id === org.id).length} donations
                      </p>
                    </div>
                    <div className="bg-red-50 p-3 rounded text-center">
                      <p className="text-xs text-gray-600">Total Spent</p>
                      <p className="font-bold text-lg text-red-600">{formatAmount(org.expenses)} APT</p>
                      <p className="text-xs text-gray-500">
                        {expenses.filter(e => e.org_id === org.id).length} expenses
                      </p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded text-center">
                      <p className="text-xs text-gray-600">Current Balance</p>
                      <p className={`font-bold text-lg ${org.balance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                        {formatAmount(org.balance)} APT
                      </p>
                      <p className="text-xs text-gray-500">Available</p>
                    </div>
                  </div>

                  {/* Admin Info */}
                  <div>
                    <p className="text-xs text-gray-600">Organization Admin</p>
                    <p className="text-xs font-mono break-all bg-gray-50 p-2 rounded">{org.admin}</p>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => window.location.href = `/organizations/${org.id}`}
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.location.href = `/track`}
                    >
                      View All Transactions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Transparency Notice */}
      <Card className="bg-purple-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-900">🔒 Complete Audit Trail Transparency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-purple-900">
          <p>
            <strong>Every transaction recorded:</strong> This audit page shows the complete history of all 
            donations received and expenses made across all organizations.
          </p>
          <p>
            <strong>Blockchain verified:</strong> All transactions are permanently recorded on the Aptos blockchain 
            and cannot be modified or deleted.
          </p>
          <p>
            <strong>Full accountability:</strong> Track fund flows from donors to organizations to expenses with 
            complete transparency.
          </p>
          <p>
            <strong>Real-time updates:</strong> Data is fetched directly from the blockchain, ensuring accuracy 
            and immutability.
          </p>
        </CardContent>
      </Card>

      {/* Usage Guide */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">💡 How to Use Audit Trail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-900">
          <p><strong>1. View Timeline:</strong> See all transactions chronologically (donations and expenses)</p>
          <p><strong>2. Organization Breakdown:</strong> Review financial summary for each organization</p>
          <p><strong>3. Filter by Type:</strong> Show only donations or only expenses</p>
          <p><strong>4. Filter by Organization:</strong> Focus on specific organization's transactions</p>
          <p><strong>5. Search:</strong> Find specific transactions by keywords or addresses</p>
          <p><strong>6. Verify:</strong> Click "View Proof" on expenses to see supporting documents</p>
          <p className="pt-2 border-t border-blue-300">
            🔍 <strong>Perfect for:</strong> Donors wanting to verify fund usage, auditors reviewing transactions, 
            or anyone seeking complete transparency!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

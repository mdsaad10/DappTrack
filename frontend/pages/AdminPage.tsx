import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const config = new AptosConfig({ 
  network: Network.TESTNET,
  fullnode: "https://api.testnet.aptoslabs.com/v1"
});
const aptos = new Aptos(config);
const MODULE_ADDRESS = import.meta.env.VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS;
const BACKEND_URL = "http://localhost:3001";

interface Organization {
  id: number;
  name: string;
  description: string;
  admin: string;
  wallet_balance: number;
  total_received: number;
  total_spent: number;
  created_at: number;
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

interface Project {
  id: number;
  org_id: number;
  name: string;
  description: string;
  target_amount: number;
  raised_amount: number;
  spent_amount: number;
  status: number;
  created_at: number;
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

export default function AdminPage() {
  const { account, signAndSubmitTransaction } = useWallet();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [myOrganizations, setMyOrganizations] = useState<Organization[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const [createProjectForm, setCreateProjectForm] = useState({
    name: "",
    description: "",
    targetAmount: "",
  });

  const [recordExpenseForm, setRecordExpenseForm] = useState({
    projectId: "",
    description: "",
    amount: "",
  });

  useEffect(() => {
    if (account) {
      loadMyOrganizations();
    }
  }, [account]);

  useEffect(() => {
    if (selectedOrg) {
      loadOrganizationData();
    }
  }, [selectedOrg]);

  const loadMyOrganizations = async () => {
    if (!account) return;
    setLoadingData(true);
    try {
      const result = await aptos.view({
        payload: {
          function: `${MODULE_ADDRESS}::dapptrack_v2::get_all_organizations`,
          functionArguments: [],
        },
      });
      const allOrgs = result[0] as Organization[];
      const myOrgs = allOrgs.filter(org => org.admin.toLowerCase() === account.address.toString().toLowerCase());
      setMyOrganizations(myOrgs);
      if (myOrgs.length > 0) {
        setSelectedOrg(myOrgs[0]);
      }
    } catch (error) {
      console.error("Failed to load organizations:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const loadOrganizationData = async () => {
    if (!selectedOrg) return;
    try {
      // Refresh selected org data
      const orgResult = await aptos.view({
        payload: {
          function: `${MODULE_ADDRESS}::dapptrack_v2::get_organization_by_id`,
          functionArguments: [selectedOrg.id],
        },
      });
      setSelectedOrg(orgResult[0] as Organization);

      // Load donations
      const donationsResult = await aptos.view({
        payload: {
          function: `${MODULE_ADDRESS}::dapptrack_v2::get_donations_by_org`,
          functionArguments: [selectedOrg.id],
        },
      });
      setDonations(donationsResult[0] as Donation[]);

      // Load projects
      const projectsResult = await aptos.view({
        payload: {
          function: `${MODULE_ADDRESS}::dapptrack_v2::get_projects_by_org`,
          functionArguments: [selectedOrg.id],
        },
      });
      setProjects(projectsResult[0] as Project[]);

      // Load expenses
      const expensesResult = await aptos.view({
        payload: {
          function: `${MODULE_ADDRESS}::dapptrack_v2::get_expenses_by_org`,
          functionArguments: [selectedOrg.id],
        },
      });
      setExpenses(expensesResult[0] as Expense[]);
    } catch (error) {
      console.error("Failed to load organization data:", error);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !selectedOrg) {
      toast({ title: "Error", description: "Please connect your wallet", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const targetInOctas = Math.floor(parseFloat(createProjectForm.targetAmount) * 100000000);
      const response = await signAndSubmitTransaction({
        sender: account.address.toString(),
        data: {
          function: `${MODULE_ADDRESS}::dapptrack_v2::create_project`,
          functionArguments: [
            selectedOrg.id,
            createProjectForm.name,
            createProjectForm.description,
            targetInOctas,
          ],
        },
      });

      await aptos.waitForTransaction({ transactionHash: response.hash });

      toast({
        title: "Project Created! 🎉",
        description: `Project "${createProjectForm.name}" has been created successfully`,
      });

      setCreateProjectForm({ name: "", description: "", targetAmount: "" });
      await loadOrganizationData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !selectedOrg) {
      toast({ title: "Error", description: "Please connect your wallet", variant: "destructive" });
      return;
    }

    if (!proofFile) {
      toast({ title: "Error", description: "Please upload a proof document", variant: "destructive" });
      return;
    }

    setLoading(true);
    setUploadingProof(true);

    try {
      // Step 1: Upload proof to IPFS
      const formData = new FormData();
      formData.append("photo", proofFile);

      const uploadRes = await fetch(`${BACKEND_URL}/api/upload-proof`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Failed to upload proof");

      const { ipfsHash } = await uploadRes.json();

      // Step 2: Record expense on blockchain
      const amountInOctas = Math.floor(parseFloat(recordExpenseForm.amount) * 100000000);
      const response = await signAndSubmitTransaction({
        sender: account.address.toString(),
        data: {
          function: `${MODULE_ADDRESS}::dapptrack_v2::record_expense`,
          functionArguments: [
            selectedOrg.id,
            parseInt(recordExpenseForm.projectId),
            recordExpenseForm.description,
            amountInOctas,
            ipfsHash,
          ],
        },
      });

      await aptos.waitForTransaction({ transactionHash: response.hash });

      toast({
        title: "Expense Recorded! 📝",
        description: `Expense of ${recordExpenseForm.amount} APT has been recorded with proof`,
      });

      setRecordExpenseForm({ projectId: "", description: "", amount: "" });
      setProofFile(null);
      await loadOrganizationData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setUploadingProof(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getProjectName = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : `Project #${projectId}`;
  };

  if (!account) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Organization Admin Dashboard</CardTitle>
          <CardDescription>Connect your wallet to manage your organizations</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loadingData) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-8 text-center">Loading your organizations...</CardContent>
      </Card>
    );
  }

  if (myOrganizations.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>No Organizations Found</CardTitle>
          <CardDescription>You don't have any registered organizations yet</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.href = '/register-organization'} className="w-full">
            Register an Organization
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organization Admin Dashboard</h1>
        <p className="text-gray-600">Manage your organizations, projects, expenses, and view donations</p>
      </div>

      {/* Organization Selector */}
      {myOrganizations.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {myOrganizations.map((org) => (
                <Button
                  key={org.id}
                  variant={selectedOrg?.id === org.id ? "default" : "outline"}
                  onClick={() => setSelectedOrg(org)}
                >
                  {org.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedOrg && (
        <>
          {/* Financial Overview */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Wallet Balance</CardDescription>
                <CardTitle className="text-2xl text-green-600">
                  {(Number(selectedOrg.wallet_balance) / 100000000).toFixed(4)} APT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500">Available Funds</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Received</CardDescription>
                <CardTitle className="text-2xl text-blue-600">
                  {(Number(selectedOrg.total_received) / 100000000).toFixed(4)} APT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500">All-Time Donations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Spent</CardDescription>
                <CardTitle className="text-2xl text-red-600">
                  {(Number(selectedOrg.total_spent) / 100000000).toFixed(4)} APT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500">All Expenses</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Donations</CardDescription>
                <CardTitle className="text-2xl">{donations.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500">From {new Set(donations.map(d => d.donor)).size} Donors</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="donations">Donations ({donations.length})</TabsTrigger>
              <TabsTrigger value="expenses">Expenses ({expenses.length})</TabsTrigger>
              <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Create Project */}
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Project</CardTitle>
                    <CardDescription>Add a project to organize donations and expenses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateProject} className="space-y-4">
                      <div>
                        <Label htmlFor="projectName">Project Name</Label>
                        <Input
                          id="projectName"
                          value={createProjectForm.name}
                          onChange={(e) => setCreateProjectForm({ ...createProjectForm, name: e.target.value })}
                          placeholder="e.g., Community Center Construction"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={createProjectForm.description}
                          onChange={(e) => setCreateProjectForm({ ...createProjectForm, description: e.target.value })}
                          placeholder="Project description"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="target">Target Amount (APT)</Label>
                        <Input
                          id="target"
                          type="number"
                          step="0.0001"
                          value={createProjectForm.targetAmount}
                          onChange={(e) => setCreateProjectForm({ ...createProjectForm, targetAmount: e.target.value })}
                          placeholder="0 for no specific target"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Creating..." : "Create Project"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Record Expense */}
                <Card>
                  <CardHeader>
                    <CardTitle>Record Expense</CardTitle>
                    <CardDescription>Document spending with proof (receipt, invoice)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleRecordExpense} className="space-y-4">
                      <div>
                        <Label htmlFor="expenseProject">Project</Label>
                        <select
                          id="expenseProject"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={recordExpenseForm.projectId}
                          onChange={(e) => setRecordExpenseForm({ ...recordExpenseForm, projectId: e.target.value })}
                          required
                        >
                          <option value="">Select Project</option>
                          {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="expenseDesc">Description</Label>
                        <Input
                          id="expenseDesc"
                          value={recordExpenseForm.description}
                          onChange={(e) => setRecordExpenseForm({ ...recordExpenseForm, description: e.target.value })}
                          placeholder="What was purchased?"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="expenseAmount">Amount (APT)</Label>
                        <Input
                          id="expenseAmount"
                          type="number"
                          step="0.0001"
                          value={recordExpenseForm.amount}
                          onChange={(e) => setRecordExpenseForm({ ...recordExpenseForm, amount: e.target.value })}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="proof">Upload Proof (Receipt/Invoice)</Label>
                        <Input
                          id="proof"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                          required
                        />
                        {proofFile && (
                          <p className="text-xs text-gray-600 mt-1">Selected: {proofFile.name}</p>
                        )}
                      </div>
                      <Button type="submit" className="w-full" disabled={loading || uploadingProof}>
                        {uploadingProof ? "Uploading Proof..." : loading ? "Recording..." : "Record Expense"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {donations.length === 0 && expenses.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No activity yet</p>
                    )}
                    {[...donations.slice(0, 3), ...expenses.slice(0, 3)]
                      .sort((a, b) => {
                        const aTime = 'donated_at' in a ? a.donated_at : a.spent_at;
                        const bTime = 'donated_at' in b ? b.donated_at : b.spent_at;
                        return bTime - aTime;
                      })
                      .slice(0, 5)
                      .map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-semibold">
                              {'donated_at' in item ? '💰 Donation' : '📝 Expense'}
                            </p>
                            <p className="text-xs text-gray-600">
                              {(Number(item.amount) / 100000000).toFixed(4)} APT
                            </p>
                          </div>
                          <p className="text-xs text-gray-500">
                            {formatDate('donated_at' in item ? item.donated_at : item.spent_at)}
                          </p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Donations Tab */}
            <TabsContent value="donations" className="space-y-4">
              {donations.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    No donations received yet
                  </CardContent>
                </Card>
              ) : (
                donations.map((donation) => (
                  <Card key={donation.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {(Number(donation.amount) / 100000000).toFixed(4)} APT
                          </CardTitle>
                          <CardDescription>
                            Donation #{donation.id} • {getProjectName(donation.project_id)}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{formatDate(donation.donated_at)}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-600">From</p>
                          <p className="text-sm font-mono break-all">{donation.donor}</p>
                        </div>
                        {donation.message && (
                          <div>
                            <p className="text-xs text-gray-600">Message</p>
                            <p className="text-sm italic">"{donation.message}"</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Expenses Tab */}
            <TabsContent value="expenses" className="space-y-4">
              {expenses.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    No expenses recorded yet
                  </CardContent>
                </Card>
              ) : (
                expenses.map((expense) => (
                  <Card key={expense.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg text-red-600">
                            -{(Number(expense.amount) / 100000000).toFixed(4)} APT
                          </CardTitle>
                          <CardDescription>
                            Expense #{expense.id} • {getProjectName(expense.project_id)}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{formatDate(expense.spent_at)}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-600">Description</p>
                          <p className="text-sm">{expense.description}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Proof (IPFS)</p>
                          <a
                            href={`https://gateway.pinata.cloud/ipfs/${expense.ipfs_proof}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline font-mono break-all"
                          >
                            {expense.ipfs_proof}
                          </a>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Spent By</p>
                          <p className="text-sm font-mono text-xs break-all">{expense.spent_by}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-4">
              {projects.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    No projects created yet. Create one to start accepting donations!
                  </CardContent>
                </Card>
              ) : (
                projects.map((project) => {
                  const progress = project.target_amount > 0
                    ? (Number(project.raised_amount) / Number(project.target_amount)) * 100
                    : 0;

                  return (
                    <Card key={project.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{project.name}</CardTitle>
                            <CardDescription>{project.description}</CardDescription>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Project #{project.id}</p>
                            <p className="text-xs text-gray-500">
                              Created {formatDate(project.created_at)}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-gray-600">Raised</p>
                              <p className="font-semibold text-green-600">
                                {(Number(project.raised_amount) / 100000000).toFixed(4)} APT
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Spent</p>
                              <p className="font-semibold text-red-600">
                                {(Number(project.spent_amount) / 100000000).toFixed(4)} APT
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Target</p>
                              <p className="font-semibold">
                                {project.target_amount > 0
                                  ? `${(Number(project.target_amount) / 100000000).toFixed(4)} APT`
                                  : "No target"}
                              </p>
                            </div>
                          </div>
                          {project.target_amount > 0 && (
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Progress</span>
                                <span>{progress.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

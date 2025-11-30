import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { getAllOrganizations, getProjectsByOrg } from "@/view-functions/getOrganizationData";
import { donateToOrganization } from "@/entry-functions/donateToOrganization";

interface Organization {
  id: number;
  name: string;
  description: string;
  admin: string;
  total_received: number;
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

export default function DonatePage() {
  const { account, signAndSubmitTransaction } = useWallet();
  const { toast } = useToast();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [donating, setDonating] = useState(false);
  
  // Selected items for donation
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Donation form
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  
  // Search
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      loadProjectsForOrg(selectedOrg.id);
    }
  }, [selectedOrg]);

  const loadData = async () => {
    setLoading(true);
    try {
      const orgs = await getAllOrganizations();
      setOrganizations(orgs);
    } catch (error) {
      console.error("Failed to load organizations:", error);
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProjectsForOrg = async (orgId: number) => {
    try {
      const orgProjects = await getProjectsByOrg(orgId);
      setProjects(orgProjects.filter(p => p.status === 0)); // Only show active projects
      if (orgProjects.length > 0) {
        setSelectedProject(orgProjects[0]); // Auto-select first project
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  };

  const handleSelectOrganization = (org: Organization) => {
    setSelectedOrg(org);
    setSelectedProject(null);
    setProjects([]);
  };

  const handleDonate = async () => {
    if (!account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to donate",
        variant: "destructive",
      });
      return;
    }

    if (!selectedOrg || !selectedProject) {
      toast({
        title: "Selection Required",
        description: "Please select an organization and project",
        variant: "destructive",
      });
      return;
    }

    const donationAmount = parseFloat(amount);
    if (!donationAmount || donationAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid donation amount",
        variant: "destructive",
      });
      return;
    }

    setDonating(true);
    try {
      const amountInOctas = Math.floor(donationAmount * 100000000);

      await signAndSubmitTransaction(
        donateToOrganization({
          orgId: selectedOrg.id,
          projectId: selectedProject.id,
          amount: amountInOctas,
          message: message || "",
        })
      );

      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: "Donation Successful! 🎉",
        description: `You donated ${donationAmount} APT to ${selectedProject.name}`,
      });

      // Reset form
      setAmount("");
      setMessage("");
      
      // Reload data
      await loadData();
      if (selectedOrg) {
        await loadProjectsForOrg(selectedOrg.id);
      }
    } catch (error: any) {
      console.error("Donation failed:", error);
      toast({
        title: "Donation Failed",
        description: error.message || "Failed to process donation",
        variant: "destructive",
      });
    } finally {
      setDonating(false);
    }
  };

  const formatAmount = (amount: number) => {
    return (Number(amount) / 100000000).toFixed(4);
  };

  const filteredOrganizations = organizations.filter(org => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      org.name.toLowerCase().includes(query) ||
      org.description.toLowerCase().includes(query)
    );
  });

  if (!account) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-900">👋 Connect Your Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-800 mb-4">
              Please connect your Aptos wallet to make donations and support amazing projects.
            </p>
            <p className="text-sm text-yellow-700">
              Click the "Connect Wallet" button in the header to get started.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Why Donate Through DappTrack?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔍</span>
              <div>
                <p className="font-semibold">Complete Transparency</p>
                <p className="text-sm text-gray-600">
                  Track every dollar donated and see exactly how it's spent with proof documents
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="font-semibold">Blockchain Security</p>
                <p className="text-sm text-gray-600">
                  All transactions recorded permanently on Aptos blockchain - tamper-proof and auditable
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-semibold">Direct Impact</p>
                <p className="text-sm text-gray-600">
                  Funds go directly to organization wallets - no intermediaries
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold">Verified Spending</p>
                <p className="text-sm text-gray-600">
                  Every expense backed by receipts/invoices stored on IPFS
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Make a Donation</h1>
        <p className="text-gray-600">Support organizations and projects with complete transparency</p>
      </div>

      {/* Main Layout - Two Columns */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Organization & Project Selection */}
        <div className="space-y-4">
          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>Find Organizations</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="🔍 Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Organizations List */}
          <Card>
            <CardHeader>
              <CardTitle>Select Organization ({filteredOrganizations.length})</CardTitle>
              <CardDescription>Choose an organization to support</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {loading ? (
                <p className="text-center py-4 text-gray-500">Loading organizations...</p>
              ) : filteredOrganizations.length === 0 ? (
                <p className="text-center py-4 text-gray-500">No organizations found</p>
              ) : (
                filteredOrganizations.map((org) => (
                  <Card
                    key={org.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedOrg?.id === org.id ? "border-blue-500 border-2 bg-blue-50" : ""
                    }`}
                    onClick={() => handleSelectOrganization(org)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{org.name}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2">
                        {org.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600">Total Received:</span>
                        <span className="font-bold text-green-600">
                          {formatAmount(org.total_received)} APT
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          {/* Projects List */}
          {selectedOrg && (
            <Card>
              <CardHeader>
                <CardTitle>Select Project ({projects.length})</CardTitle>
                <CardDescription>Choose a specific project to fund</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {projects.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p>No active projects available</p>
                    <p className="text-xs mt-2">Contact organization admin to create projects</p>
                  </div>
                ) : (
                  projects.map((project) => {
                    const progress = project.target_amount > 0
                      ? (Number(project.raised_amount) / Number(project.target_amount)) * 100
                      : 0;

                    return (
                      <Card
                        key={project.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedProject?.id === project.id ? "border-green-500 border-2 bg-green-50" : ""
                        }`}
                        onClick={() => setSelectedProject(project)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">{project.name}</CardTitle>
                          <CardDescription className="text-xs line-clamp-2">
                            {project.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {/* Progress */}
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span className="font-semibold">{progress.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </div>
                          {/* Amounts */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-gray-600">Raised</p>
                              <p className="font-bold text-green-600">
                                {formatAmount(project.raised_amount)} APT
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Target</p>
                              <p className="font-bold text-blue-600">
                                {formatAmount(project.target_amount)} APT
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Donation Form */}
        <div className="space-y-4">
          <Card className={selectedOrg && selectedProject ? "border-green-500 shadow-lg" : ""}>
            <CardHeader>
              <CardTitle>Donation Details</CardTitle>
              <CardDescription>
                {selectedOrg && selectedProject
                  ? `Donating to ${selectedProject.name}`
                  : "Select an organization and project to donate"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selection Summary */}
              {selectedOrg && (
                <div className="bg-blue-50 p-3 rounded space-y-2">
                  <div>
                    <p className="text-xs text-blue-700">Organization:</p>
                    <p className="font-semibold text-blue-900">{selectedOrg.name}</p>
                  </div>
                  {selectedProject && (
                    <div>
                      <p className="text-xs text-blue-700">Project:</p>
                      <p className="font-semibold text-blue-900">{selectedProject.name}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Amount Input */}
              <div>
                <Label htmlFor="amount">Donation Amount (APT)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter amount in APT"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={!selectedProject}
                />
                {amount && (
                  <p className="text-xs text-gray-500 mt-1">
                    ≈ ${(parseFloat(amount) * 10).toFixed(2)} USD (estimated)
                  </p>
                )}
              </div>

              {/* Message Input */}
              <div>
                <Label htmlFor="message">Message (Optional)</Label>
                <Input
                  id="message"
                  placeholder="Leave a message with your donation"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={!selectedProject}
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {message.length}/200 characters
                </p>
              </div>

              {/* Donate Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleDonate}
                disabled={!selectedOrg || !selectedProject || !amount || donating}
              >
                {donating ? "Processing..." : `Donate ${amount || "0"} APT 💚`}
              </Button>

              {/* Transaction Info */}
              <div className="bg-gray-50 p-3 rounded space-y-1 text-xs text-gray-700">
                <p>✓ Instant blockchain confirmation</p>
                <p>✓ Funds sent directly to organization</p>
                <p>✓ Transaction recorded permanently</p>
                <p>✓ Track your donation impact anytime</p>
              </div>
            </CardContent>
          </Card>

          {/* Why Donate Card */}
          <Card className="bg-purple-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-900">💜 Your Impact Matters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-purple-900">
              <p>
                <strong>100% Transparent:</strong> See exactly how your donation is used with receipts and proofs
              </p>
              <p>
                <strong>Blockchain Verified:</strong> Every transaction permanently recorded on Aptos
              </p>
              <p>
                <strong>Real-Time Tracking:</strong> Monitor project progress and fund utilization
              </p>
              <p>
                <strong>Direct Impact:</strong> No middlemen - funds go straight to the cause
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Usage Guide */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">💡 How to Donate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-900">
          <p><strong>Step 1:</strong> Browse and search for organizations that align with your values</p>
          <p><strong>Step 2:</strong> Select an organization to view their active projects</p>
          <p><strong>Step 3:</strong> Choose a specific project you want to support</p>
          <p><strong>Step 4:</strong> Enter donation amount in APT and optionally add a message</p>
          <p><strong>Step 5:</strong> Click "Donate" and approve the transaction in your wallet</p>
          <p className="pt-2 border-t border-blue-300">
            💡 <strong>Tip:</strong> After donating, visit the Track page to monitor how your donation is being used!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

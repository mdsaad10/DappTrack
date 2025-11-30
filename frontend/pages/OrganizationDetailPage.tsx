import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Organization } from "@/data/organizations";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { getOrganizationById, getProjectsByOrg } from "@/view-functions/getOrganizationData";

const config = new AptosConfig({ 
  network: Network.TESTNET,
  fullnode: "https://api.testnet.aptoslabs.com/v1"
});
const aptos = new Aptos(config);
const MODULE_ADDRESS = import.meta.env.VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS;

export default function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { account, signAndSubmitTransaction } = useWallet();
  const { toast } = useToast();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [donationAmount, setDonationAmount] = useState("");
  const [donating, setDonating] = useState(false);
  const [activeTab, setActiveTab] = useState<"about" | "funds" | "reviews">("about");
  const [defaultProjectId, setDefaultProjectId] = useState<number | null>(null);
  const [blockchainOrgId, setBlockchainOrgId] = useState<number | null>(null);
  const [creatingProject, setCreatingProject] = useState(false);

  useEffect(() => {
    fetchOrganization();
  }, [id]);

  const ensureDefaultProject = async (orgId: number) => {
    try {
      // Check if any projects exist for this organization
      const projects = await getProjectsByOrg(orgId);
      
      if (projects && projects.length > 0) {
        // Use the first project as default
        setDefaultProjectId(projects[0].id);
      } else {
        // No project exists - need to create one, but only the admin can do this
        // For now, set to null and show a message
        setDefaultProjectId(null);
      }
    } catch (error) {
      console.error('Error checking projects:', error);
      setDefaultProjectId(null);
    }
  };

  const fetchOrganization = async () => {
    try {
      if (!id) {
        navigate("/organizations");
        return;
      }

      const orgId = parseInt(id);
      const blockchainOrg = await getOrganizationById(orgId);
      
      if (blockchainOrg) {
        // Parse IPFS metadata if available
        let metadata: any = {};
        try {
          if (blockchainOrg.ipfs_metadata) {
            metadata = JSON.parse(blockchainOrg.ipfs_metadata);
          }
        } catch (e) {
          console.log('Could not parse metadata');
        }

        const org: Organization = {
          id: blockchainOrg.id.toString(),
          name: blockchainOrg.name,
          description: blockchainOrg.description,
          type: metadata.type || 'NGO',
          locality: metadata.locality || 'Unknown',
          logo: metadata.logo || '🏛️',
          mission: metadata.mission || blockchainOrg.description,
          founded: metadata.founded || 'N/A',
          website: metadata.website || '',
          contactEmail: metadata.contactEmail || '',
          registeredBy: blockchainOrg.admin,
          trustScore: 85,
          totalDonations: Number(blockchainOrg.total_received) / 100000000,
          activeFunds: 0,
          completedProjects: 0,
          beneficiaries: 0,
          verified: true,
          reviews: []
        };
        
        setOrganization(org);
        setBlockchainOrgId(blockchainOrg.id);
        
        // Fetch or create default project
        await ensureDefaultProject(blockchainOrg.id);
      } else {
        toast({ title: "Error", description: "Organization not found", variant: "destructive" });
        navigate("/organizations");
      }
    } catch (error) {
      console.error('Failed to fetch organization:', error);
      toast({ title: "Error", description: "Failed to load organization", variant: "destructive" });
    }
  };

  const handleCreateDefaultProject = async () => {
    if (!account || !blockchainOrgId) {
      toast({ title: "Error", description: "Please connect your wallet", variant: "destructive" });
      return;
    }

    setCreatingProject(true);
    try {
      const createProjectTx = await signAndSubmitTransaction({
        sender: account.address.toString(),
        data: {
          function: `${MODULE_ADDRESS}::dapptrack_v2::create_project`,
          functionArguments: [
            blockchainOrgId,
            "General Fund",
            "Default project for general donations to the organization",
            0 // No specific target amount
          ],
        },
      });
      
      await aptos.waitForTransaction({ transactionHash: createProjectTx.hash });
      
      toast({
        title: "Project Created! 🎉",
        description: "Your organization now has a General Fund project for accepting donations.",
      });

      // Refresh project list
      await ensureDefaultProject(blockchainOrgId);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCreatingProject(false);
    }
  };

  const handleDonate = async () => {
    if (!account) {
      toast({ title: "Error", description: "Please connect your wallet", variant: "destructive" });
      return;
    }

    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      toast({ title: "Error", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    setDonating(true);
    try {
      if (!blockchainOrgId) {
        toast({ title: "Error", description: "Organization ID not found", variant: "destructive" });
        return;
      }

      // Check if we need to create a default project first
      let projectId = defaultProjectId;
      if (!projectId) {
        // Create a default "General Fund" project
        try {
          const createProjectTx = await signAndSubmitTransaction({
            sender: account.address.toString(),
            data: {
              function: `${MODULE_ADDRESS}::dapptrack_v2::create_project`,
              functionArguments: [
                blockchainOrgId,
                "General Fund",
                "Default project for general donations",
                0 // No target amount
              ],
            },
          });
          await aptos.waitForTransaction({ transactionHash: createProjectTx.hash });
          
          // Fetch the newly created project
          const projects = await getProjectsByOrg(blockchainOrgId);
          if (projects && projects.length > 0) {
            projectId = projects[0].id;
            setDefaultProjectId(projectId);
          }
        } catch (error: any) {
          // If project creation fails (not admin), show error
          if (error.message.includes('E_UNAUTHORIZED')) {
            toast({ 
              title: "Error", 
              description: "No project exists for this organization. Only the organization admin can create projects.",
              variant: "destructive" 
            });
          } else {
            toast({ title: "Error", description: error.message, variant: "destructive" });
          }
          return;
        }
      }

      if (!projectId) {
        toast({ title: "Error", description: "No project available for donations", variant: "destructive" });
        return;
      }

      const amountInOctas = Math.floor(parseFloat(donationAmount) * 100000000); // Convert APT to Octas

      const response = await signAndSubmitTransaction({
        sender: account.address.toString(),
        data: {
          function: `${MODULE_ADDRESS}::dapptrack_v2::donate_to_organization`,
          functionArguments: [blockchainOrgId, projectId, amountInOctas, `Donation to ${organization?.name}`],
        },
      });

      await aptos.waitForTransaction({ transactionHash: response.hash });

      toast({
        title: "Donation Successful! 🎉",
        description: `Thank you for donating ${donationAmount} APT to ${organization?.name}. The funds have been transferred to the organization's admin wallet.`,
      });

      setDonationAmount("");
      
      // Refresh organization data to show updated totals
      await fetchOrganization();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDonating(false);
    }
  };

  if (!organization) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12 text-center">Loading organization...</CardContent>
      </Card>
    );
  }

  const avgRating = organization.reviews.length > 0
    ? (organization.reviews.reduce((acc, r) => acc + r.rating, 0) / organization.reviews.length).toFixed(1)
    : "N/A";

  const getTrustBadgeColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 75) return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  };

  const isAdmin = account && organization && account.address.toString() === organization.registeredBy;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={() => navigate("/organizations")}>
        ← Back to Organizations
      </Button>

      {/* Admin Alert - No Project */}
      {isAdmin && defaultProjectId === null && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-lg text-yellow-800">⚠️ Admin Action Required</CardTitle>
            <CardDescription className="text-yellow-700">
              Your organization doesn't have any projects yet. Create a project to start accepting donations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCreateDefaultProject} disabled={creatingProject}>
              {creatingProject ? "Creating..." : "Create General Fund Project"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Hero Section */}
      <Card className="overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-8xl">{organization.logo}</div>
          </div>
        </div>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-3xl">{organization.name}</CardTitle>
                {organization.verified && (
                  <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                    ✓ Verified
                  </span>
                )}
              </div>
              <CardDescription className="text-base">
                {organization.type} • {organization.locality} • Founded {organization.founded}
              </CardDescription>
              <div className="flex items-center gap-2 mt-3">
                <span className={`text-sm px-3 py-1 rounded-full font-semibold border-2 ${getTrustBadgeColor(organization.trustScore)}`}>
                  {organization.trustScore}% Trust Score
                </span>
                <span className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded-full font-medium">
                  ⭐ {avgRating} ({organization.reviews.length} reviews)
                </span>
              </div>
            </div>

            {/* Quick Donation Card */}
            <Card className="w-full md:w-80">
              <CardHeader>
                <CardTitle className="text-lg">Donate Now</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="amount">Amount (APT)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                  />
                </div>
                <Button onClick={handleDonate} disabled={donating} className="w-full">
                  {donating ? "Processing..." : "Donate with Blockchain 💝"}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  100% transparent • Track your donation on-chain
                </p>
              </CardContent>
            </Card>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Donations</CardDescription>
            <CardTitle className="text-2xl">${(organization.totalDonations / 1000000).toFixed(2)}M</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Funds</CardDescription>
            <CardTitle className="text-2xl">{organization.activeFunds}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed Projects</CardDescription>
            <CardTitle className="text-2xl">{organization.completedProjects}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Beneficiaries</CardDescription>
            <CardTitle className="text-2xl">
              {organization.beneficiaries > 0 ? `${(organization.beneficiaries / 1000).toFixed(0)}K` : "N/A"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("about")}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === "about"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            About
          </button>
          <button
            onClick={() => setActiveTab("funds")}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === "funds"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Active Funds ({organization.activeFunds})
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === "reviews"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Reviews ({organization.reviews.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "about" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{organization.mission}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About {organization.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">{organization.description}</p>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-600">Contact</p>
                  <a href={`mailto:${organization.contactEmail}`} className="text-blue-600 hover:underline">
                    {organization.contactEmail}
                  </a>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Website</p>
                  <a href={`https://${organization.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {organization.website}
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">💰 Transparency & Accountability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-900 mb-3">
                All donations and expenses for this organization are recorded on the Aptos blockchain.
                View detailed expense reports with proof documents to see exactly how funds are used.
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/verify-expenses'}
                className="w-full bg-white hover:bg-blue-100"
              >
                View All Expenses & Proofs 🔍
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "funds" && (
        <Card>
          <CardHeader>
            <CardTitle>Active Funds</CardTitle>
            <CardDescription>Current projects accepting donations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(organization.activeFunds)].map((_, idx) => (
                <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold">Project Fund #{idx + 1}</h4>
                      <p className="text-sm text-gray-600 mt-1">Supporting {organization.name}'s ongoing initiatives</p>
                      <div className="flex gap-4 mt-2">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                        <span className="text-xs text-gray-600">Track on blockchain →</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "reviews" && (
        <div className="space-y-4">
          {organization.reviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No reviews yet. Be the first to donate and leave a review!
              </CardContent>
            </Card>
          ) : (
            organization.reviews.map((review) => (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base font-mono">{review.donor}</CardTitle>
                      <CardDescription>{new Date(review.date).toLocaleDateString()}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-500 font-semibold">
                        {"⭐".repeat(review.rating)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Donated ${review.donationAmount}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{review.comment}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

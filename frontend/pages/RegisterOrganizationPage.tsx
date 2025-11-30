import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const config = new AptosConfig({ 
  network: Network.TESTNET,
  fullnode: "https://api.testnet.aptoslabs.com/v1"
});
const aptos = new Aptos(config);
const MODULE_ADDRESS = import.meta.env.VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS;

export default function RegisterOrganizationPage() {
  const navigate = useNavigate();
  const { account, signAndSubmitTransaction } = useWallet();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    type: "NGO",
    locality: "",
    description: "",
    mission: "",
    contactEmail: "",
    website: "",
    founded: "",
    logo: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account) {
      toast({ title: "Error", description: "Please connect your wallet to register", variant: "destructive" });
      return;
    }

    // Validate required fields
    if (!formData.name || !formData.locality || !formData.description || !formData.mission || !formData.contactEmail) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contactEmail)) {
      toast({ title: "Error", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    try {
      // Register organization on blockchain using V2 module
      const ipfsMetadata = JSON.stringify({
        type: formData.type,
        locality: formData.locality,
        mission: formData.mission,
        contactEmail: formData.contactEmail,
        website: formData.website,
        founded: formData.founded,
        logo: formData.logo,
      });

      const response = await signAndSubmitTransaction({
        sender: account.address.toString(),
        data: {
          function: `${MODULE_ADDRESS}::dapptrack_v2::register_organization`,
          functionArguments: [formData.name, formData.description, ipfsMetadata],
        },
      });

      await aptos.waitForTransaction({ transactionHash: response.hash });

      toast({
        title: "Organization Registered! 🎉",
        description: `${formData.name} has been successfully registered on the blockchain. You are now the admin.`,
      });

      // Redirect to organizations page after successful registration
      setTimeout(() => {
        navigate("/organizations");
      }, 2000);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to register organization", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const emojiOptions = ["🌍", "💧", "📚", "🏥", "🏘️", "🦁", "🚨", "💻", "🌱", "🎨", "🧠", "👴", "🏫", "🏭", "⚕️", "🌾", "🔬", "📖", "🎓", "💚"];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Register Your Organization</h1>
        <p className="text-gray-600">Join DappTrack's transparent ecosystem for accountability and trust</p>
      </div>

      {/* Wallet Check */}
      {!account ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg text-gray-600 mb-4">Please connect your wallet to register an organization</p>
            <p className="text-sm text-gray-500">Your wallet address will be the admin account for this organization</p>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Tell us about your organization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Organization Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., Global Food Relief Foundation"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Organization Type *</Label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      required
                    >
                      <option value="NGO">NGO</option>
                      <option value="Government">Government</option>
                      <option value="Community">Community</option>
                      <option value="International">International</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="locality">Location (City, Country) *</Label>
                    <Input
                      id="locality"
                      name="locality"
                      placeholder="e.g., New York, USA"
                      value={formData.locality}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="founded">Year Founded *</Label>
                    <Input
                      id="founded"
                      name="founded"
                      type="number"
                      placeholder="e.g., 2020"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={formData.founded}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="logo">Logo Emoji *</Label>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {emojiOptions.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormData({ ...formData, logo: emoji })}
                        className={`text-2xl p-2 rounded border-2 transition-colors ${
                          formData.logo === emoji
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <Input
                    id="logo"
                    name="logo"
                    placeholder="Or enter your own emoji"
                    value={formData.logo}
                    onChange={handleChange}
                    maxLength={2}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Short Description *</Label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Brief description of your organization (1-2 sentences)"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 text-sm min-h-[80px]"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/200 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="mission">Mission Statement *</Label>
                  <textarea
                    id="mission"
                    name="mission"
                    placeholder="What is your organization's mission and goals?"
                    value={formData.mission}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 text-sm min-h-[120px]"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.mission.length}/500 characters
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>How can people reach your organization?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactEmail">Contact Email *</Label>
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      placeholder="contact@yourorg.org"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">Website (optional)</Label>
                    <Input
                      id="website"
                      name="website"
                      placeholder="www.yourorganization.org"
                      value={formData.website}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Information */}
            <Card>
              <CardHeader>
                <CardTitle>Blockchain Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">Admin Wallet Address</p>
                  <p className="text-xs font-mono text-blue-700 break-all">{account.address.toString()}</p>
                  <p className="text-xs text-blue-600 mt-2">
                    This wallet will have admin access to manage your organization's funds and activities
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* What Happens Next */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-900">📋 What Happens Next?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-purple-800">
                <div className="flex gap-2">
                  <span>1️⃣</span>
                  <p>Your organization will be registered on the blockchain with a starting trust score of 50%</p>
                </div>
                <div className="flex gap-2">
                  <span>2️⃣</span>
                  <p>You'll be able to create funding projects and accept donations immediately</p>
                </div>
                <div className="flex gap-2">
                  <span>3️⃣</span>
                  <p>As donors contribute and verify your deliveries, your trust score will increase</p>
                </div>
                <div className="flex gap-2">
                  <span>4️⃣</span>
                  <p>You can apply for verification status after completing your first 3 projects</p>
                </div>
                <div className="flex gap-2">
                  <span>5️⃣</span>
                  <p>All transactions are transparent and tracked on the Aptos blockchain</p>
                </div>
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/organizations")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? "Registering..." : "Register Organization 🚀"}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

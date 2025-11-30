import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function UserGuidePage() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <h1 className="text-4xl font-bold mb-3">📖 DappTrack User Guide</h1>
        <p className="text-lg text-gray-700 mb-4">
          Complete guide to using the blockchain-based donation transparency platform
        </p>
        <p className="text-sm text-gray-600">
          Built on Aptos blockchain for maximum transparency and accountability
        </p>
      </div>

      {/* Quick Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Navigation</CardTitle>
          <CardDescription>Jump to any section</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-2">
            <Button variant="outline" onClick={() => scrollToSection("donors")}>
              For Donors
            </Button>
            <Button variant="outline" onClick={() => scrollToSection("organizations")}>
              For Organizations
            </Button>
            <Button variant="outline" onClick={() => scrollToSection("public")}>
              For Public/Auditors
            </Button>
            <Button variant="outline" onClick={() => scrollToSection("track")}>
              Track Page
            </Button>
            <Button variant="outline" onClick={() => scrollToSection("donate")}>
              Donate Page
            </Button>
            <Button variant="outline" onClick={() => scrollToSection("verify")}>
              Verify Page
            </Button>
            <Button variant="outline" onClick={() => scrollToSection("deliver")}>
              Deliver Page
            </Button>
            <Button variant="outline" onClick={() => scrollToSection("audit")}>
              Audit Page
            </Button>
            <Button variant="outline" onClick={() => scrollToSection("admin")}>
              Admin Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* For Donors */}
      <Card id="donors" className="scroll-mt-6">
        <CardHeader>
          <CardTitle className="text-2xl">💚 For Donors</CardTitle>
          <CardDescription>How to donate and track your contributions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-bold text-lg mb-2">Step 1: Connect Your Wallet</h3>
            <p className="text-sm text-gray-700 mb-2">
              Click "Connect Wallet" in the header and select your Aptos wallet (Petra, Martian, etc.)
            </p>
            <div className="bg-yellow-50 p-3 rounded text-sm">
              ⚠️ <strong>Important:</strong> Make sure you're on Aptos Testnet and have some test APT tokens
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2">Step 2: Browse Organizations</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Go to "Donate" page from the navigation menu</li>
              <li>Browse all registered organizations</li>
              <li>Use search to find specific organizations</li>
              <li>View organization descriptions and total funds received</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2">Step 3: Select Project & Donate</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Click on an organization to select it</li>
              <li>View available active projects</li>
              <li>Select a specific project to support</li>
              <li>Enter donation amount in APT</li>
              <li>Optionally add a message</li>
              <li>Click "Donate" and approve the transaction</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2">Step 4: Track Your Donation</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Go to "Track" page to see all donations</li>
              <li>Filter by organization or project</li>
              <li>Search for your donation by address</li>
              <li>See how your donation is being used in real-time</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2">Step 5: Verify Spending</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Visit "Verify" page to see all expenses</li>
              <li>Filter by your donated organization/project</li>
              <li>Click "View Proof" to see receipts and invoices</li>
              <li>All proof documents stored permanently on IPFS</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded">
            <p className="font-semibold text-green-900 mb-2">✓ Benefits for Donors:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-green-900">
              <li>100% transparent fund tracking</li>
              <li>Blockchain-verified transactions</li>
              <li>See proof of every expense</li>
              <li>Direct donations to organizations (no middlemen)</li>
              <li>Real-time project progress monitoring</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* For Organizations */}
      <Card id="organizations" className="scroll-mt-6">
        <CardHeader>
          <CardTitle className="text-2xl">🏢 For Organizations</CardTitle>
          <CardDescription>How to register, create projects, and manage funds</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-bold text-lg mb-2">Step 1: Register Your Organization</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Connect your admin wallet</li>
              <li>Go to "Organizations" page</li>
              <li>Click "Register New Organization"</li>
              <li>Fill in name, description, and upload logo to IPFS</li>
              <li>Submit registration transaction</li>
              <li>Your wallet address becomes the admin address</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2">Step 2: Create Projects</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Go to "Admin" page</li>
              <li>Navigate to "Projects" tab</li>
              <li>Fill in project name, description, and target amount</li>
              <li>Click "Create Project"</li>
              <li>Projects are required before accepting donations</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2">Step 3: Accept Donations</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Donors can now donate to your projects</li>
              <li>Funds go directly to your admin wallet</li>
              <li>View all donations in Admin Dashboard → Donations tab</li>
              <li>See donor addresses, amounts, and messages</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2">Step 4: Record Expenses with Proof</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Go to Admin Dashboard → Expenses tab</li>
              <li>Select project where expense occurred</li>
              <li>Enter description and amount</li>
              <li>Upload receipt/invoice (PDF, image, etc.)</li>
              <li>File automatically uploaded to IPFS</li>
              <li>Submit expense record to blockchain</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2">Step 5: Monitor Your Organization</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Admin Dashboard shows all financial metrics</li>
              <li>View wallet balance, total received, total spent</li>
              <li>Track project progress and funding goals</li>
              <li>See recent activity feed</li>
              <li>All data publicly verifiable on blockchain</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded">
            <p className="font-semibold text-blue-900 mb-2">✓ Benefits for Organizations:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-900">
              <li>Build trust with complete transparency</li>
              <li>Accept donations globally via blockchain</li>
              <li>Automated record-keeping on blockchain</li>
              <li>Prove fund utilization with receipts</li>
              <li>Professional dashboard for management</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* For Public/Auditors */}
      <Card id="public" className="scroll-mt-6">
        <CardHeader>
          <CardTitle className="text-2xl">🔍 For Public & Auditors</CardTitle>
          <CardDescription>How to verify and audit organization spending</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-bold text-lg mb-2">No Wallet Required!</h3>
            <p className="text-sm text-gray-700">
              All verification and audit features are publicly accessible without connecting a wallet.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2">Track Page - Monitor All Donations</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>See all donations across all organizations</li>
              <li>Filter by organization or project</li>
              <li>Search by donor address or keywords</li>
              <li>View project progress and financial breakdowns</li>
              <li>Auto-refreshes every 30 seconds</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2">Verify Page - Check Expense Proofs</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>View every expense recorded by organizations</li>
              <li>Filter by organization or project</li>
              <li>Click "View Proof" to see receipts/invoices on IPFS</li>
              <li>Sort by date or amount</li>
              <li>Search by description or IPFS hash</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2">Audit Page - Complete Transaction History</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Combined timeline of ALL donations and expenses</li>
              <li>Organization-by-organization financial breakdown</li>
              <li>Calculate net balances and fund flows</li>
              <li>Export-ready data for auditing purposes</li>
              <li>Filter by transaction type (donations/expenses)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2">Deliver Page - Project Status</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>See which projects are active, completed, or cancelled</li>
              <li>View funding progress bars</li>
              <li>Check available balances per project</li>
              <li>Monitor deliverables and outcomes</li>
            </ul>
          </div>

          <div className="bg-purple-50 p-4 rounded">
            <p className="font-semibold text-purple-900 mb-2">✓ Verification Features:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-purple-900">
              <li>All data sourced directly from Aptos blockchain</li>
              <li>Immutable transaction records</li>
              <li>IPFS-backed proof documents</li>
              <li>Real-time financial calculations</li>
              <li>No registration or login required</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Page-Specific Guides */}
      <Card id="track" className="scroll-mt-6">
        <CardHeader>
          <CardTitle className="text-xl">📊 Track Page Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p><strong>Purpose:</strong> Monitor all donations and fund movements across the platform</p>
          <p><strong>Features:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Dashboard with total donations, spending, and available balance</li>
            <li>Three tabs: Donations, Spending, Projects</li>
            <li>Filter by organization and then by specific project</li>
            <li>Search by keywords (org name, project, donor address)</li>
            <li>Auto-refresh every 30 seconds + manual refresh button</li>
            <li>Colored indicators: Green for donations, Red for expenses</li>
            <li>Project progress bars showing funding status</li>
          </ul>
          <p><strong>Use Cases:</strong> Track your own donations, monitor organization activity, analyze spending patterns</p>
        </CardContent>
      </Card>

      <Card id="donate" className="scroll-mt-6">
        <CardHeader>
          <CardTitle className="text-xl">💚 Donate Page Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p><strong>Purpose:</strong> Make donations to organizations and specific projects</p>
          <p><strong>Features:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Two-column layout: Organizations & Projects (left), Donation Form (right)</li>
            <li>Search organizations by name or description</li>
            <li>Click organization to see their active projects</li>
            <li>Select specific project to donate to</li>
            <li>Enter amount in APT (estimated USD conversion shown)</li>
            <li>Optional message (up to 200 characters)</li>
            <li>Instant blockchain confirmation</li>
          </ul>
          <p><strong>Requirements:</strong> Connected wallet with APT balance</p>
        </CardContent>
      </Card>

      <Card id="verify" className="scroll-mt-6">
        <CardHeader>
          <CardTitle className="text-xl">✓ Verify Expenses Page Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p><strong>Purpose:</strong> Public verification of organization spending with proof documents</p>
          <p><strong>Features:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Statistics dashboard showing total expenses and amount spent</li>
            <li>Filter by organization, then by project</li>
            <li>Search by description, IPFS hash, or keywords</li>
            <li>Sort by date (newest first) or amount (highest first)</li>
            <li>Every expense shows: description, amount, proof document link, recorded by</li>
            <li>Click "View on IPFS" to see actual receipts/invoices</li>
            <li>Multiple IPFS gateway options for redundancy</li>
            <li>Blockchain verification notice on each expense</li>
          </ul>
          <p><strong>No wallet needed:</strong> Fully public transparency page</p>
        </CardContent>
      </Card>

      <Card id="deliver" className="scroll-mt-6">
        <CardHeader>
          <CardTitle className="text-xl">🚀 Deliver Page Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p><strong>Purpose:</strong> Track project completion status and deliverables</p>
          <p><strong>Features:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Statistics: Total projects, Active, Completed, Total funds raised</li>
            <li>Three sections: Active Projects, Completed Projects, Cancelled Projects</li>
            <li>Filter by organization or search by project name</li>
            <li>Color-coded status indicators (Green=Active, Blue=Completed, Red=Cancelled)</li>
            <li>Progress bars showing funding achievement</li>
            <li>Financial breakdown: Raised, Spent, Target, Available per project</li>
            <li>Quick links to view expenses or organization details</li>
          </ul>
          <p><strong>Use Cases:</strong> Monitor project completion, verify deliverables, check fund utilization</p>
        </CardContent>
      </Card>

      <Card id="audit" className="scroll-mt-6">
        <CardHeader>
          <CardTitle className="text-xl">🔍 Audit Page Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p><strong>Purpose:</strong> Complete audit trail of all transactions (donations + expenses)</p>
          <p><strong>Features:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Overall statistics: Total donations, expenses, net balance, transaction count</li>
            <li>Two views: Transaction Timeline & Organization Breakdown</li>
            <li><strong>Timeline View:</strong> Chronological list of all transactions (newest first)</li>
            <li><strong>Organization View:</strong> Financial summary per organization with totals</li>
            <li>Filter by transaction type: All, Donations Only, Expenses Only</li>
            <li>Filter by organization to focus on specific org</li>
            <li>Search across all transactions</li>
            <li>Color-coded: Green for donations (+), Red for expenses (-)</li>
            <li>Links to view organization pages or expense proofs</li>
          </ul>
          <p><strong>Perfect for:</strong> Auditors, donors wanting full transparency, financial analysis</p>
        </CardContent>
      </Card>

      <Card id="admin" className="scroll-mt-6">
        <CardHeader>
          <CardTitle className="text-xl">🛠️ Admin Dashboard Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p><strong>Purpose:</strong> Organization admin panel for managing funds and projects</p>
          <p><strong>Access:</strong> Only accessible to organization admin wallet addresses</p>
          <p><strong>Features:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Overview Tab:</strong> Financial metrics, recent activity, quick stats</li>
            <li><strong>Donations Tab:</strong> Complete list of all received donations with details</li>
            <li><strong>Expenses Tab:</strong> Record new expenses with proof upload, view all expenses</li>
            <li><strong>Projects Tab:</strong> Create new projects, view project financial status</li>
            <li>Dashboard metrics: Wallet Balance, Total Received, Total Spent, Donation Count</li>
            <li>File upload for expense proofs (automatic IPFS upload via backend)</li>
            <li>Auto-refresh after each transaction</li>
            <li>Progress bars showing project funding vs target</li>
          </ul>
          <p><strong>Important:</strong> All expense records require proof documents (receipts/invoices) for transparency</p>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">⚙️ Technical Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-semibold mb-1">Blockchain:</p>
            <ul className="list-disc list-inside ml-4">
              <li>Aptos Testnet</li>
              <li>Move v2.2 smart contracts</li>
              <li>All transactions permanently recorded on-chain</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-1">Storage:</p>
            <ul className="list-disc list-inside ml-4">
              <li>Proof documents stored on IPFS via Pinata</li>
              <li>Decentralized, permanent file storage</li>
              <li>Multiple gateway access for redundancy</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-1">Currency:</p>
            <ul className="list-disc list-inside ml-4">
              <li>All amounts in APT (Aptos Token)</li>
              <li>1 APT = 100,000,000 Octas (smallest unit)</li>
              <li>Real transfers - funds go directly to organization wallets</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">❓ Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-semibold">Q: Do I need a wallet to view expense proofs?</p>
            <p className="text-gray-700">A: No! The Track, Verify, Deliver, and Audit pages are fully public and don't require any wallet connection.</p>
          </div>
          <div>
            <p className="font-semibold">Q: Can transactions be reversed or deleted?</p>
            <p className="text-gray-700">A: No. All blockchain transactions are permanent and immutable. This ensures complete transparency.</p>
          </div>
          <div>
            <p className="font-semibold">Q: Where do donation funds go?</p>
            <p className="text-gray-700">A: Funds go directly to the organization's admin wallet address. There are no intermediaries or platform fees.</p>
          </div>
          <div>
            <p className="font-semibold">Q: How can I verify an organization is legitimate?</p>
            <p className="text-gray-700">A: Check their admin address, review their expense history with proofs, see project completion rates, and verify all data on the blockchain explorer.</p>
          </div>
          <div>
            <p className="font-semibold">Q: What file types can be uploaded as proof?</p>
            <p className="text-gray-700">A: Any file type (PDF, images, documents). Files are uploaded to IPFS and the hash is stored on-chain.</p>
          </div>
          <div>
            <p className="font-semibold">Q: Can I donate to a specific fund within a project?</p>
            <p className="text-gray-700">A: Yes! When donating, you select both the organization AND the specific project you want to support.</p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle>🎯 Ready to Get Started?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            DappTrack provides the most transparent donation platform on the blockchain. 
            Every transaction is verifiable, every expense has proof, and complete transparency is guaranteed.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => window.location.href = "/donate"}>
              💚 Start Donating
            </Button>
            <Button variant="outline" onClick={() => window.location.href = "/organizations"}>
              🏢 Register Organization
            </Button>
            <Button variant="outline" onClick={() => window.location.href = "/verify-expenses"}>
              🔍 Verify Spending
            </Button>
            <Button variant="outline" onClick={() => window.location.href = "/audit"}>
              📊 View Audit Trail
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

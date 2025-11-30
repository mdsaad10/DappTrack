import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAllOrganizations, Organization as BlockchainOrg } from "@/view-functions/getOrganizationData";

// Extended type to match UI needs
interface Organization extends BlockchainOrg {
  type?: string;
  locality?: string;
  trustScore?: number;
  totalDonations?: number;
  reviews?: any[];
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedLocality, setSelectedLocality] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("trustScore");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrganizations();
    
    // Auto-refresh every 30 seconds to show latest donations
    const interval = setInterval(() => {
      fetchOrganizations(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchOrganizations = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const blockchainOrgs = await getAllOrganizations();
      
      // Transform blockchain data to match UI format
      const transformedOrgs: Organization[] = blockchainOrgs.map((org, index) => {
        // Parse IPFS metadata if available
        let metadata: any = {};
        try {
          if (org.ipfs_metadata) {
            metadata = JSON.parse(org.ipfs_metadata);
          }
        } catch (e) {
          console.log('Could not parse metadata for org', org.id);
        }

        return {
          ...org,
          id: org.id.toString(),
          type: metadata.type || 'NGO',
          locality: metadata.locality || 'Unknown',
          trustScore: 85, // Default trust score
          totalDonations: Number(org.total_received) / 100000000, // Convert from Octas to APT
          reviews: [],
          contactEmail: metadata.contactEmail,
          website: metadata.website,
          founded: metadata.founded,
          logo: metadata.logo,
          mission: metadata.mission,
        };
      });
      
      setOrganizations(transformedOrgs);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    fetchOrganizations();
  };

  // Extract unique localities
  const localities = useMemo(() => {
    const unique = Array.from(new Set(organizations.map((org) => org.locality)));
    return ["All", ...unique.sort()];
  }, []);

  // Filter and sort organizations
  const filteredOrganizations = useMemo(() => {
    let filtered = organizations.filter((org) => {
      const matchesSearch =
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === "All" || org.type === selectedType;
      const matchesLocality = selectedLocality === "All" || org.locality === selectedLocality;
      return matchesSearch && matchesType && matchesLocality;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "trustScore":
          return b.trustScore - a.trustScore;
        case "donations":
          return b.totalDonations - a.totalDonations;
        case "popularity":
          return b.reviews.length - a.reviews.length;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, selectedType, selectedLocality, sortBy]);

  const getTrustBadgeColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800";
    if (score >= 75) return "bg-blue-100 text-blue-800";
    return "bg-yellow-100 text-yellow-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Discover Organizations</h1>
          <p className="text-gray-600">
            Find trusted organizations and donate directly with blockchain transparency
            {refreshing && <span className="ml-2 text-sm text-blue-600">• Refreshing...</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            🔄 Refresh
          </Button>
          <Link to="/register-organization">
            <Button className="whitespace-nowrap">
              + Register Organization
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div>
            <Input
              placeholder="Search organizations by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Organization Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="All">All Types</option>
                <option value="NGO">NGO</option>
                <option value="Government">Government</option>
                <option value="Community">Community</option>
                <option value="International">International</option>
              </select>
            </div>

            {/* Locality Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <select
                value={selectedLocality}
                onChange={(e) => setSelectedLocality(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                {localities.map((locality) => (
                  <option key={locality} value={locality}>
                    {locality}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="trustScore">Trust Score</option>
                <option value="donations">Total Donations</option>
                <option value="popularity">Popularity</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedType("All");
                  setSelectedLocality("All");
                  setSortBy("trustScore");
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredOrganizations.length} organization{filteredOrganizations.length !== 1 ? "s" : ""}
      </div>

      {/* Organizations Grid */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Loading organizations...
          </CardContent>
        </Card>
      ) : filteredOrganizations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p className="text-lg">No organizations found matching your criteria</p>
            <p className="text-sm mt-2">Try adjusting your filters or search terms</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizations.map((org) => (
            <Link key={org.id} to={`/organizations/${org.id}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="text-4xl">{org.logo}</div>
                    <div className="flex flex-col items-end gap-2">
                      {org.verified && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                          ✓ Verified
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTrustBadgeColor(org.trustScore)}`}>
                        {org.trustScore}% Trust
                      </span>
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {org.type} • {org.locality}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 line-clamp-3">{org.description}</p>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-600">Total Donations</p>
                      <p className="text-sm font-semibold">
                        ${(org.totalDonations / 1000).toFixed(0)}K
                      </p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-600">Active Funds</p>
                      <p className="text-sm font-semibold">{org.activeFunds}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-600">Projects</p>
                      <p className="text-sm font-semibold">{org.completedProjects}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-600">Reviews</p>
                      <p className="text-sm font-semibold">
                        ⭐ {org.reviews.length > 0 ? (org.reviews.reduce((acc, r) => acc + r.rating, 0) / org.reviews.length).toFixed(1) : "N/A"}
                      </p>
                    </div>
                  </div>

                  <Button className="w-full" variant="outline">
                    View Details & Donate →
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

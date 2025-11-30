import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAllOrganizations, getProjectsByOrg } from "@/view-functions/getOrganizationData";

interface Organization {
  id: number;
  name: string;
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

export default function DeliverPage() {
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const orgs = await getAllOrganizations();
      setOrganizations(orgs);

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

  const getOrgName = (orgId: number) => {
    const org = organizations.find(o => o.id === orgId);
    return org ? org.name : `Organization #${orgId}`;
  };

  const formatAmount = (amount: number) => {
    return (Number(amount) / 100000000).toFixed(4);
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return "Active";
      case 1: return "Completed";
      case 2: return "Cancelled";
      default: return "Unknown";
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return "text-green-600 bg-green-50";
      case 1: return "text-blue-600 bg-blue-50";
      case 2: return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

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

  // Separate by status
  const activeProjects = filteredProjects.filter(p => p.status === 0);
  const completedProjects = filteredProjects.filter(p => p.status === 1);
  const cancelledProjects = filteredProjects.filter(p => p.status === 2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Project Deliverables & Status</h1>
        <p className="text-gray-600">Monitor project completion and fund utilization</p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{filteredProjects.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{activeProjects.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{completedProjects.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total Funds Raised</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {formatAmount(filteredProjects.reduce((sum, p) => sum + Number(p.raised_amount), 0))} APT
            </p>
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
              placeholder="🔍 Search projects by name or description..."
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

          {(selectedOrg || searchQuery) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedOrg(null);
                setSearchQuery("");
              }}
            >
              ✕ Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Active Projects */}
      {activeProjects.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-green-600">🚀 Active Projects ({activeProjects.length})</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {activeProjects.map((project) => {
              const progress = project.target_amount > 0
                ? (Number(project.raised_amount) / Number(project.target_amount)) * 100
                : 0;
              const available = Number(project.raised_amount) - Number(project.spent_amount);

              return (
                <Card key={`${project.org_id}-${project.id}`} className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{project.name}</CardTitle>
                        <CardDescription>{getOrgName(project.org_id)}</CardDescription>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(project.status)}`}>
                        {getStatusText(project.status)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-700">{project.description}</p>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Funding Progress</span>
                        <span className="font-semibold">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-green-600 h-3 rounded-full transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Financial Overview */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-green-50 p-3 rounded text-center">
                        <p className="text-xs text-gray-600">Raised</p>
                        <p className="font-bold text-green-600">{formatAmount(project.raised_amount)} APT</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded text-center">
                        <p className="text-xs text-gray-600">Target</p>
                        <p className="font-bold text-blue-600">{formatAmount(project.target_amount)} APT</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded text-center">
                        <p className="text-xs text-gray-600">Spent</p>
                        <p className="font-bold text-red-600">{formatAmount(project.spent_amount)} APT</p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded text-center">
                        <p className="text-xs text-gray-600">Available</p>
                        <p className="font-bold text-purple-600">{formatAmount(available)} APT</p>
                      </div>
                    </div>

                    {/* Project Status Info */}
                    <div className="bg-yellow-50 p-3 rounded">
                      <p className="text-sm text-yellow-900">
                        <strong>⏳ In Progress:</strong> This project is currently active and accepting donations. 
                        Organization is working on deliverables.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => window.location.href = `/organizations/${project.org_id}`}
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = `/verify-expenses`}
                      >
                        View Expenses
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Projects */}
      {completedProjects.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-blue-600">✅ Completed Projects ({completedProjects.length})</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {completedProjects.map((project) => {
              const progress = project.target_amount > 0
                ? (Number(project.raised_amount) / Number(project.target_amount)) * 100
                : 0;

              return (
                <Card key={`${project.org_id}-${project.id}`} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{project.name}</CardTitle>
                        <CardDescription>{getOrgName(project.org_id)}</CardDescription>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(project.status)}`}>
                        {getStatusText(project.status)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-700">{project.description}</p>

                    {/* Financial Summary */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-green-50 p-2 rounded text-center">
                        <p className="text-xs text-gray-600">Raised</p>
                        <p className="font-bold text-sm text-green-600">{formatAmount(project.raised_amount)} APT</p>
                      </div>
                      <div className="bg-red-50 p-2 rounded text-center">
                        <p className="text-xs text-gray-600">Spent</p>
                        <p className="font-bold text-sm text-red-600">{formatAmount(project.spent_amount)} APT</p>
                      </div>
                      <div className="bg-blue-50 p-2 rounded text-center">
                        <p className="text-xs text-gray-600">Achievement</p>
                        <p className="font-bold text-sm text-blue-600">{progress.toFixed(0)}%</p>
                      </div>
                    </div>

                    {/* Completion Notice */}
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <p className="text-sm text-blue-900">
                        <strong>✓ Project Completed:</strong> This project has reached completion. 
                        All funds have been utilized and deliverables achieved. View expenses for detailed breakdown.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = `/organizations/${project.org_id}`}
                      >
                        View Organization
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = `/verify-expenses`}
                      >
                        View Final Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancelled Projects */}
      {cancelledProjects.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-red-600">❌ Cancelled Projects ({cancelledProjects.length})</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {cancelledProjects.map((project) => (
              <Card key={`${project.org_id}-${project.id}`} className="border-l-4 border-l-red-500 opacity-75">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription>{getOrgName(project.org_id)}</CardDescription>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(project.status)}`}>
                      {getStatusText(project.status)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-700">{project.description}</p>

                  {/* Financial Summary */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <p className="text-xs text-gray-600">Raised</p>
                      <p className="font-bold text-sm">{formatAmount(project.raised_amount)} APT</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <p className="text-xs text-gray-600">Spent</p>
                      <p className="font-bold text-sm">{formatAmount(project.spent_amount)} APT</p>
                    </div>
                  </div>

                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <p className="text-sm text-red-900">
                      <strong>✗ Cancelled:</strong> This project was discontinued. Remaining funds may have been 
                      returned or reallocated.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {loading ? (
        <Card>
          <CardContent className="py-8 text-center">Loading projects...</CardContent>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <p className="text-lg mb-2">No projects found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">💡 Understanding Project Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-900">
          <p>
            <strong>🚀 Active:</strong> Project is currently running and accepting donations. Organization is 
            working on deliverables and may be recording expenses.
          </p>
          <p>
            <strong>✅ Completed:</strong> Project has successfully finished. All objectives achieved and funds 
            properly utilized. You can review the final expense report.
          </p>
          <p>
            <strong>❌ Cancelled:</strong> Project was discontinued before completion. This may happen due to 
            unforeseen circumstances. Any remaining funds are typically returned or reallocated.
          </p>
          <p className="pt-2 border-t border-blue-300">
            💡 <strong>Tip:</strong> Click "View Expenses" on any project to see detailed spending with proof documents!
          </p>
        </CardContent>
      </Card>

      {/* Usage Guide */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-900">📖 How to Use Deliverables Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-green-900">
          <p><strong>1. Browse Projects:</strong> See all projects organized by status (Active, Completed, Cancelled)</p>
          <p><strong>2. Check Progress:</strong> View funding progress bars and financial breakdowns</p>
          <p><strong>3. Filter:</strong> Focus on specific organizations or search for projects</p>
          <p><strong>4. View Details:</strong> Click buttons to see organization pages or expense reports</p>
          <p><strong>5. Monitor Impact:</strong> Track how your donations are being used in real-time</p>
          <p className="pt-2 border-t border-green-300">
            🎯 This page shows you the real-world impact of donations through project completion tracking
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

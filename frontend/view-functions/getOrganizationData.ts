import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const config = new AptosConfig({ 
  network: Network.TESTNET,
  fullnode: "https://api.testnet.aptoslabs.com/v1"
});
const aptos = new Aptos(config);

const MODULE_ADDRESS = import.meta.env.VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS;

export interface Organization {
  id: number;
  name: string;
  description: string;
  admin: string;
  wallet_balance: number;
  total_received: number;
  total_spent: number;
  created_at: number;
  ipfs_metadata: string;
}

export interface Project {
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

export interface Donation {
  id: number;
  org_id: number;
  project_id: number;
  donor: string;
  amount: number;
  message: string;
  donated_at: number;
}

export interface Expense {
  id: number;
  org_id: number;
  project_id: number;
  description: string;
  amount: number;
  ipfs_proof: string;
  spent_by: string;
  spent_at: number;
}

export async function getAllOrganizations(): Promise<Organization[]> {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::dapptrack_v2::get_all_organizations`,
        functionArguments: [],
      },
    });
    return result[0] as Organization[];
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return [];
  }
}

export async function getOrganizationById(orgId: number): Promise<Organization | null> {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::dapptrack_v2::get_organization_by_id`,
        functionArguments: [orgId],
      },
    });
    return result[0] as Organization;
  } catch (error) {
    console.error("Error fetching organization:", error);
    return null;
  }
}

export async function getProjectsByOrg(orgId: number): Promise<Project[]> {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::dapptrack_v2::get_projects_by_org`,
        functionArguments: [orgId],
      },
    });
    return result[0] as Project[];
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

export async function getDonationsByOrg(orgId: number): Promise<Donation[]> {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::dapptrack_v2::get_donations_by_org`,
        functionArguments: [orgId],
      },
    });
    return result[0] as Donation[];
  } catch (error) {
    console.error("Error fetching donations:", error);
    return [];
  }
}

export async function getExpensesByOrg(orgId: number): Promise<Expense[]> {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::dapptrack_v2::get_expenses_by_org`,
        functionArguments: [orgId],
      },
    });
    return result[0] as Expense[];
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }
}

export async function getAllExpenses(): Promise<Expense[]> {
  try {
    const orgs = await getAllOrganizations();
    let allExpenses: Expense[] = [];
    for (const org of orgs) {
      const expenses = await getExpensesByOrg(org.id);
      allExpenses = [...allExpenses, ...expenses];
    }
    return allExpenses;
  } catch (error) {
    console.error("Error fetching all expenses:", error);
    return [];
  }
}

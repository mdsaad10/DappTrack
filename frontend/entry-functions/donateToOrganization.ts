import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { MODULE_ADDRESS } from "@/constants";

export type DonateToOrganizationArguments = {
  orgId: number;
  projectId: number;
  amount: number; // Amount in Octas (1 APT = 100,000,000 Octas)
  message: string;
};

export const donateToOrganization = (args: DonateToOrganizationArguments): InputTransactionData => {
  const { orgId, projectId, amount, message } = args;
  return {
    data: {
      function: `${MODULE_ADDRESS}::dapptrack_v2::donate_to_organization`,
      functionArguments: [orgId, projectId, amount, message],
    },
  };
};

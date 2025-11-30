import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { MODULE_ADDRESS } from "@/constants";

export type CreateProjectArguments = {
  orgId: number;
  name: string;
  description: string;
  targetAmount: number; // Amount in Octas
};

export const createProject = (args: CreateProjectArguments): InputTransactionData => {
  const { orgId, name, description, targetAmount } = args;
  return {
    data: {
      function: `${MODULE_ADDRESS}::dapptrack_v2::create_project`,
      functionArguments: [orgId, name, description, targetAmount],
    },
  };
};

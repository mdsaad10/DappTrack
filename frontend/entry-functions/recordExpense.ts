import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { MODULE_ADDRESS } from "@/constants";

export type RecordExpenseArguments = {
  orgId: number;
  projectId: number;
  description: string;
  amount: number; // Amount in Octas
  ipfsProof: string;
};

export const recordExpense = (args: RecordExpenseArguments): InputTransactionData => {
  const { orgId, projectId, description, amount, ipfsProof } = args;
  return {
    data: {
      function: `${MODULE_ADDRESS}::dapptrack_v2::record_expense`,
      functionArguments: [orgId, projectId, description, amount, ipfsProof],
    },
  };
};

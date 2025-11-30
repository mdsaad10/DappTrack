import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { MODULE_ADDRESS } from "@/constants";

export type RegisterOrganizationArguments = {
  name: string;
  description: string;
  ipfsMetadata: string;
};

export const registerOrganization = (args: RegisterOrganizationArguments): InputTransactionData => {
  const { name, description, ipfsMetadata } = args;
  return {
    data: {
      function: `${MODULE_ADDRESS}::dapptrack_v2::register_organization`,
      functionArguments: [name, description, ipfsMetadata],
    },
  };
};

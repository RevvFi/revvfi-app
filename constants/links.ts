export const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL!;
export const FAUCET_URL = process.env.NEXT_PUBLIC_FAUCET_URL!;

export const GITHUB_ORG_URL = "https://github.com/RevvFi";

export const GITHUB_REPOS = {
  contracts: `${GITHUB_ORG_URL}/revvfi-contracts`,
  backend: `${GITHUB_ORG_URL}/revvfi-backend`,
  app: `${GITHUB_ORG_URL}/revvfi-app`,
  docs: `${GITHUB_ORG_URL}/revvfi-docs`,
} as const;

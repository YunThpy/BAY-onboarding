
export type Opportunity = {
  base: string;
  quote: string;
  grossBps: number;
  netBps: number;
  buy: { venue: any; price: number; symbol: string };
  sell: { venue: any; price: number; symbol: string };
};

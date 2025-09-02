
'use client';
import Header from '../components/Header';
import Filters from '../components/Filters';
import OpportunityTable from '../components/OpportunityTable';
import { useLiveFeed } from '../lib/useLiveFeed';

export default function Page() {
  const { opps, connected } = useLiveFeed();
  return (
    <div className="space-y-6">
      <Header connected={connected} />
      <Filters />
      <OpportunityTable rows={opps} />
    </div>
  );
}

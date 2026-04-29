import { StateMessage } from '../storefrontShared.jsx';

export function RouteFallback() {
  return (
    <section className="section">
      <StateMessage status="loading" error="" />
    </section>
  );
}

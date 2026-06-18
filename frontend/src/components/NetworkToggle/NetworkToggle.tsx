import './NetworkToggle.css';
import { ENV, setActiveNetwork } from '../../config/env';

/**
 * Mainnet ↔ Testnet switch. Switching reloads the app so every provider
 * re-initialises against the selected network.
 */
export const NetworkToggle = () => {
  const active = ENV.NETWORK;

  return (
    <div className="network-toggle" role="group" aria-label="Network">
      <button
        type="button"
        className={`network-toggle-btn ${active === 'mainnet' ? 'active' : ''}`}
        onClick={() => active !== 'mainnet' && setActiveNetwork('mainnet')}
        aria-pressed={active === 'mainnet'}
      >
        Mainnet
      </button>
      <button
        type="button"
        className={`network-toggle-btn ${active === 'hoodi' ? 'active testnet' : ''}`}
        onClick={() => active !== 'hoodi' && setActiveNetwork('hoodi')}
        aria-pressed={active === 'hoodi'}
      >
        Testnet
      </button>
    </div>
  );
};

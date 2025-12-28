import './Header.css';

interface HeaderProps {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  isMetaMaskInstalled: boolean;
  isCorrectNetwork: boolean;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onSwitchNetwork: () => void;
}

export const Header = ({
  address,
  chainId,
  isConnected,
  isConnecting,
  isMetaMaskInstalled,
  isCorrectNetwork,
  error,
  onConnect,
  onDisconnect,
  onSwitchNetwork,
}: HeaderProps) => {
  return (
    <header className="header">
      <div className="header-wallet">
        {isConnected ? (
          <div className="wallet-connected">
            <span className="wallet-address">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>

            {/* Only show network status if chainId is known */}
            {chainId !== null && (
              <>
                {isCorrectNetwork ? (
                  <span className="network-badge">Hoodi ✓</span>
                ) : (
                  <button className="switch-network-btn" onClick={onSwitchNetwork} title="Switch to Hoodi Testnet">
                    ⚠️ Wrong Network
                  </button>
                )}
              </>
            )}

            <button className="disconnect-btn" onClick={onDisconnect}>
              ✕
            </button>
          </div>
        ) : (
          <button className="connect-wallet-btn" onClick={onConnect} disabled={isConnecting || !isMetaMaskInstalled}>
            {isConnecting ? '⏳ Connecting...' : '🦊 Connect'}
          </button>
        )}

        {error && <div className="header-error">{error}</div>}
      </div>
    </header>
  );
};

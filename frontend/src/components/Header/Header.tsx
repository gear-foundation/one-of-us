import './Header.css';

interface HeaderProps {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  isMetaMaskInstalled: boolean;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const Header = ({
  address,
  chainId,
  isConnected,
  isConnecting,
  isMetaMaskInstalled,
  error,
  onConnect,
  onDisconnect,
}: HeaderProps) => {
  return (
    <header className="header">
      <div className="header-wallet">
        {isConnected ? (
          <div className="wallet-connected">
            <span className="wallet-address">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <button className="disconnect-btn" onClick={onDisconnect}>
              ✕
            </button>
          </div>
        ) : (
          <button className="connect-wallet-btn" onClick={onConnect} disabled={isConnecting || !isMetaMaskInstalled}>
            {isConnecting ? '⏳ Connecting...' : '🦊 Connect'}
          </button>
        )}

        {chainId != null && <div style={{ marginLeft: 12, fontSize: 12, opacity: 0.8 }}>chain: {chainId}</div>}

        {error && (
          <div className="error-message" style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
            {error}
          </div>
        )}
      </div>
    </header>
  );
};






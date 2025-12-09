import './JoinSection.css';

interface JoinSectionProps {
  isConnected: boolean;
  isConnecting: boolean;
  isMetaMaskInstalled: boolean;
  isJoined: boolean;
  loading: boolean;
  sailsLoading: boolean;
  sailsError: string | null;
  varaApiReady: boolean;
  sailsReady: boolean;
  error: string | null;
  preConfirmed: string | null;
  finalized: string | null;
  onConnect: () => void;
  onJoin: () => void;
}

export const JoinSection = ({
  isConnected,
  isConnecting,
  isMetaMaskInstalled,
  isJoined,
  loading,
  sailsLoading,
  sailsError,
  varaApiReady,
  sailsReady,
  error,
  preConfirmed,
  finalized,
  onConnect,
  onJoin,
}: JoinSectionProps) => {
  return (
    <div className="join-section">
      {sailsLoading && (
        <div style={{ color: '#ffd700', marginBottom: '16px', fontSize: '14px' }}>⏳ Loading program interface...</div>
      )}

      {sailsError && (
        <div style={{ color: '#ff6b6b', marginBottom: '16px', fontSize: '14px' }}>
          ⚠️ Failed to load program: {sailsError}
        </div>
      )}

      {!isConnected ? (
        <button className="connect-button" onClick={onConnect} disabled={isConnecting || !isMetaMaskInstalled}>
          <span className="button-icon">🦊</span>
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="connected-section">
          {!isJoined ? (
            <button
              className="join-button"
              onClick={onJoin}
              disabled={loading || !varaApiReady || !sailsReady || sailsLoading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Joining...
                </>
              ) : (
                <>
                  <span className="button-icon">🤝</span>
                  BE PART OF US!
                </>
              )}
            </button>
          ) : (
            <div className="joined-message">
              <span className="check-icon">✅</span>
              <span>You are ONE OF US!</span>
            </div>
          )}

          {preConfirmed && (
            <div className="transaction-status preconfirmed">⚡ Message: {preConfirmed.slice(0, 10)}...</div>
          )}

          {finalized && <div className="transaction-status finalized">✅ Finalized</div>}
        </div>
      )}

      {error && !isConnected && <div className="error-message-main">⚠️ {error}</div>}
    </div>
  );
};






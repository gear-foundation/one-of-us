import './JoinSection.css';
import { getTxExplorerUrl, TARGET_EXPLORER_LABEL } from '../../config/constants';
import { TxStatus } from '../../hooks/useJoinProgram';

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
  joinError: string | null;
  txHash: string | null;
  finalized: boolean;
  memberCount: number;
  txStatus: TxStatus;
  checkingMembership: boolean;
  onConnect: () => void;
  onJoin: () => void;
}

const TX_STATUS_MESSAGES: Record<TxStatus, string> = {
  idle: '',
  signing: '✍️ Sign in your wallet...',
  confirming: '🔄 Processing transaction...',
  success: '✅ Done!',
  error: '❌ Failed',
};

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
  joinError,
  txHash,
  finalized,
  memberCount,
  txStatus,
  checkingMembership,
  onConnect,
  onJoin,
}: JoinSectionProps) => {
  const statusMessage = TX_STATUS_MESSAGES[txStatus];

  return (
    <div className="join-section">
      {sailsLoading && <div className="status-message loading">⏳ Loading program interface...</div>}

      {sailsError && <div className="status-message error">⚠️ Failed to load program: {sailsError}</div>}

      {!isConnected ? (
        <button className="connect-button" onClick={onConnect} disabled={isConnecting || !isMetaMaskInstalled}>
          <span className="button-icon">🦊</span>
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : checkingMembership ? (
        <div className="status-message loading">
          <span className="spinner"></span>
          Checking membership status...
        </div>
      ) : (
        <div className="connected-section">
          {!isJoined ? (
            <>
              <div className="gasless-badge">⚡ No gas fees — real settlement on Ethereum</div>
              <button
                className="join-button"
                onClick={onJoin}
                disabled={loading || !varaApiReady || !sailsReady || sailsLoading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    {txStatus === 'signing' ? 'Sign in wallet...' : 'Joining...'}
                  </>
                ) : (
                  <>
                    <span className="button-icon">🤝</span>
                    JOIN
                  </>
                )}
              </button>

              {loading && statusMessage && <div className={`transaction-status ${txStatus}`}>{statusMessage}</div>}
            </>
          ) : (
            <div className="joined-success">
              <div className="joined-message">
                <span className="check-icon">🎉</span>
                <span>You are ONE OF US!</span>
              </div>

              <div className="transaction-info">
                {!finalized && txStatus === 'confirming' && (
                  <div className="confirming-status">
                    <span className="spinner"></span>
                    Finalizing on Ethereum...
                  </div>
                )}

                {finalized && <div className="member-count-update">Welcome, builder #{memberCount}!</div>}

                {txHash && (
                  <a href={getTxExplorerUrl(txHash)} target="_blank" rel="noopener noreferrer" className="tx-link">
                    View on {TARGET_EXPLORER_LABEL} →
                  </a>
                )}
              </div>
            </div>
          )}

          {joinError && <div className="error-message-main">⚠️ {joinError}</div>}
        </div>
      )}

      {error && !isConnected && <div className="error-message-main">⚠️ {error}</div>}
    </div>
  );
};

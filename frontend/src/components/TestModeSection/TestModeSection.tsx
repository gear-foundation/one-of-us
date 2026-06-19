import '../JoinSection/JoinSection.css';
import type { TestSendStatus } from '../../hooks/useTestSend';

interface TestModeSectionProps {
  sailsReady: boolean;
  sailsLoading: boolean;
  sailsError: string | null;
  status: TestSendStatus;
  error: string | null;
  onSend: () => void;
}

/**
 * Testnet section — same look as the mainnet JoinSection (no wallet). The
 * walletless ephemeral key is generated under the hood in useTestSend.
 */
export const TestModeSection = ({
  sailsReady,
  sailsLoading,
  sailsError,
  status,
  error,
  onSend,
}: TestModeSectionProps) => {
  const sending = status === 'sending';

  return (
    <div className="join-section">
      {sailsLoading && <div className="status-message loading">⏳ Loading program interface...</div>}
      {sailsError && <div className="status-message error">⚠️ Failed to load program: {sailsError}</div>}

      <div className="connected-section">
        <div className="gasless-badge">⚡ No gas fees — real settlement on Ethereum</div>

        <button
          className="join-button"
          onClick={onSend}
          disabled={sending || !sailsReady || sailsLoading}
        >
          {sending ? (
            <>
              <span className="spinner"></span>
              Joining...
            </>
          ) : (
            <>
              <span className="button-icon">🤝</span>
              JOIN
            </>
          )}
        </button>

        {error && <div className="error-message-main">⚠️ {error}</div>}
      </div>
    </div>
  );
};

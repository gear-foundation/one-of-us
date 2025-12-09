import { ENV } from '../../config/env';
import './Footer.css';

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-links">
          <a
            href={`https://hoodi-explorer.gear-tech.io/address/${ENV.PROGRAM_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            📋 Program
          </a>
          <a href="https://vara.network" target="_blank" rel="noopener noreferrer" className="footer-link">
            🌐 Vara.network
          </a>
        </div>
        <p className="footer-text">Powered by Vara.eth - One of Us Marketing Campaign</p>
      </div>
    </footer>
  );
};

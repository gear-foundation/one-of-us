import { ENV } from '../../config/env';
import { GITHUB_REPO_URL, getAddressExplorerUrl } from '../../config/constants';
import './Footer.css';
import moonImage from '../../img/moon.png';

export const Footer = () => {
  return (
    <footer className="footer" style={{ backgroundImage: `url(${moonImage})` }}>
      <div className="footer-content">
        <div className="footer-links">
          <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" className="footer-link">
            GitHub
          </a>
          <a
            href={getAddressExplorerUrl(ENV.PROGRAM_ID)}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Etherscan
          </a>
          <a href="https://start.vara.network/" target="_blank" rel="noopener noreferrer" className="footer-link">
            Start with Vara.eth
          </a>
          <a href="https://airlyft.one/" target="_blank" rel="noopener noreferrer" className="footer-link">
            AirLyft Campaign
          </a>
        </div>
      </div>
      <p className="footer-text">Powered by Vara.eth</p>
    </footer>
  );
};

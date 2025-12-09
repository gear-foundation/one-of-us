import { useState, useEffect } from 'react';
import { EthereumClient } from '@vara-eth/api';
import './App.css';

import { useWallet } from './hooks/useWallet';
import { useSails } from './hooks/useSails';
import { useVaraApi } from './hooks/useVaraApi';
import { useMemberCount } from './hooks/useMemberCount';
import { useJoinProgram } from './hooks/useJoinProgram';

import {
  StarsBackground,
  Header,
  Footer,
  SloganCarousel,
  Stats,
  JoinSection,
  FloatingCat,
} from './components';

function App() {
  const wallet = useWallet();
  const { sails, loading: sailsLoading, error: sailsError } = useSails();

  // Ethereum client setup
  const [ethereumClient, setEthereumClient] = useState<EthereumClient | null>(null);

  useEffect(() => {
    if (!wallet.address || !wallet.walletClient || !wallet.publicClient || !wallet.isConnected) {
      setEthereumClient(null);
      return;
    }
    setEthereumClient(new EthereumClient(wallet.publicClient, wallet.walletClient));
  }, [wallet.address, wallet.walletClient, wallet.publicClient, wallet.isConnected]);

  // Vara API
  const varaApi = useVaraApi(ethereumClient, wallet.isConnected);

  // Member count
  const { memberCount, refetchCount } = useMemberCount(varaApi, sails, wallet.address);

  // Join program logic
  const { isJoined, loading, preConfirmed, finalized, handleJoin } = useJoinProgram(
    varaApi,
    sails,
    wallet.address,
    wallet.isConnected
  );

  const handleJoinWithRefetch = async () => {
    const success = await handleJoin();
    if (success) {
      await refetchCount();
    }
  };

  const handleConnect = async () => {
    if (wallet.isConnecting) return;
    await wallet.connect();
  };

  return (
    <div className="App">
      <StarsBackground />
      <FloatingCat />

      <Header
        address={wallet.address}
        chainId={wallet.chainId}
        isConnected={wallet.isConnected}
        isConnecting={wallet.isConnecting}
        isMetaMaskInstalled={wallet.isMetaMaskInstalled}
        error={wallet.error}
        onConnect={handleConnect}
        onDisconnect={wallet.disconnect}
      />

      <main className="main-content">
        <SloganCarousel />

        <div className="title-container">
          <h2 className="subtitle">Join the movement</h2>
          <h1 className="main-title">
            <span className="one">ONE</span>
            <span className="of">OF</span>
            <span className="us">US</span>
          </h1>
        </div>

        <Stats memberCount={memberCount} />

        <JoinSection
          isConnected={wallet.isConnected}
          isConnecting={wallet.isConnecting}
          isMetaMaskInstalled={wallet.isMetaMaskInstalled}
          isJoined={isJoined}
          loading={loading}
          sailsLoading={sailsLoading}
          sailsError={sailsError}
          varaApiReady={!!varaApi}
          sailsReady={!!sails}
          error={wallet.error}
          preConfirmed={preConfirmed}
          finalized={finalized}
          onConnect={handleConnect}
          onJoin={handleJoinWithRefetch}
        />

        <div className="info-section">
          <p className="info-subtext">Stop fragmenting. Start building together.</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;


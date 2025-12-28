import { useState, useEffect } from 'react';
import { EthereumClient } from '@vara-eth/api';
import './App.css';

import { useWallet } from './hooks/useWallet';
import { useSails } from './hooks/useSails';
import { useVaraApi } from './hooks/useVaraApi';
import { useMemberCount } from './hooks/useMemberCount';
import { useJoinProgram } from './hooks/useJoinProgram';
import { isHoodiNetwork } from './config/constants';
import { ENV } from './config/env';

import {
  StarsBackground,
  Header,
  Footer,
  SloganCarousel,
  Stats,
  JoinSection,
  FloatingCat,
  FloatingUfo,
} from './components';

function App() {
  const wallet = useWallet();
  const { sails, loading: sailsLoading, error: sailsError } = useSails();

  // Check if on correct network
  const isCorrectNetwork = isHoodiNetwork(wallet.chainId);

  // Ethereum client setup
  const [ethereumClient, setEthereumClient] = useState<EthereumClient | null>(null);

  useEffect(() => {
    if (!wallet.address || !wallet.walletClient || !wallet.publicClient || !wallet.isConnected) {
      setEthereumClient(null);
      return;
    }

    const client = new EthereumClient(wallet.publicClient, wallet.walletClient, ENV.ROUTER_ADDRESS);
    client.isInitialized.then(() => {
      setEthereumClient(client);
    });
  }, [wallet.address, wallet.walletClient, wallet.publicClient, wallet.isConnected]);

  // Vara API (for transactions)
  const { varaApi, isReady: varaApiReady } = useVaraApi(ethereumClient, wallet.isConnected);

  // Member count - works without wallet!
  const { memberCount, isLoading: countLoading, incrementCount } = useMemberCount(sails, varaApi);

  // Join program logic
  const {
    isJoined,
    loading,
    txHash,
    finalized,
    error: joinError,
    txStatus,
    checkingMembership,
    handleJoin,
  } = useJoinProgram(varaApi, sails, wallet.address, wallet.isConnected, wallet.publicClient, incrementCount);

  const handleConnect = async () => {
    if (wallet.isConnecting) return;
    await wallet.connect();
  };

  return (
    <div className="App">
      <StarsBackground />
      <FloatingCat />
      <FloatingUfo />

      <Header
        address={wallet.address}
        chainId={wallet.chainId}
        isConnected={wallet.isConnected}
        isConnecting={wallet.isConnecting}
        isMetaMaskInstalled={wallet.isMetaMaskInstalled}
        isCorrectNetwork={isCorrectNetwork}
        error={wallet.error}
        onConnect={handleConnect}
        onDisconnect={wallet.disconnect}
        onSwitchNetwork={wallet.switchToHoodi}
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
          varaApiReady={varaApiReady}
          sailsReady={!!sails}
          error={wallet.error}
          joinError={joinError}
          txHash={txHash}
          finalized={finalized}
          memberCount={memberCount}
          txStatus={txStatus}
          checkingMembership={checkingMembership}
          onConnect={handleConnect}
          onJoin={handleJoin}
        />
      </main>

      <Footer />
    </div>
  );
}

export default App;

import React from 'react';

export default function FloatingBalance({ connected, walletAddress }) {
  console.log('🔍 FloatingBalance component called');
  console.log('Connected:', connected);
  console.log('WalletAddress:', walletAddress);
  
  if (!connected) {
    console.log('❌ Not connected - returning null');
    return null;
  }

  console.log('✅ Connected - rendering widget');

  return (
    <div style={{
      position: 'fixed',
      top: '100px',
      right: '20px',
      background: 'red',
      padding: '20px',
      color: 'white',
      zIndex: 9999,
      border: '3px solid yellow',
      fontSize: '18px',
      fontWeight: 'bold'
    }}>
      <div>🎯 TEST WIDGET</div>
      <div>Connected: {connected ? 'YES' : 'NO'}</div>
      <div>Wallet: {walletAddress?.slice(0, 10)}...</div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DisneyCruisesExplorer from './components/DisneyCruisesExplorer';
import IngredientsExplorer from './components/IngredientsExplorer';
import SupabaseConsoleTab from './components/SupabaseConsoleTab';
import SupabaseSyncModal from './components/SupabaseSyncModal';
import { 
  fetchDisneyCruisesData, 
  fetchIngredientsData, 
  pingSupabase, 
  syncTableToSupabase 
} from './lib/supabaseClient';
import confetti from 'canvas-confetti';

export default function App() {
  const [activeTab, setActiveTab] = useState('disney');
  const [disneyData, setDisneyData] = useState([]);
  const [sourceDisney, setSourceDisney] = useState('local');
  const [ingredientsData, setIngredientsData] = useState([]);
  const [sourceIng, setSourceIng] = useState('local');
  const [supabaseStatus, setSupabaseStatus] = useState({ connected: false, latencyMs: 0 });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notification, setNotification] = useState(null);

  const loadData = async () => {
    try {
      const ping = await pingSupabase();
      setSupabaseStatus({ connected: ping.success && ping.tableReady, latencyMs: ping.latencyMs || 0 });
    } catch (err) {
      setSupabaseStatus({ connected: false, latencyMs: 0 });
    }

    const disneyRes = await fetchDisneyCruisesData();
    setDisneyData(disneyRes.data || []);
    setSourceDisney(disneyRes.source);

    const ingRes = await fetchIngredientsData();
    setIngredientsData(ingRes.data || []);
    setSourceIng(ingRes.source);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncSupabase = async (tableName, records) => {
    setIsSyncing(true);
    try {
      await syncTableToSupabase(tableName, records);
      confetti({ particleCount: 50, spread: 60 });
      setNotification({
        type: 'success',
        text: `Successfully synced ${records.length} records into Supabase table '${tableName}'!`
      });
      await loadData();
    } catch (err) {
      setNotification({
        type: 'error',
        text: `Sync error: ${err.message}. Open Settings to verify credentials.`
      });
      setIsSettingsOpen(true);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        supabaseStatus={supabaseStatus}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="app-container" style={{ flex: 1 }}>
        {notification && (
          <div
            style={{
              padding: '10px 16px',
              borderRadius: 'var(--rounded-md)',
              marginBottom: '18px',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: notification.type === 'success' ? '#e7f8eb' : '#ffedf8',
              border: `1px solid ${notification.type === 'success' ? '#bceec6' : '#ffc2eb'}`,
              color: notification.type === 'success' ? '#0d6e22' : '#b30074'
            }}
          >
            <span>{notification.text}</span>
            <button
              onClick={() => setNotification(null)}
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '14px' }}
            >
              ✕
            </button>
          </div>
        )}

        {activeTab === 'disney' && (
          <DisneyCruisesExplorer
            data={disneyData}
            source={sourceDisney}
            onSyncSupabase={handleSyncSupabase}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'ingredients' && (
          <IngredientsExplorer
            data={ingredientsData}
            source={sourceIng}
            onSyncSupabase={handleSyncSupabase}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'supabase' && (
          <SupabaseConsoleTab
            supabaseStatus={supabaseStatus}
            onRefreshStatus={loadData}
            disneyData={disneyData}
            ingredientsData={ingredientsData}
            sourceDisney={sourceDisney}
            sourceIng={sourceIng}
          />
        )}
      </main>

      <SupabaseSyncModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onRefreshStatus={loadData}
        disneyData={disneyData}
        ingredientsData={ingredientsData}
      />

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div>
            <strong>Relu Consultancy Hiring Challenge</strong> • Full-Time Data Extraction Engineer (FTE)
          </div>
          <div>
            Built with React, Vite & Supabase • Notion Design System
          </div>
        </div>
      </footer>
    </div>
  );
}

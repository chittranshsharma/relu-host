import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DisneyCruisesExplorer from './components/DisneyCruisesExplorer';
import IngredientsExplorer from './components/IngredientsExplorer';
import ChallengeAnswersView from './components/ChallengeAnswersView';
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
  const [activeTab, setActiveTab] = useState('disney'); // 'disney' | 'ingredients' | 'answers' | 'supabase'
  const [disneyData, setDisneyData] = useState([]);
  const [sourceDisney, setSourceDisney] = useState('local');
  const [ingredientsData, setIngredientsData] = useState([]);
  const [sourceIng, setSourceIng] = useState('local');
  const [supabaseStatus, setSupabaseStatus] = useState({ connected: false, latencyMs: 0 });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notification, setNotification] = useState(null);

  const loadData = async () => {
    // Check Supabase connection health
    try {
      const ping = await pingSupabase();
      setSupabaseStatus({ connected: ping.success && ping.tableReady, latencyMs: ping.latencyMs || 0 });
    } catch (err) {
      setSupabaseStatus({ connected: false, latencyMs: 0 });
    }

    // Fetch Disney Cruises
    const disneyRes = await fetchDisneyCruisesData();
    setDisneyData(disneyRes.data || []);
    setSourceDisney(disneyRes.source);

    // Fetch Ingredients
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
        text: `Sync error: ${err.message}. Open 'Connect DB' to verify credentials.`
      });
      setIsSettingsOpen(true);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        supabaseStatus={supabaseStatus}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="app-container">
        {notification && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              fontSize: '13px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              border: `1px solid ${notification.type === 'success' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)'}`,
              color: notification.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)'
            }}
          >
            <span>{notification.text}</span>
            <button
              onClick={() => setNotification(null)}
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
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

        {activeTab === 'answers' && (
          <ChallengeAnswersView
            disneyData={disneyData}
            ingredientsData={ingredientsData}
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

      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '28px 24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <strong>Relu Consultancy Hiring Challenge</strong> • Full-Time Data Extraction Engineer (FTE)
          </div>
          <div>
            Built with React, Vite & Supabase • Persistence & Presentation Suite
          </div>
        </div>
      </footer>
    </div>
  );
}

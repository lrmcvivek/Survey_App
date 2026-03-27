'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface ProviderConfig {
  provider: 'cloudinary' | 'gcp';
  availableProviders: ('cloudinary' | 'gcp')[];
}

interface UploadStats {
  totalImages: number;
  pendingUploads: number;
  failedUploads: number;
  syncedImages: number;
  storageUsed: string;
}

export default function DevTogglePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<'cloudinary' | 'gcp'>('cloudinary');
  const [stats, setStats] = useState<UploadStats | null>(null);
  const [authToken, setAuthToken] = useState<string>('');
  const [showConfig, setShowConfig] = useState(false);
  
  // Access control - check EVERY time page mounts (NO sessionStorage)
  const [hasAccess, setHasAccess] = useState(false);
  const [accessKey, setAccessKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'switch' | 'reset' | null>(null);
  const [pendingProvider, setPendingProvider] = useState<'cloudinary' | 'gcp' | null>(null);

  // ALWAYS check access on mount - don't use sessionStorage
  useEffect(() => {
    // Get auth token from localStorage
    const token = localStorage.getItem('auth_token') || '';
    setAuthToken(token);

    if (!token) {
      toast.error('Please login first');
      router.push('/login');
      return;
    }

    // DO NOT check sessionStorage - always start with hasAccess = false
    // This ensures modal shows every time user navigates to this page
    console.log('[DevToggle] Page mounted - access required');
  }, []);

  const grantAccess = () => {
    if (!accessKey.trim()) {
      toast.error('Please enter the access key');
      return;
    }

    // Get access key from environment variable (NOT hardcoded)\n    
    const expectedKey = process.env.NEXT_PUBLIC_DEV_CONFIG_KEY;
    
    if (accessKey === expectedKey) {
      setHasAccess(true);
      fetchProviderConfig(authToken);
      toast.success('Access granted');
    } else {
      toast.error('Invalid access key');
      setAccessKey('');
    }
  };

  const handleAccessKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    grantAccess();
  };

  const fetchProviderConfig = async (token: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/dev/toggle/provider', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentProvider(data.provider);
        
        setStats({
          totalImages: 1247,
          pendingUploads: 23,
          failedUploads: 5,
          syncedImages: 1219,
          storageUsed: '2.4 GB',
        });
      } else {
        throw new Error('Failed to fetch provider config');
      }
    } catch (error: any) {
      console.error('Error fetching config:', error);
      toast.error(error.message || 'Failed to load provider configuration');
    } finally {
      setLoading(false);
    }
  };

  // Handle provider switch request - show modal instead of window.confirm
  const handleRequestSwitch = (newProvider: 'cloudinary' | 'gcp') => {
    if (newProvider === currentProvider) return;
    
    setPendingProvider(newProvider);
    setPendingAction('switch');
    setShowConfirmModal(true);
  };

  // Execute provider switch
  const executeSwitch = async () => {
    if (!pendingProvider) return;
    
    try {
      setSwitching(true);
      setShowConfirmModal(false);
      
      const response = await fetch('/api/dev/toggle/provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ provider: pendingProvider }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentProvider(pendingProvider);
        toast.success(`Switched to ${data.provider.toUpperCase()}!`);
      } else {
        throw new Error('Failed to switch provider');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to switch provider');
    } finally {
      setSwitching(false);
      setPendingProvider(null);
      setPendingAction(null);
    }
  };

  // Handle reset request - show modal instead of window.confirm
  const handleResetProvider = () => {
    setPendingAction('reset');
    setShowConfirmModal(true);
  };

  // Execute reset
  const executeReset = async () => {
    try {
      setSwitching(true);
      setShowConfirmModal(false);
      
      const response = await fetch('/api/dev/toggle/reset', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        setCurrentProvider('cloudinary');
        toast.success('Provider reset to default');
      } else {
        throw new Error('Failed to reset provider');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset provider');
    } finally {
      setSwitching(false);
      setPendingAction(null);
    }
  };

  // ACCESS MODAL - Shows if no access yet (EVERY TIME page mounts)
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="relative z-10">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-md w-full p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Developer Access Required</h2>
              <p className="text-gray-300 mt-2 text-sm">Enter your access key to continue</p>
            </div>

            {/* Form */}
            <form onSubmit={handleAccessKeySubmit} className="space-y-4">
              <div>
                <label htmlFor="accessKey" className="block text-sm font-medium text-white mb-2">
                  Access Key
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="accessKey"
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-white/30 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-white bg-white/10 placeholder-gray-400"
                    placeholder="Enter access key"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!accessKey.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                Grant Access
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-xs text-gray-400">Restricted Developer Tool</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading configuration...</p>
        </div>
      </div>
    );
  }

  // MAIN PAGE - Only shows after access granted
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header with Security Badge */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Developer Tools</h1>
              <p className="mt-2 text-sm text-gray-300">Image Storage Provider Configuration</p>
            </div>
            <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/50 px-4 py-2 rounded-full backdrop-blur-sm">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-semibold text-green-300">Authenticated</span>
            </div>
          </div>
        </div>

        {/* Provider Selection Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl rounded-xl mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 bg-white/5">
            <h2 className="text-xl font-semibold text-white">Storage Provider</h2>
            <p className="text-sm text-gray-300 mt-1">Select cloud storage provider for image uploads</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cloudinary Option */}
              <button
                onClick={() => handleRequestSwitch('cloudinary')}
                disabled={switching || currentProvider === 'cloudinary'}
                className={`relative p-6 border-2 rounded-xl transition-all duration-200 ${
                  currentProvider === 'cloudinary'
                    ? 'border-cyan-500 bg-cyan-500/20 shadow-lg shadow-cyan-500/20'
                    : 'border-white/20 hover:border-cyan-500/50 hover:bg-white/5'
                } ${switching ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer transform hover:scale-[1.02]'}`}
              >
                <div>
                  <h3 className="text-lg font-semibold text-white">Cloudinary</h3>
                  <p className="text-sm text-gray-400 mt-1">Testing / Early Production</p>
                  <ul className="mt-3 text-xs text-gray-300 space-y-1">
                    <li>✓ Free tier: 25GB storage</li>
                    <li>✓ Auto-optimization</li>
                    <li>✓ Fast CDN</li>
                  </ul>
                </div>
                {currentProvider === 'cloudinary' && (
                  <span className="absolute top-2 right-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/30 text-cyan-300 border border-cyan-500/50">
                    Active
                  </span>
                )}
              </button>

              {/* GCP Option */}
              <button
                onClick={() => handleRequestSwitch('gcp')}
                disabled={switching || currentProvider === 'gcp'}
                className={`relative p-6 border-2 rounded-xl transition-all duration-200 ${
                  currentProvider === 'gcp'
                    ? 'border-orange-500 bg-orange-500/20 shadow-lg shadow-orange-500/20'
                    : 'border-white/20 hover:border-orange-500/50 hover:bg-white/5'
                } ${switching ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer transform hover:scale-[1.02]'}`}
              >
                <div>
                  <h3 className="text-lg font-semibold text-white">Google Cloud Platform</h3>
                  <p className="text-sm text-gray-400 mt-1">Production Scale</p>
                  <ul className="mt-3 text-xs text-gray-300 space-y-1">
                    <li>✓ Enterprise grade</li>
                    <li>✓ Global infrastructure</li>
                    <li>✓ Cost optimized</li>
                  </ul>
                </div>
                {currentProvider === 'gcp' && (
                  <span className="absolute top-2 right-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/30 text-orange-300 border border-orange-500/50">
                    Active
                  </span>
                )}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <button
                onClick={handleResetProvider}
                disabled={switching || currentProvider === 'cloudinary'}
                className="text-sm text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset to Default (Cloudinary)
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Card */}
        {stats && (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl rounded-xl mb-6 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Upload Statistics</h2>
                  <p className="text-sm text-gray-300 mt-1">Current session</p>
                </div>
                <button
                  onClick={() => fetchProviderConfig(authToken)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-cyan-300 hover:text-cyan-200 hover:bg-white/10 rounded-lg transition-colors"
                >
                  ↻ Refresh
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-500/20 rounded-xl border border-blue-500/30">
                  <div className="text-3xl font-bold text-blue-300">{stats.totalImages}</div>
                  <div className="text-xs text-blue-300 mt-2 font-medium">Total Images</div>
                </div>
                <div className="text-center p-4 bg-green-500/20 rounded-xl border border-green-500/30">
                  <div className="text-3xl font-bold text-green-300">{stats.syncedImages}</div>
                  <div className="text-xs text-green-300 mt-2 font-medium">Synced</div>
                </div>
                <div className="text-center p-4 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
                  <div className="text-3xl font-bold text-yellow-300">{stats.pendingUploads}</div>
                  <div className="text-xs text-yellow-300 mt-2 font-medium">Pending</div>
                </div>
                <div className="text-center p-4 bg-red-500/20 rounded-xl border border-red-500/30">
                  <div className="text-3xl font-bold text-red-300">{stats.failedUploads}</div>
                  <div className="text-xs text-red-300 mt-2 font-medium">Failed</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Configuration Details */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl rounded-xl overflow-hidden">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-white/5 transition-colors"
          >
            <div>
              <h2 className="text-xl font-semibold text-white">Configuration</h2>
              <p className="text-sm text-gray-300 mt-1">Environment settings</p>
            </div>
            <svg className={`h-5 w-5 text-gray-400 transform transition-transform ${showConfig ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showConfig && (
            <div className="px-6 py-4 border-t border-white/10 bg-white/5">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-400">Active Provider</dt>
                  <dd className="mt-1 text-sm text-white font-mono bg-white/10 px-3 py-2 rounded-lg border border-white/20 inline-block">
                    {currentProvider.toUpperCase()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-400">Compression</dt>
                  <dd className="mt-1 text-xs text-gray-300 bg-white/10 p-3 rounded-lg border border-white/20">
                    Max Width: 1280px • Quality: 65% • Target: 300-700KB • Format: JPEG
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          <p>/dev/toggle - Restricted Developer Tool</p>
        </div>
      </div>

      {/* CONFIRMATION MODAL - Replaces window.confirm */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
              onClick={() => setShowConfirmModal(false)}
            />
            
            {/* Modal */}
            <div className="relative bg-slate-900 border border-white/20 rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
              {/* Icon */}
              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              {/* Content */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {pendingAction === 'switch' && pendingProvider
                    ? `Switch to ${pendingProvider.toUpperCase()}?`
                    : pendingAction === 'reset'
                    ? 'Reset to Default?'
                    : 'Confirm Action'}
                </h3>
                <p className="text-sm text-gray-300">
                  {pendingAction === 'switch' && pendingProvider && (
                    <>
                      This will change from{' '}
                      <span className="font-medium text-cyan-400">{currentProvider.toUpperCase()}</span> to{' '}
                      <span className="font-medium text-orange-400">{pendingProvider.toUpperCase()}</span>.
                    </>
                  )}
                  {pendingAction === 'reset' && (
                    <>
                      This will reset the provider to{' '}
                      <span className="font-medium text-cyan-400">CLOUDINARY</span> (default).
                    </>
                  )}
                </p>
                <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                  <p className="text-xs text-blue-300">
                    ⚠️ This affects all FUTURE uploads only. Existing images remain unchanged.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={switching}
                  className="px-4 py-2.5 text-sm font-medium text-gray-300 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={pendingAction === 'reset' ? executeReset : executeSwitch}
                  disabled={switching}
                  className={`px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors ${
                    pendingAction === 'reset'
                      ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600'
                      : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg`}
                >
                  {switching ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Confirm'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


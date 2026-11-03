'use client';

// Platform Settings: site-wide switches the admin flips to hide a section from the site menus
// (backend GET/PUT /admin/platform-settings). Each switch saves on click. Hidden sections keep
// working from direct links; only the menu entries go (see utils/constants/destinations.jsx).
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/utils/axiosConfig';

const SWITCHES = [
  {
    name: 'showDeals',
    label: 'Show Deals',
    on: 'Deals appears in the menus and on the profile page.',
    off: 'Deals is out of the menus and the profile page. Its pages still open from links.',
  },
  {
    name: 'showCoupons',
    label: 'Show Coupons',
    on: 'Coupons appears in the menus.',
    off: 'Coupons is out of the menus. Its pages still open from links, and claimed codes still work.',
  },
];

const PlatformSettingsPage = () => {
  const router = useRouter();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    axios
      .get('/admin/platform-settings', { withCredentials: true })
      .then((res) => setSettings(res.data.settings))
      .catch(() => setMessage({ type: 'error', text: 'Could not load the settings. Refresh the page to try again.' }));
  }, []);

  const toggle = async (item) => {
    const next = !settings[item.name];
    setSaving(item.name);
    setMessage({ type: '', text: '' });
    try {
      const res = await axios.put(
        '/admin/platform-settings',
        { [item.name]: next },
        { withCredentials: true }
      );
      setSettings(res.data.settings);
      setMessage({ type: 'success', text: `Saved. ${item.label.replace('Show ', '')} ${next ? 'showing' : 'hidden'}.` });
      // Re-read the server layout so this admin's own menus update straight away.
      router.refresh();
    } catch {
      setMessage({ type: 'error', text: 'Not saved. Check your connection and try again.' });
    } finally {
      setSaving('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold text-slate-900">Platform Settings</h1>
      <p className="mt-1 text-sm text-slate-600">Choose which sections people can see in the site menus.</p>

      <div className="mt-5 bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
        {!settings && !message.text && (
          <div className="p-4 text-sm text-slate-500">Loading...</div>
        )}
        {settings &&
          SWITCHES.map((item) => {
            const isOn = settings[item.name] !== false;
            return (
              <div key={item.name} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{item.label}</p>
                  <p className="text-sm text-slate-600">{isOn ? item.on : item.off}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isOn}
                  aria-label={item.label}
                  disabled={saving === item.name}
                  onClick={() => toggle(item)}
                  className="flex-shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded-md p-1"
                >
                  <span className="w-14 text-right">{isOn ? 'Showing' : 'Hidden'}</span>
                  <span className={`relative w-11 h-6 rounded-full transition-colors ${isOn ? 'bg-teal-700' : 'bg-slate-300'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${isOn ? 'left-[22px]' : 'left-0.5'}`} />
                  </span>
                </button>
              </div>
            );
          })}
      </div>

      {message.text && (
        <p
          role="status"
          className={`mt-3 text-sm ${message.type === 'error' ? 'text-red-600' : 'text-teal-700'}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
};

export default PlatformSettingsPage;

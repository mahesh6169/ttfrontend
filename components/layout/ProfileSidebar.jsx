'use client';

// Desktop profile sidebar.
// Static left nav (desktop only). Organiser items are gated by host flags on state.user
// (freeHost / paidHost — see HostTypeFlags.md). Settings sits quietly at the very bottom.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  FaHeart,
  FaCommentDots,
  FaCreditCard,
  FaUserCheck,
  FaQrcode,
  FaUndo,
  FaBoxOpen,
  FaCalendarAlt,
  FaTags,
  FaComments,
  FaClipboardList,
  FaTicketAlt,
  FaTag,
  FaFileInvoiceDollar,
  FaCog,
  FaSignOutAlt,
} from 'react-icons/fa';

const TOP = [
  { label: 'Favourites', href: '/users/profile/favourites', icon: FaHeart },
  { label: 'Chats', href: '/users/profile/conversations', icon: FaCommentDots },
];

// `flag` (when present) gates the item on user[flag] being true. No flag = always shown.
const ORGANISER = [
  { label: 'Stripe Setup', href: '/users/profile/stripeSetup', icon: FaCreditCard },
  { label: 'Check-in RSVP', href: '/users/profile/checkinrsvp', icon: FaUserCheck, flag: 'freeHost' },
  { label: 'Check-in Paid', href: '/users/profile/checkin-paid', icon: FaQrcode, flag: 'paidHost' },
  { label: 'Refunds', href: '/users/profile/refunds', icon: FaUndo, flag: 'paidHost' },
];

const MANAGE = [
  { label: 'Listings', href: '/users/profile/manageads', icon: FaBoxOpen },
  { label: 'Events', href: '/users/profile/manageevents', icon: FaCalendarAlt },
  { label: 'Deals', href: '/users/profile/deals', icon: FaTags },
  { label: 'Forum', href: '/users/profile/managethreads', icon: FaComments },
];

const RECORDS = [
  { label: 'RSVPs', href: '/users/profile/myregistrations', icon: FaClipboardList },
  { label: 'Tickets', href: '/users/profile/mytickets', icon: FaTicketAlt },
  { label: 'Codes', href: '/users/profile/my-codes', icon: FaTag },
  { label: 'Invoices', href: '/users/profile/myinvoices', icon: FaFileInvoiceDollar },
];

const SETTINGS = { label: 'Settings', href: '/users/profile/settings', icon: FaCog };

const GroupLabel = ({ children }) => (
  <p className="px-3 mt-4 mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
    {children}
  </p>
);

const NavItem = ({ item, active, onNavigate }) => {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? 'bg-teal-50 text-teal-700 font-semibold'
          : 'text-slate-700 hover:bg-slate-50 hover:text-teal-700'
      }`}
    >
      <Icon className="text-base shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
};

export default function ProfileSidebar({ className = '', onNavigate, onSignout }) {
  const pathname = usePathname();
  const { user } = useSelector((state) => state.user);

  const isActive = (href) => pathname === href;
  const organiserItems = ORGANISER.filter((i) => !i.flag || user?.[i.flag]);
  const initial = (user?.name || 'U').charAt(0).toUpperCase();

  return (
    <nav className={className}>
      {/* flex-col layout: scrollable zone fills available height, footer group sits below it */}
      <div className="flex flex-col h-full">

        {/* Scrollable zone: all nav items except Settings and Signout */}
        <div className="flex-1 min-h-0 overflow-y-auto pb-2">
          {/* Identity → profile home */}
          <Link
            href="/users/profile"
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive('/users/profile') ? 'bg-teal-50' : 'hover:bg-slate-50'
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-semibold shrink-0">
              {initial}
            </div>
            <span className="text-sm font-semibold text-slate-900 truncate">
              {user?.name || 'My Profile'}
            </span>
          </Link>
          <div className="border-t border-slate-200 my-2" />

          <div className="space-y-0.5">
            {TOP.map((i) => (
              <NavItem key={i.href} item={i} active={isActive(i.href)} onNavigate={onNavigate} />
            ))}
          </div>

          <GroupLabel>Organiser</GroupLabel>
          <div className="space-y-0.5">
            {organiserItems.map((i) => (
              <NavItem key={i.href} item={i} active={isActive(i.href)} onNavigate={onNavigate} />
            ))}
          </div>

          <GroupLabel>Manage</GroupLabel>
          <div className="space-y-0.5">
            {MANAGE.map((i) => (
              <NavItem key={i.href} item={i} active={isActive(i.href)} onNavigate={onNavigate} />
            ))}
          </div>

          <div className="space-y-0.5 mt-4">
            {RECORDS.map((i) => (
              <NavItem key={i.href} item={i} active={isActive(i.href)} onNavigate={onNavigate} />
            ))}
          </div>
        </div>

        {/* Footer group: one separator line, then Settings and Signout as plain items */}
        <div className="shrink-0 border-t border-slate-200 pt-2 pb-2">
          <NavItem item={SETTINGS} active={isActive(SETTINGS.href)} onNavigate={onNavigate} />
          {onSignout && (
            <button
              onClick={onSignout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full text-left text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <FaSignOutAlt className="text-base shrink-0" />
              <span>Signout</span>
            </button>
          )}
        </div>

      </div>
    </nav>
  );
}

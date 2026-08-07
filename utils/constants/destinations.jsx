import { RiAdvertisementFill } from 'react-icons/ri';
import { FaCalendarAlt } from 'react-icons/fa';
import { MdLocalOffer, MdOutlineGroups2 } from 'react-icons/md';
import { HiReceiptPercent } from 'react-icons/hi2';

// Home has no react-icons equivalent, so wrap the outline-house SVG in a small component
// that takes the same `size` prop the react-icons destinations use. It inherits colour via
// stroke="currentColor", matching the other icons.
export const HomeIcon = ({ size = 20, ...props }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

// The six public destinations - the single source of truth for BOTH the desktop header
// centre nav and the mobile bottom navigation. Each carries one href, one label and one
// icon component; each nav renders the icon at its own size (kept as-is to preserve each
// nav's look). See featureplans/shared-appshell-nav.md.
export const NAV_DESTINATIONS = [
  { href: '/', label: 'Home', Icon: HomeIcon },
  { href: '/listings', label: 'Listings', Icon: RiAdvertisementFill },
  { href: '/events', label: 'Events', Icon: FaCalendarAlt },
  { href: '/deals', label: 'Deals', Icon: MdLocalOffer },
  { href: '/coupons', label: 'Coupons', Icon: HiReceiptPercent },
  { href: '/threads', label: 'Forum', Icon: MdOutlineGroups2 },
];

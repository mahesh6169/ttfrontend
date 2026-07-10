import Link from 'next/link';
import { HiChatBubbleLeftRight, HiPlus } from 'react-icons/hi2';
import { FaArrowRight } from 'react-icons/fa';

// Forum on the home page is a compact text list (not an image-card rail) - thread
// titles are text, so a list reads better and varies the page rhythm.
// threads arrive flattened by /api/home/threads: { _id, title, author, createdAt, slug }.
const ForumList = ({ threads = [], viewAllHref = '/threads', cta }) => {
  const shown = threads.slice(0, 5);

  return (
    <section className="py-4 px-3 sm:py-6 sm:px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-2xl font-bold text-teal-800">Community Forum</h2>
        <Link
          href={viewAllHref}
          className="text-xs sm:text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
        >
          View All <FaArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* List */}
      {shown.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {shown.map((t) => (
            <li key={t._id}>
              <Link
                href={`/threads/views/${t._id}`}
                className="flex items-center gap-3 px-2 -mx-2 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50 text-teal-700 shrink-0">
                  <HiChatBubbleLeftRight className="w-4 h-4" />
                </span>
                <span className="min-w-0 text-sm font-medium text-slate-900 line-clamp-1">
                  {t.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
          <HiChatBubbleLeftRight className="w-7 h-7 text-slate-400" />
          <span className="text-sm text-slate-500">No discussions yet - start one</span>
        </div>
      )}

      {/* CTA */}
      {cta && (
        <div className="mt-4 flex justify-center sm:justify-end">
          <Link
            href={cta.href}
            className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors"
          >
            <HiPlus className="w-4 h-4" /> {cta.label}
          </Link>
        </div>
      )}
    </section>
  );
};

export default ForumList;

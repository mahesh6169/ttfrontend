// Human-friendly formatting of a stored RSVP answer for the CSV / PDF downloads.
//
// The base formatAnswer (utils/events/questionTypes.js) is shared with the backend and stays
// dumb (arrays join with "; ", everything else is stringified). Date/time answers are stored in
// 24-hour ISO form ("2026-08-20T14:30" or "2026-08-20"); raw in a spreadsheet that reads as machine
// text, so here - frontend only, where date-fns is available - we render them the same friendly way
// the attendee picker shows them: "20 Aug 2026, 2:30 PM" (or "20 Aug 2026" with no time).
import { format, parseISO, isValid } from 'date-fns';
import { formatAnswer } from '@/utils/events/questionTypes';

const DATE_TIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const formatAnswerForExport = (response) => {
  if (typeof response === 'string') {
    const hasTime = DATE_TIME_RE.test(response);
    if (hasTime || DATE_RE.test(response)) {
      const d = parseISO(response);
      if (isValid(d)) return format(d, hasTime ? 'd MMM yyyy, h:mm a' : 'd MMM yyyy');
    }
  }
  return formatAnswer(response);
};

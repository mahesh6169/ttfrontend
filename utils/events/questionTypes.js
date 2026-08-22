// Canonical RSVP question types (frontend mirror of ttbackendflyio/utils/events/questionTypes.js).
// See featureplans/events-rsvp-question-types.md. The server is the source of truth; this keeps the
// builder, the RSVP form, the check-in displays, and the CSV export speaking the same vocabulary.

export const QUESTION_TYPES = ['text', 'select', 'radio', 'checkboxes', 'scale', 'date', 'time', 'yesno'];
export const PAID_QUESTION_TYPES = ['text', 'select'];
export const CHOICE_TYPES = ['select', 'radio', 'checkboxes'];
export const BLOCKABLE_TYPES = ['select', 'radio'];

export const LABEL_MAX = 200;
export const OPTION_MAX = 150;
export const MIN_OPTIONS = 2; // dropdown / multiple choice / checkboxes need at least two real choices
export const TEXT_ANSWER_MAX = 500;
export const SCALE_MIN = 1;
export const SCALE_MAX = 5;
export const SCALE_LABEL_MAX = 15; // per-number label - short so it fits inside the pill

export const isChoiceType = (t) => CHOICE_TYPES.includes(t);
export const isBlockableType = (t) => BLOCKABLE_TYPES.includes(t);

// Human label per type - used by the collapsed builder summary and displays.
export const TYPE_LABEL = {
  text: 'Text',
  select: 'Dropdown',
  radio: 'Multiple choice',
  checkboxes: 'Checkboxes',
  scale: 'Linear scale',
  date: 'Date',
  time: 'Time',
  yesno: 'Yes / No',
};

// The builder's add-question menu, in order. Each entry: { type, label }. Free events show all
// eight; paid events show only text + dropdown (D2). label is the short verb shown on the button.
export const ADD_MENU = [
  { type: 'text', label: 'Text', hint: 'Attendee types the answer' },
  { type: 'select', label: 'Dropdown', hint: 'Pick one from a list' },
  { type: 'radio', label: 'Multiple choice', hint: 'Pick ONE - round buttons' },
  { type: 'checkboxes', label: 'Checkboxes', hint: 'Pick MANY - tick all that apply' },
  { type: 'scale', label: 'Linear scale', hint: 'Pick a number, 1 to 5' },
  { type: 'date', label: 'Date', hint: 'Pick a date (can include time)' },
];
// 'time' and 'yesno' stay valid types for anything already saved, but are no longer offered:
// a date question's "Also ask time" tick covers the date-and-time ask in ONE question, and a
// visible Yes/No is just a two-option Multiple choice (where "No" can even be marked blocking).

export const addMenuFor = (isPaid) =>
  isPaid ? ADD_MENU.filter((m) => PAID_QUESTION_TYPES.includes(m.type)) : ADD_MENU;

// One display string for any stored answer. A pick-many list joins with "; " (options may contain
// commas, so a plain comma-join would be ambiguous). Everything else is stringified as-is.
export const formatAnswer = (response) => {
  if (Array.isArray(response)) return response.join('; ');
  if (response == null) return '';
  return String(response);
};

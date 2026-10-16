// The registration-questions builder (wizard step 3, "Attendee Information"): question types per
// event kind, label-safe editing after answers, input validation, reordering, and the full freeze on
// paid events with answers. Runs as the owning organiser in edit mode.
import { test, expect } from '@playwright/test';
import { readSeed, openEdit } from '../helpers.js';

test.use({ storageState: 'e2e/.auth/organiser.json' });

// Advance the edit wizard to step 3 (Registration) and wait for the questions card.
const gotoStep3 = async (page, eventId) => {
  await page.goto(`/events/edit/${eventId}`);
  await expect(page.getByRole('heading', { name: 'Edit Event' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Attendee Information' })).toBeVisible({ timeout: 15_000 });
};

test('one Add question button offers six types on a free event (with scale labels, Also ask time and Preview) and two on a paid event', async ({ page }) => {
  await gotoStep3(page, readSeed().qtypesFreeEventId);

  // One "+ Add question" button opens the editor in a sheet (bottom sheet on mobile / dialog on desktop).
  await page.getByRole('button', { name: 'Add question' }).click();
  await expect(page.getByTestId('question-editor-sheet')).toBeVisible();

  // The in-card type dropdown lists SIX types on a free event (text, dropdown, multiple choice,
  // checkboxes, linear scale, date) - Time and Yes/No are gone from the menu.
  await page.getByRole('button', { name: 'Text' }).click();
  await expect(page.getByRole('option')).toHaveCount(6);
  for (const label of [/Multiple choice/, /Checkboxes/, /Linear scale/, /^Date/]) {
    await expect(page.getByRole('option', { name: label })).toBeVisible();
  }

  // Choosing Linear scale reveals the per-number label editor.
  await page.getByRole('option', { name: /Linear scale/ }).click();
  await expect(page.getByText('Filled labels appear under the scale.')).toBeVisible();

  // Choosing Date reveals "Also ask time".
  await page.getByRole('button', { name: 'Linear scale' }).click();
  await page.getByRole('option', { name: /^Date/ }).click();
  await expect(page.getByText('Also ask time')).toBeVisible();

  // Name it and close the editor sheet (keeps the question), then Preview opens the live sheet.
  await page.getByPlaceholder(/Enter your question/).fill('When can you arrive');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Preview' }).click();
  await expect(page.getByRole('heading', { name: 'Attendee view' })).toBeVisible();

  // A paid event offers only text and dropdown.
  await gotoStep3(page, readSeed().qtypesPaidEventId);
  await page.getByRole('button', { name: 'Add question' }).click();
  await page.getByRole('button', { name: 'Text' }).click();
  await expect(page.getByRole('option')).toHaveCount(2);
  await expect(page.getByRole('option', { name: /Multiple choice/ })).toHaveCount(0);
});

test('on a free event with answers, questions allow label-safe edits only, the rename reaches the RSVP form, and a new required question warns', async ({ page }) => {
  const id = readSeed().qeditFreeEventId;
  await gotoStep3(page, id);

  // Answered questions show an Edit control (not a delete) and no full-lock note.
  await expect(page.getByText('Attendees registered - locked')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Delete question' })).toHaveCount(0);

  // Open the dropdown question (first card).
  await page.getByRole('button', { name: 'Edit question' }).first().click();
  await expect(page.getByText(/This question has answers/)).toBeVisible();

  // The type is locked; the existing first option is locked; the label is editable.
  await expect(page.getByRole('button', { name: 'Dropdown' })).toBeDisabled();
  await expect(page.getByPlaceholder('Option 1')).toBeDisabled(); // "Veg" - existing option
  await expect(page.getByPlaceholder('Option 1')).toHaveValue('Veg');
  await page.getByPlaceholder(/Enter your question/).fill('Meal preference');

  // A new option can be appended and is editable.
  await page.getByRole('button', { name: 'Add option' }).click();
  await page.getByPlaceholder('Option 3').fill('Vegan');
  await page.getByRole('button', { name: 'Done', exact: true }).click();

  // The scale question's labels are editable.
  await page.getByRole('button', { name: 'Edit question' }).nth(1).click();
  const scaleLabel = page.getByPlaceholder(/What 1 means/);
  await expect(scaleLabel).toBeEnabled();
  await expect(scaleLabel).toHaveValue('Poor');
  await scaleLabel.fill('Terrible');
  await page.getByRole('button', { name: 'Done', exact: true }).click();

  // Save.
  await page.getByRole('button', { name: 'Update', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Event Updated' })).toBeVisible({ timeout: 20_000 });

  // The rename survives and shows on the RSVP form.
  await page.goto(`/events/rsvp/${id}`);
  await page.locator('[data-attendee-section]').waitFor({ timeout: 20_000 });
  await expect(page.getByText('Meal preference')).toBeVisible();
  await expect(page.getByText('Meal choice')).toHaveCount(0);

  // Another free event with answers: one Edit control, no lock note, no Delete; adding a new question
  // is allowed and marking it required warns it only covers future registrants.
  await openEdit(page, readSeed().editLockQuestionEventId);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Dietary needs')).toBeVisible();
  await expect(page.getByText(/attendees registered - locked/i)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Edit question' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Delete question' })).toHaveCount(0);
  // One "Add question" button adds a text question by default; the toggle reads "Required to register".
  await page.getByRole('button', { name: 'Add question' }).click();
  await page.getByLabel('Required to register').check();
  await expect(page.getByText(/only applies to people who register from now on/i)).toBeVisible();
});

test('Done needs a question label, and a dropdown needs at least two options (with Block registration under each option)', async ({ page }) => {
  await gotoStep3(page, readSeed().qeditFreeEventId);

  // Add a question, leave the label blank, hit Done -> the sheet stays open with the error.
  await page.getByRole('button', { name: 'Add question' }).click();
  await expect(page.getByTestId('question-editor-sheet')).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByTestId('question-editor-sheet')).toBeVisible(); // did not close
  await expect(page.getByText('Type your question')).toBeVisible();

  // Fill the label -> Done now commits and the sheet closes.
  await page.getByPlaceholder(/Enter your question/).fill('A brand new question');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByTestId('question-editor-sheet')).toHaveCount(0);

  // A dropdown with only one option is rejected.
  await gotoStep3(page, readSeed().qeditFreeEventId);
  await page.getByRole('button', { name: 'Add question' }).click();
  await page.getByPlaceholder(/Enter your question/).fill('Pick one');
  await page.getByRole('button', { name: 'Text' }).click();
  await page.getByRole('option', { name: 'Dropdown' }).click();

  await page.getByPlaceholder('Option 1').fill('Only choice');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByTestId('question-editor-sheet')).toBeVisible(); // stayed open
  await expect(page.getByText(/at least 2 options/i)).toBeVisible();

  // Add a second option -> Done now commits.
  await page.getByRole('button', { name: 'Add option' }).click();
  await page.getByPlaceholder('Option 2').fill('Second choice');

  // The block-registration checkbox sits on its own line under the option and is right-aligned within
  // the options column. Both options now show one - check the second option's.
  const block = page.getByText('Block registration').last();
  await expect(block).toBeVisible();
  const optionBox = await page.getByPlaceholder('Option 2').boundingBox();
  const removeBox = await page.getByRole('button', { name: 'Remove option' }).last().boundingBox();
  const blockBox = await block.boundingBox();
  expect(blockBox.y).toBeGreaterThan(optionBox.y + optionBox.height - 5); // below the option row
  expect(blockBox.x + blockBox.width).toBeLessThanOrEqual(removeBox.x + removeBox.width + 5); // right edge aligns with the option row's right edge

  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByTestId('question-editor-sheet')).toHaveCount(0);
});

test('a question moves down, the end arrows are disabled, and the new order survives a save', async ({ page }) => {
  const labelsInOrder = async () => page.getByTestId('rsvp-question-card-label').allInnerTexts();
  const id = readSeed().qreorderFreeEventId;
  await gotoStep3(page, id);

  // Seeded order.
  expect(await labelsInOrder()).toEqual(['T-shirt size', 'Any dietary needs', 'Are you 18 or over']);

  const cards = page.getByTestId('rsvp-question-card');
  // The first card cannot move up; the last cannot move down.
  await expect(cards.first().getByRole('button', { name: 'Move question up' })).toBeDisabled();
  await expect(cards.last().getByRole('button', { name: 'Move question down' })).toBeDisabled();

  // Move the first question ("T-shirt size") down one place.
  await cards.first().getByRole('button', { name: 'Move question down' }).click();
  expect(await labelsInOrder()).toEqual(['Any dietary needs', 'T-shirt size', 'Are you 18 or over']);

  // Save and reload - the new order persists.
  await page.getByRole('button', { name: 'Update', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Event Updated' })).toBeVisible({ timeout: 20_000 });
  await gotoStep3(page, id);
  expect(await labelsInOrder()).toEqual(['Any dietary needs', 'T-shirt size', 'Are you 18 or over']);
});

test('an answered question on a paid event stays fully locked with no edit or delete control', async ({ page }) => {
  await gotoStep3(page, readSeed().qeditPaidEventId);

  // The question shows the full-lock note and offers no Edit or Delete control.
  await expect(page.getByText('Attendees registered - locked')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit question' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Delete question' })).toHaveCount(0);
});

// featureplans/events-rsvp-question-editing.md - builder post-activity editing (AC10, AC11).
// AC10: on a FREE event with answers, an existing question's card unlocks the label-safe edits (reword,
// add option, scale labels) while type / existing options / delete / blocking stay disabled with a
// note; the rename survives save and shows on the RSVP form. AC11: on a PAID event with answers, every
// existing question stays fully locked exactly as before.
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

const gotoStep3 = async (page, eventId) => {
  await page.goto(`/events/edit/${eventId}`);
  await expect(page.getByRole('heading', { name: 'Edit Event' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Attendee Information' })).toBeVisible({ timeout: 15_000 });
};

test.describe('AC10 free event with activity - label-safe unlock', () => {
  test.use({ storageState: 'e2e/.auth/organiser.json' });

  test('AC10 an answered question edits label/options/scale-labels; meaning-changes stay locked; rename shows on RSVP form', async ({ page }) => {
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
  });
});

test.describe('Builder input validation', () => {
  test.use({ storageState: 'e2e/.auth/organiser.json' });

  test('Done requires a question label - a blank question cannot be committed', async ({ page }) => {
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
  });

  test('Done requires at least two options on a dropdown; blocking sits under the option, right-aligned', async ({ page }) => {
    await gotoStep3(page, readSeed().qeditFreeEventId);

    await page.getByRole('button', { name: 'Add question' }).click();
    await page.getByPlaceholder(/Enter your question/).fill('Pick one');
    await page.getByRole('button', { name: 'Text' }).click();
    await page.getByRole('option', { name: 'Dropdown' }).click();

    // Only one option filled -> Done is rejected with the two-option message.
    await page.getByPlaceholder('Option 1').fill('Only choice');
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(page.getByTestId('question-editor-sheet')).toBeVisible(); // stayed open
    await expect(page.getByText(/at least 2 options/i)).toBeVisible();

    // Add a second option -> Done now commits.
    await page.getByRole('button', { name: 'Add option' }).click();
    await page.getByPlaceholder('Option 2').fill('Second choice');

    // The block-registration checkbox reads the new wording, sits on its own line under the
    // option (below the textarea), and is right-aligned within the options column. Both options
    // now show one - check the second option's.
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
});

test.describe('Reorder questions (move up/down)', () => {
  test.use({ storageState: 'e2e/.auth/organiser.json' });

  const labelsInOrder = async (page) =>
    page.getByTestId('rsvp-question-card-label').allInnerTexts();

  test('a question moves down, the ends disable their arrows, and the new order survives a save', async ({ page }) => {
    const id = readSeed().qreorderFreeEventId;
    await gotoStep3(page, id);

    // Seeded order.
    expect(await labelsInOrder(page)).toEqual(['T-shirt size', 'Any dietary needs', 'Are you 18 or over']);

    const cards = page.getByTestId('rsvp-question-card');
    // The first card cannot move up; the last cannot move down.
    await expect(cards.first().getByRole('button', { name: 'Move question up' })).toBeDisabled();
    await expect(cards.last().getByRole('button', { name: 'Move question down' })).toBeDisabled();

    // Move the first question ("T-shirt size") down one place.
    await cards.first().getByRole('button', { name: 'Move question down' }).click();
    expect(await labelsInOrder(page)).toEqual(['Any dietary needs', 'T-shirt size', 'Are you 18 or over']);

    // Save and reload - the new order persists.
    await page.getByRole('button', { name: 'Update', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Event Updated' })).toBeVisible({ timeout: 20_000 });
    await gotoStep3(page, id);
    expect(await labelsInOrder(page)).toEqual(['Any dietary needs', 'T-shirt size', 'Are you 18 or over']);
  });
});

test.describe('AC11 paid event with activity - fully frozen', () => {
  test.use({ storageState: 'e2e/.auth/organiser.json' });

  test('AC11 an answered paid-event question stays fully locked with no edit control', async ({ page }) => {
    await gotoStep3(page, readSeed().qeditPaidEventId);

    // The question shows the full-lock note and offers no Edit or Delete control.
    await expect(page.getByText('Attendees registered - locked')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit question' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Delete question' })).toHaveCount(0);
  });
});

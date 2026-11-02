// Minimal scenario used to check the runner itself.
export default {
  'smoke-404': {
    viewports: ['1440x900'],
    async run({ page, base, shot, settle }) {
      await page.goto(base + '/404', { waitUntil: 'load' });
      await settle(2500);
      await shot('settled');
    },
  },
};

// Navigation scenarios: the ticket "film quick menu" (left), the main panel (top-right burger),
// the footage panel (/work in Footage mode), the mobile menu, and a nav-link page transition.
// Triggers (from app.js, class Hn): each .menu-w input has pointer-events:none; the click handler
// sits on the input's parent -> .checkbox-w (input#smallpanel, quick menu / footage panel) and
// [data-menu="maintrigger"] (input#mainpanel). .menu-close-trig (fixed overlay) closes everything.
// On /about the quick menu is disabled by main.css ([data-page=about] .checkbox-w{pointer-events:none}).
// Uses the deterministic kit from 10-home.mjs (fake clock, frozen videos/CSS before each shot).
import { kit, enterHome } from './10-home.mjs';

const QUICK = '.menu-w .checkbox-w';
const MAIN = '[data-menu="maintrigger"]';
const ROWS = '[data-menu="smallpanel"] .menu-film-item';
const MAIN_LINKS = '[data-menu="mainpanel"] a.menu-link.large';
const TOGGLE_FOOTAGE = '[data-work="toggle"] button.work-toggle:not(.inactive)';

async function park(k, ctx) {
  // neutral pointer position (over the page, away from the nav) so hover states do not leak
  if (!ctx.mobile) await k.move(ctx.width * 0.5, ctx.height * 0.72, 3);
}

export default {
  'nav-menus': {
    async run(ctx) {
      const { mobile } = ctx;
      // ---- home, after the intro
      const k = await enterHome(ctx);
      await park(k, ctx);
      await k.frames(500);
      await k.shot('01-home-settled');
      if (!mobile) {
        await k.click(QUICK);
        await k.frames(1200);
        await k.note('quick open');
        await k.shot('02-home-quick-open');
        await k.hover(ROWS, 2);
        await k.frames(700);
        await k.shot('03-home-quick-hover-row3');
        await k.hover(ROWS, 6);
        await k.frames(700);
        await k.shot('04-home-quick-hover-row7');
        await k.click(QUICK);
        await k.frames(1200);
        await park(k, ctx);
        await k.frames(300);
        await k.note('quick closed');
        await k.shot('05-home-quick-closed');
      }
      await k.click(MAIN);
      await k.frames(1400);
      await k.note('main open');
      await k.shot('06-home-main-open');
      if (!mobile) {
        await k.hover(MAIN_LINKS, 1);
        await k.frames(700);
        await k.shot('07-home-main-hover-about');
        // switch main -> quick (Hn: unchecks main, re-checks quick after 550ms)
        await k.click(QUICK);
        await k.frames(1500);
        await k.note('switched to quick');
        await k.shot('08-home-switch-to-quick');
        // pick a film in the quick menu -> the roll travels to it
        await k.click(ROWS, 3);
        await k.frames(2500);
        await k.note('row 4 clicked');
        await k.shot('09-home-row-click');
        if (await k.box('.menu-close-trig')) {
          await k.click('.menu-close-trig');
          await k.frames(1200);
        }
      } else {
        await k.click(MAIN);
        await k.frames(1400);
      }
      await park(k, ctx);
      await k.frames(400);
      await k.note('closed');
      await k.shot('10-home-closed');

      // ---- /about (quick menu disabled there; the ticket shows the about bar)
      await k.goto('/about');
      await k.at(3);
      await park(k, ctx);
      await k.frames(300);
      await k.shot('11-about-settled');
      await k.click(MAIN);
      await k.frames(1400);
      await k.note('about main open');
      await k.shot('12-about-main-open');
      if (!mobile) {
        await k.hover(MAIN_LINKS, 2);
        await k.frames(700);
        await k.shot('13-about-main-hover-contact');
        await k.hover('[data-menu="mainpanel"] .menu-link-list.legal a', 0);
        await k.frames(700);
        await k.shot('14-about-main-hover-legal');
      }
      await k.click(MAIN);
      await k.frames(1400);
      await park(k, ctx);
      await k.frames(300);
      await k.note('about main closed');
      await k.shot('15-about-main-closed');

      // ---- /work in Footage mode: the left trigger opens the footage panel
      await k.goto('/work');
      await k.at(3.5);
      await k.click(TOGGLE_FOOTAGE);
      await k.frames(2200);
      await k.note('footage mode');
      await k.shot('16-work-footage-mode');
      if (!mobile) {
        await k.click(QUICK);
        await k.frames(1400);
        await k.note('footage panel');
        await k.shot('17-work-footage-panel');
        await k.hover('[data-menu="footagepanel"] .menu-footage-item a.footagemenu-cta-w', 0);
        await k.frames(700);
        await k.shot('18-work-footage-panel-hover');
        await k.click(QUICK);
        await k.frames(1400);
        await park(k, ctx);
        await k.frames(300);
        await k.note('footage panel closed');
        await k.shot('19-work-footage-panel-closed');
      }
    },
  },

  // Short clip of one open/close sequence (main panel on /about, plus the quick menu on desktop home is in nav-menus).
  'nav-clip': {
    video: true,
    viewports: ['1440x900', '390x844'],
    async run(ctx) {
      const k = await kit(ctx);
      await k.goto('/about');
      await k.at(2.5);
      await park(k, ctx);
      await k.frames(300);
      await k.shot('01-about');
      await k.click(MAIN);
      await k.frames(400);
      await k.shot('02-main-opening');
      await k.frames(1100);
      await k.shot('03-main-open');
      if (!ctx.mobile) {
        await k.hover(MAIN_LINKS, 0);
        await k.frames(600);
        await k.hover(MAIN_LINKS, 1);
        await k.frames(600);
        await k.hover(MAIN_LINKS, 2);
        await k.frames(700);
        await k.shot('04-main-hover');
      }
      await k.click(MAIN);
      await k.frames(400);
      await k.shot('05-main-closing');
      await k.frames(1200);
      await park(k, ctx);
      await k.frames(300);
      await k.shot('06-main-closed');
    },
  },

  // Nav link -> /work (Taxi transition) from /about, mid-transition frames + settled.
  'nav-to-work': {
    async run(ctx) {
      const k = await kit(ctx);
      await k.goto('/about');
      await k.at(2.5);
      await k.click(MAIN);
      await k.frames(1400);
      await k.shot('01-about-main-open');
      await k.navClick(`${MAIN_LINKS}[href="/work"]`);
      await k.frames(100);
      await k.shot('02-leave+0.1');
      await k.frames(500);
      await k.shot('03-leave+0.6');
      await k.frames(800);
      await k.shot('04-enter+1.4');
      await k.frames(600);
      await k.shot('05-enter+2.0');
      await k.frames(600);
      await k.shot('06-enter+2.6');
      await k.frames(2500);
      await k.note('work settled');
      await k.shot('07-work-settled');
    },
  },
};

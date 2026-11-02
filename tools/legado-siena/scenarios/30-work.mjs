// /work: horizontal film carousel (app.js class Pa extends Fa) + Poster/Footage toggle.
// Input model (from the bundle): mousedown on [data-slider="wrapper"] or the bottom edge
// ([data-slider="additionaltrigger"]) then mousemove -> target += dx * 0.005 (200px = 1 film);
// wheel (deltaY+deltaX, virtual-scroll) ; ArrowLeft/ArrowRight/Space ; PREV/NEXT hitboxes
// ([data-hitbox], left/right) through the custom cursor (class jn).
// "Lightbox": the [data-frames="lightbox"] anchors sit in .work-overl-coll (pointer-events:none),
// they are never clicked; their JSON feeds the WebGL footage strip shown in Footage mode
// (toggle -> P.FOOTAGE = index -> Ta.handleFootageView a.in 0->1 over 1.2s). Opening/closing the
// lightbox == toggling Footage on/off. In Footage mode the strip auto-scrolls (footageCurrent -=
// gl.time * 1e-4 per frame), which is deterministic under the kit's fake clock.
import { kit } from './10-home.mjs';

const TOGGLE = '[data-work="toggle"] button.work-toggle:not(.inactive)';
const ITEM = '[data-slider="item"]';

export default {
  'work-roll': {
    async run(ctx) {
      const { page, width: W, height: H, mobile } = ctx;
      const k = await kit(ctx);
      await k.goto('/work');
      await k.at(1.0);
      await k.shot('01-entering');
      await k.at(4.5);
      if (!mobile) await k.move(W * 0.5, H * 0.5, 1);
      await k.frames(500);
      await k.note('settled');
      await k.shot('02-settled');
      const cy = H * 0.5;
      if (mobile) {
        await k.swipe({ x: W * 0.8, y: cy }, { x: W * 0.2, y: cy });
        await k.frames(200);
        await k.shot('03-swiping');
        await k.frames(1800);
        await k.note('swipe left');
        await k.shot('04-swipe-left');
        await k.swipe({ x: W * 0.2, y: cy }, { x: W * 0.8, y: cy });
        await k.frames(2000);
        await k.note('swipe right');
        await k.shot('05-swipe-right');
        await k.click(TOGGLE);
        await k.frames(400);
        await k.shot('06-lightbox-opening');
        await k.frames(1800);
        await k.note('footage on');
        await k.shot('07-lightbox-open');
        await k.swipe({ x: W * 0.8, y: cy }, { x: W * 0.3, y: cy });
        await k.frames(1500);
        await k.shot('08-lightbox-swiped');
        await k.click(TOGGLE);
        await k.frames(400);
        await k.shot('09-lightbox-closing');
        await k.frames(1800);
        await k.note('poster again');
        await k.shot('10-lightbox-closed');
        return;
      }
      // hovers: current card, EXPLORE, neighbour card
      await k.hover(ITEM, 'center');
      await k.frames(800);
      await k.shot('03-hover-card');
      await k.hover('[data-slider="link"] .btn-no-mob .explore-btn-w');
      await k.frames(800);
      await k.shot('04-hover-explore');
      // drag left (-> next film) with a mid-drag frame, then drag right
      await k.drag({ x: W * 0.6, y: cy }, { x: W * 0.6 - 220, y: cy }, {
        mid: async () => {
          await k.frames(100);
          await k.shot('05-dragging');
        },
      });
      await k.frames(2200);
      await k.note('drag left');
      await k.shot('06-drag-left');
      await k.drag({ x: W * 0.4, y: cy }, { x: W * 0.4 + 220, y: cy });
      await k.frames(400);
      await k.drag({ x: W * 0.4, y: cy }, { x: W * 0.4 + 220, y: cy });
      await k.frames(2200);
      await k.note('drag right x2');
      await k.shot('07-drag-right');
      // wheel and keyboard
      await k.wheel(2400);
      await k.frames(250);
      await k.shot('08-wheel-moving');
      await k.frames(2000);
      await k.note('wheel');
      await k.shot('09-wheel');
      await k.key('ArrowRight');
      await k.frames(2000);
      await k.note('ArrowRight');
      await k.shot('10-key-right');
      // neighbour card + PREV/NEXT hitboxes (cursor states)
      await k.move(W * 0.93, cy);
      await k.frames(800);
      await k.shot('11-hover-right-edge');
      await k.hover('[data-hitbox="PREV"]');
      await k.frames(800);
      await k.shot('12-hover-prev');
      await k.click('[data-hitbox="PREV"]');
      await k.frames(2000);
      await k.note('click PREV');
      await k.shot('13-click-prev');
      // Footage mode == WebGL lightbox of [data-frames="lightbox"]
      await k.hover(TOGGLE);
      await k.frames(600);
      await k.shot('14-hover-toggle');
      await k.click(TOGGLE);
      await k.frames(400);
      await k.shot('15-lightbox-opening');
      await k.frames(1800);
      await k.note('footage on');
      await k.shot('16-lightbox-open');
      await k.drag({ x: W * 0.6, y: cy }, { x: W * 0.6 - 300, y: cy });
      await k.frames(1500);
      await k.shot('17-lightbox-dragged');
      await k.click(TOGGLE);
      await k.frames(400);
      await k.shot('18-lightbox-closing');
      await k.frames(1800);
      await k.move(W * 0.5, cy, 3);
      await k.frames(500);
      await k.note('poster again');
      await k.shot('19-lightbox-closed');
    },
  },
};

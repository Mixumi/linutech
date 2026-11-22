// Adapted from the TimeHabit launch cover. The paw and eyelids use the original artwork.
export function setupWave(canvas, artwork, reduceMotion) {
  const context = canvas.getContext('2d');
  if (!context) return { play() {}, stop() {} };
  // Separate the raised paw from the same drawing, overlapping the shoulder at the joint.
  const pawShape = new Path2D('M 135 566 H 283 L 303 625 L 325 693 L 348 737 L 362 771 L 366 831 H 135 Z');
  const bodyShape = new Path2D('M 135 566 H 283 L 303 625 L 325 693 L 348 737 L 362 771 L 357 790 L 344 808 H 135 Z');
  bodyShape.rect(0, 0, 1254, 1254);

  const duration = 1370;
  let frame;

  function ease(start, end, time) {
    const progress = Math.max(0, Math.min(1, (time - start) / (end - start)));
    return progress * progress * (3 - 2 * progress);
  }

  function drawEye(x, y, openness) {
    if (openness >= 1) return;

    // Paint over the original white dot only while animating the lid.
    context.fillStyle = '#010101';
    context.beginPath();
    context.ellipse(x, y, 18, 18, 0, 0, Math.PI * 2);
    context.fill();

    const closed = 1 - openness;
    const halfWidth = 16 * closed;
    context.strokeStyle = '#fff';
    context.lineWidth = 5 + 21 * openness;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(x - halfWidth, y - 3 * closed);
    context.quadraticCurveTo(x, y + 9 * closed, x + halfWidth, y - 3 * closed);
    context.stroke();
  }

  function draw(time, still = false) {
    const wake = ease(160, 430, time);
    const blink = ease(1030, 1100, time) - ease(1140, 1240, time);
    const wave = -0.29 * (ease(490, 670, time) - ease(690, 850, time))
      - 0.20 * (ease(850, 1000, time) - ease(1020, 1220, time));
    const angle = still ? 0 : 0.09 * (1 - wake) + wave;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.translate(320, 320 + (still ? 0 : 6 * (1 - wake)));
    context.scale(0.49, 0.49);
    context.translate(-590, -650);

    context.save();
    context.translate(351, 802);
    context.rotate(angle);
    context.translate(-351, -802);
    context.clip(pawShape);
    context.drawImage(artwork, 0, 0, 1254, 1254);
    context.restore();

    context.save();
    context.clip(bodyShape, 'evenodd');
    context.drawImage(artwork, 0, 0, 1254, 1254);
    context.restore();

    if (!still) {
      drawEye(537, 492, ease(175, 340, time) * (1 - blink));
      drawEye(778, 466, ease(270, 440, time) * (1 - blink));
    }
    context.restore();
  }

  function stop() {
    cancelAnimationFrame(frame);
    canvas.hidden = true;
  }

  function play() {
    stop();
    if (!artwork.complete || !artwork.naturalWidth || reduceMotion.matches) return;
    canvas.hidden = false;
    const start = performance.now();
    function tick(now) {
      const elapsed = Math.min(now - start, duration);
      draw(elapsed);
      if (elapsed < duration) {
        frame = requestAnimationFrame(tick);
      } else {
        // Keep the last frame in place so the resting pose does not jump.
        draw(duration, true);
      }
    }
    frame = requestAnimationFrame(tick);
  }
  reduceMotion.addEventListener('change', stop);
  return { play, stop };
}

document.addEventListener('DOMContentLoaded', () => {
  const galleries = document.querySelectorAll('[data-gallery]');

  galleries.forEach((gallery) => {
    const slides = Array.from(gallery.querySelectorAll('[data-gallery-slide]'));

    if (slides.length === 0) {
      return;
    }

    let dots = gallery.querySelector('[data-gallery-dots]');
    if (!dots && slides.length > 1) {
      dots = document.createElement('div');
      dots.className = 'device-gallery__dots';
      dots.setAttribute('data-gallery-dots', '');
      gallery.appendChild(dots);
    }

    let activeIndex = 0;
    let timerId = null;

    const updateActiveSlide = (index) => {
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-active', slideIndex === index);
      });

      if (dots) {
        const allDots = dots.querySelectorAll('[data-gallery-dot]');
        allDots.forEach((dot, dotIndex) => {
          dot.classList.toggle('is-active', dotIndex === index);
        });
      }

      activeIndex = index;
    };

    if (dots) {
      slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'device-gallery__dot';
        dot.setAttribute('data-gallery-dot', index.toString());
        dot.setAttribute('aria-label', `查看第 ${index + 1} 张屏幕`);
        dot.addEventListener('click', () => {
          stopAutoplay();
          updateActiveSlide(index);
          startAutoplay();
        });
        dots.appendChild(dot);
      });
    }

    const startAutoplay = () => {
      const shouldAutoplay = gallery.getAttribute('data-gallery-autoplay') !== 'false' && slides.length > 1;
      if (!shouldAutoplay || timerId) return;
      timerId = window.setInterval(() => {
        const nextIndex = (activeIndex + 1) % slides.length;
        updateActiveSlide(nextIndex);
      }, 5000);
    };

    const stopAutoplay = () => {
      if (timerId) {
        window.clearInterval(timerId);
        timerId = null;
      }
    };

    gallery.addEventListener('mouseenter', stopAutoplay);
    gallery.addEventListener('mouseleave', startAutoplay);
    gallery.addEventListener('focusin', stopAutoplay);
    gallery.addEventListener('focusout', startAutoplay);

    updateActiveSlide(activeIndex);
    startAutoplay();
  });
});

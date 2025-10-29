document.addEventListener('DOMContentLoaded', () => {
  initGalleries();
  initRevealAnimations();
});

function initGalleries() {
  const galleries = document.querySelectorAll('[data-gallery]');
  if (!galleries.length) {
    return;
  }

  galleries.forEach((gallery) => {
    const slides = Array.from(gallery.querySelectorAll('[data-gallery-slide]'));
    if (!slides.length) {
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
      if (!shouldAutoplay || timerId) {
        return;
      }

      const interval = Number(gallery.getAttribute('data-gallery-interval')) || 5000;
      timerId = window.setInterval(() => {
        const nextIndex = (activeIndex + 1) % slides.length;
        updateActiveSlide(nextIndex);
      }, interval);
    };

    const stopAutoplay = () => {
      if (!timerId) {
        return;
      }
      window.clearInterval(timerId);
      timerId = null;
    };

    gallery.addEventListener('mouseenter', stopAutoplay);
    gallery.addEventListener('mouseleave', startAutoplay);
    gallery.addEventListener('focusin', stopAutoplay);
    gallery.addEventListener('focusout', startAutoplay);

    updateActiveSlide(activeIndex);
    startAutoplay();
  });
}

function initRevealAnimations() {
  const animatedElements = document.querySelectorAll('[data-animate]');
  if (!animatedElements.length) {
    return;
  }

  animatedElements.forEach((element) => {
    const delay = element.getAttribute('data-animate-delay');
    if (delay) {
      element.style.setProperty('--delay', delay);
    } else if (!element.style.getPropertyValue('--delay')) {
      element.style.setProperty('--delay', '0s');
    }
  });

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealImmediately = () => {
    animatedElements.forEach((element) => {
      element.classList.add('is-visible');
    });
  };

  if (mediaQuery.matches) {
    revealImmediately();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.2,
    }
  );

  animatedElements.forEach((element) => {
    observer.observe(element);
  });

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', (event) => {
      if (event.matches) {
        observer.disconnect();
        revealImmediately();
      }
    });
  }
}

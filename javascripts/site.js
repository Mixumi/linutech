const THEME_STORAGE_KEY = 'linutech-theme';
const themeEventName = 'linutech:themechange';

applyTheme(getInitialTheme(), false);

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initGalleries();
  initRevealAnimations();
});

function getStoredTheme() {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    return null;
  }
}

function getInitialTheme() {
  const stored = getStoredTheme();
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  if (prefersLight) {
    return 'light';
  }

  return 'light';
}

function applyTheme(theme, shouldPersist = true) {
  const resolved = theme === 'light' ? 'light' : 'dark';
  const root = document.documentElement;
  root.setAttribute('data-theme', resolved);
  root.style.colorScheme = resolved;

  if (shouldPersist) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, resolved);
    } catch (error) {
      /* ignore storage errors */
    }
  }

  window.dispatchEvent(
    new CustomEvent(themeEventName, {
      detail: {
        theme: resolved,
      },
    })
  );
}

const lightPreferenceQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)');
if (lightPreferenceQuery && typeof lightPreferenceQuery.addEventListener === 'function') {
  lightPreferenceQuery.addEventListener('change', (event) => {
    if (!getStoredTheme()) {
      applyTheme(event.matches ? 'light' : 'dark', false);
    }
  });
}

function initThemeToggle() {
  const toggle = document.querySelector('[data-theme-toggle]');
  if (!toggle) {
    return;
  }

  const icon = toggle.querySelector('[data-theme-toggle-icon]');
  const label = toggle.querySelector('[data-theme-toggle-label]');

  const updateButtonState = (theme) => {
    const isLight = theme === 'light';
    toggle.dataset.themeState = isLight ? 'light' : 'dark';
    toggle.setAttribute('aria-pressed', isLight ? 'true' : 'false');
    toggle.setAttribute('aria-label', isLight ? '切换为深色模式' : '切换为浅色模式');

    if (icon) {
      icon.textContent = isLight ? '☀️' : '🌙';
    }

    if (label) {
      label.textContent = isLight ? '晨光模式' : '夜航模式';
    }
  };

  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  updateButtonState(currentTheme);

  toggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
    launchToggleCelebration(toggle);
  });

  window.addEventListener(themeEventName, (event) => {
    updateButtonState(event.detail.theme);
  });
}

function launchToggleCelebration(container) {
  const sparkCount = 3;

  for (let index = 0; index < sparkCount; index += 1) {
    window.setTimeout(() => {
      const spark = document.createElement('span');
      spark.className = 'theme-toggle__spark';
      spark.style.setProperty('--spark-x', `${Math.round(Math.random() * 40 - 20)}px`);
      spark.style.setProperty('--spark-y', `${Math.round(Math.random() * 26 - 34)}px`);
      container.appendChild(spark);
      window.setTimeout(() => {
        spark.remove();
      }, 620);
    }, index * 70);
  }
}

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

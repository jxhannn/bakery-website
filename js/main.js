(function(){
  const pages = Array.from(document.querySelectorAll('.page-view'));
  const pageLinks = Array.from(document.querySelectorAll('[data-page-link]'));
  const validPages = new Set(pages.map(page => page.dataset.page));

  function setPage(pageName, shouldScroll){
    const page = validPages.has(pageName) ? pageName : 'home';
    pages.forEach(section => section.classList.toggle('active', section.dataset.page === page));
    pageLinks.forEach(link => {
      const isActive = link.dataset.pageLink === page;
      link.classList.toggle('active', isActive);
      if (link.classList.contains('nav-link') || link.classList.contains('mobile-nav-link')) {
        if (isActive) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      }
    });
    document.body.className = 'view-' + page;
    document.title = (page === 'home' ? '' : page.charAt(0).toUpperCase() + page.slice(1) + ' | ') + 'Kabelo’s Tasty Bakery';
    if (window.location.hash !== '#' + page && (shouldScroll || window.location.hash)) {
      history.replaceState(null, '', '#' + page);
    }
    if (shouldScroll) {
      window.scrollTo({top:0, behavior:'smooth'});
    } else {
      window.scrollTo(0, 0);
    }
  }

  pageLinks.forEach(link => {
    link.addEventListener('click', event => {
      const target = link.dataset.pageLink;
      if(!target) return;
      event.preventDefault();
      setPage(target, true);
    });
  });



  const mainNav = document.querySelector('.main-nav');
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mobileNavPanel = document.querySelector('.mobile-nav-panel');

  function closeMobileMenu(){
    if(!mainNav || !mobileMenuToggle) return;
    mainNav.classList.remove('mobile-menu-open');
    mobileMenuToggle.setAttribute('aria-expanded', 'false');
  }

  if (mainNav && mobileMenuToggle && mobileNavPanel) {
    mobileMenuToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = mainNav.classList.toggle('mobile-menu-open');
      mobileMenuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    mobileNavPanel.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    document.addEventListener('click', (event) => {
      if (!mainNav.contains(event.target)) closeMobileMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMobileMenu();
    });

    pageLinks.forEach(link => {
      if (link.classList.contains('mobile-nav-link')) {
        link.addEventListener('click', closeMobileMenu);
      }
    });
  }

  window.addEventListener('hashchange', () => setPage(location.hash.replace('#',''), true));
  setPage(location.hash.replace('#','') || 'home', false);
  window.addEventListener('load', () => {
    if (!location.hash || location.hash === '#home') window.scrollTo(0, 0);
  });

  const carousel = document.querySelector('[data-carousel]');
  const slides = carousel ? Array.from(carousel.querySelectorAll('.hero-slide')) : [];
  const dots = Array.from(document.querySelectorAll('.carousel-dots button'));
  let index = 0;
  let timer;

  function showSlide(next){
    if(!slides.length) return;
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  }

  function start(){
    if(slides.length < 2) return;
    window.clearInterval(timer);
    timer = window.setInterval(() => showSlide(index + 1), 5000);
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      window.clearInterval(timer);
      showSlide(i);
      start();
    });
  });

  start();

  const form = document.querySelector('.contact-form');
  if(form){
    form.addEventListener('submit', function(event){
      event.preventDefault();
      const data = new FormData(form);
      const name = (data.get('name') || '').trim();
      const phone = (data.get('phone') || '').trim();
      const date = (data.get('date') || '').trim();
      const message = (data.get('message') || '').trim();
      const text = `Hi Kabelo, I would like to place an order.${name ? `\nName: ${name}` : ''}${phone ? `\nPhone: ${phone}` : ''}${date ? `\nEvent date: ${date}` : ''}${message ? `\nMessage: ${message}` : ''}`;
      window.location.href = 'https://wa.me/27762701921?text=' + encodeURIComponent(text);
    });
  }

  // Gallery: Pinterest-style masonry with row-first ordering and no image cropping.
  // The previous fixed-height grid cropped products. This version keeps each
  // image at its real aspect ratio and distributes them across visual columns
  // so the first row appears first, then the next row down.
  const gallery = document.querySelector('.masonry-gallery');
  if (gallery) {
    const originalImages = Array.from(gallery.querySelectorAll('img'));
    const getCols = () => {
      const width = window.innerWidth;
      if (width <= 380) return 1;
      if (width <= 640) return 2;
      if (width <= 860) return 3;
      if (width <= 1100) return 4;
      return 5;
    };

    let currentCols = 0;

    function buildMasonryColumns(force) {
      const cols = getCols();
      if (!force && cols === currentCols && gallery.querySelector('.masonry-column')) {
        return;
      }
      currentCols = cols;
      gallery.innerHTML = '';
      gallery.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

      const columns = Array.from({ length: cols }, () => {
        const column = document.createElement('div');
        column.className = 'masonry-column';
        gallery.appendChild(column);
        return column;
      });

      originalImages.forEach((img, index) => {
        img.loading = 'lazy';
        img.decoding = 'async';
        img.style.height = 'auto';
        img.style.maxHeight = 'none';
        img.style.objectFit = 'contain';
        img.style.setProperty('--gallery-delay', `${Math.floor(index / cols) * 70 + (index % cols) * 12}ms`);
        columns[index % cols].appendChild(img);
      });

      gallery.classList.remove('gallery-row-load');
      void gallery.offsetWidth;
      gallery.classList.add('gallery-row-load');
    }

    buildMasonryColumns(true);
    window.addEventListener('resize', () => buildMasonryColumns(false));
    pageLinks.forEach(link => {
      if (link.dataset.pageLink === 'gallery') {
        link.addEventListener('click', () => setTimeout(() => buildMasonryColumns(true), 80));
      }
    });
  }

})();

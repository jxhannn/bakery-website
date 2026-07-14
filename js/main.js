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
    // Build/rebuild gallery only while the gallery page is visible.
    // Creating lazy images inside display:none pages breaks loads in Edge/Chrome.
    if (page === 'gallery' && typeof window.__rebuildGallery === 'function') {
      requestAnimationFrame(() => window.__rebuildGallery(true));
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

  // Gallery: Pinterest-style masonry (row-first, no crop).
  // Images are only injected when the gallery page is active so browsers do not
  // drop lazy/eager loads that started under display:none.
  const gallery = document.querySelector('.masonry-gallery');
  if (gallery) {
    const imageData = Array.from(gallery.querySelectorAll('img')).map((img, i) => ({
      src: img.getAttribute('src'),
      alt: (img.getAttribute('alt') || ("Kabelo's Tasty Bakery gallery image " + (i + 1)))
        .replace(/\s*\(unavailable\)\s*$/i, "")
        .trim(),
      width: img.getAttribute('width') || '',
      height: img.getAttribute('height') || ''
    }));

    // Clear static HTML; JS owns the layout once the page opens.
    gallery.innerHTML = '';

    const getCols = () => {
      const width = window.innerWidth;
      if (width <= 380) return 1;
      if (width <= 640) return 2;
      if (width <= 860) return 3;
      if (width <= 1100) return 4;
      return 5;
    };

    let currentCols = 0;
    let built = false;

    function buildMasonryColumns(force) {
      // Never build while the gallery page is hidden.
      const galleryPage = document.querySelector('.page-view[data-page="gallery"]');
      if (galleryPage && !galleryPage.classList.contains('active')) {
        return;
      }

      const cols = getCols();
      if (!force && built && cols === currentCols && gallery.querySelector('.masonry-column')) {
        return;
      }
      currentCols = cols;
      built = true;
      gallery.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

      const frag = document.createDocumentFragment();
      const columns = Array.from({ length: cols }, () => {
        const column = document.createElement('div');
        column.className = 'masonry-column';
        frag.appendChild(column);
        return column;
      });

      imageData.forEach((data, index) => {
        if (!data.src) return;
        const img = document.createElement('img');
        // Cache-bust once so old broken browser cache entries are skipped.
        img.src = data.src + (data.src.indexOf('?') === -1 ? '?v=20260714b' : '');
        img.alt = data.alt;
        if (data.width) img.setAttribute('width', data.width);
        if (data.height) img.setAttribute('height', data.height);
        img.decoding = 'async';
        // Eager for all: only 42 images (~3.5MB). Avoids Edge lazy-load bugs.
        img.loading = 'eager';
        if (index < cols) img.fetchPriority = 'high';
        img.style.height = 'auto';
        img.style.maxHeight = 'none';
        img.style.objectFit = 'contain';
        columns[index % cols].appendChild(img);
      });

      gallery.innerHTML = '';
      gallery.appendChild(frag);
    }

    window.__rebuildGallery = buildMasonryColumns;
    // If user landed on #gallery, build now (page already active).
    if (document.body.classList.contains('view-gallery')) {
      buildMasonryColumns(true);
    }
    window.addEventListener('resize', () => {
      if (document.body.classList.contains('view-gallery')) {
        buildMasonryColumns(false);
      }
    });
  }

})();

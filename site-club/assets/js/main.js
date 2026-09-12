// JTSRF CLUB — small progressive enhancements
(function () {
  // Mobile nav
  var toggle = document.querySelector('.nav__toggle');
  var links = document.querySelector('.nav__links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? '✕' : '☰';
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && links.classList.contains('open')) {
        links.classList.remove('open');
        toggle.textContent = '☰';
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // FAQ: keep one open at a time
  var faqItems = document.querySelectorAll('.faq details');
  faqItems.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) {
        faqItems.forEach(function (o) { if (o !== d) o.open = false; });
      }
    });
  });

  // Current year in footer
  var y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();

  // Maintenance library — search + category filter
  var search = document.getElementById('tutSearch');
  var chipBox = document.getElementById('tutChips');
  if (search && chipBox) {
    var libSection = search.closest('section');
    var clearBtn = document.getElementById('tutClear');
    var countEl = document.getElementById('tutCount');
    var emptyEl = document.getElementById('tutEmpty');
    var resultsGrid = document.getElementById('tutResults');
    var sourceGrids = Array.prototype.slice.call(libSection.querySelectorAll('.tut-grid:not(.tut-results)'));
    var sources = Array.prototype.slice.call(libSection.querySelectorAll('.tut-source'));
    var chips = Array.prototype.slice.call(chipBox.querySelectorAll('.chip'));
    var activeCat = 'all';

    // collect cards in document order, remembering each one's home row + search text
    var cards = [];
    sourceGrids.forEach(function (grid) {
      Array.prototype.slice.call(grid.querySelectorAll('.tut')).forEach(function (card) {
        var tag = card.querySelector('.tut__tag');
        card._home = grid;
        card._text = (
          card.textContent + ' ' +
          (card.dataset.tags || '') + ' ' +
          (tag ? tag.textContent : '')
        ).toLowerCase().replace(/\s+/g, ' ');
        card._cats = (card.dataset.cat || '').split(' ');
        cards.push(card);
      });
    });

    function apply() {
      var q = search.value.trim().toLowerCase();
      var terms = q ? q.split(/\s+/) : [];
      var filtering = !!q || activeCat !== 'all';

      // reset — every card back in its own source row, nothing hidden
      cards.forEach(function (card) {
        card.hidden = false;
        if (card.parentNode !== card._home) card._home.appendChild(card);
      });

      var matches = !filtering ? [] : cards.filter(function (card) {
        var okCat = activeCat === 'all' || card._cats.indexOf(activeCat) !== -1;
        return okCat && terms.every(function (t) { return card._text.indexOf(t) !== -1; });
      });

      // when filtering, collapse the source rows and pool every match into one grid
      sources.forEach(function (s) { s.hidden = filtering; });
      sourceGrids.forEach(function (g) { g.hidden = filtering; });
      if (filtering) {
        matches.forEach(function (card) { resultsGrid.appendChild(card); });
      }
      resultsGrid.hidden = !filtering || matches.length === 0;

      libSection.classList.toggle('is-filtering', filtering);
      clearBtn.hidden = !q;

      var total = filtering ? matches.length : cards.length;
      emptyEl.hidden = !(filtering && total === 0);

      if (filtering) {
        countEl.hidden = false;
        countEl.textContent = total + (total === 1 ? ' guide' : ' guides') +
          (activeCat === 'all' ? '' : ' · ' + chipLabel(activeCat)) +
          (q ? ' · “' + search.value.trim() + '”' : '');
      } else {
        countEl.hidden = true;
      }
    }

    function chipLabel(cat) {
      var c = chips.filter(function (x) { return x.dataset.cat === cat; })[0];
      return c ? c.textContent : cat;
    }

    chipBox.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      activeCat = chip.dataset.cat;
      chips.forEach(function (c) { c.classList.toggle('is-active', c === chip); });
      apply();
    });

    search.addEventListener('input', apply);
    clearBtn.addEventListener('click', function () {
      search.value = '';
      search.focus();
      apply();
    });

    // deep-link: ?q=spark+plug  /  ?cat=engine
    var params = new URLSearchParams(location.search);
    if (params.get('q')) search.value = params.get('q');
    if (params.get('cat')) {
      var pre = chips.filter(function (c) { return c.dataset.cat === params.get('cat'); })[0];
      if (pre) {
        activeCat = pre.dataset.cat;
        chips.forEach(function (c) { c.classList.toggle('is-active', c === pre); });
      }
    }
    apply();
  }

  // Spot submission modal
  var spotModal = document.getElementById('spotModal');
  var openSpotBtns = document.querySelectorAll('[data-open-modal="spotModal"]');
  var closeSpotBtn = document.getElementById('spotModalClose');
  var spotForm = document.getElementById('spotForm');
  if (spotModal && openSpotBtns.length && spotForm) {
    openSpotBtns.forEach(function (btn) {
      btn.addEventListener('click', function () { spotModal.showModal(); });
    });
    if (closeSpotBtn) closeSpotBtn.addEventListener('click', function () { spotModal.close(); });
    spotModal.addEventListener('click', function (e) {
      if (e.target === spotModal) spotModal.close(); // click on backdrop
    });

    spotForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = spotForm.elements;
      var name = f.spotName.value.trim();
      var lines = [
        'Spot name / area: ' + name,
        'How you launch: ' + f.spotLaunch.value.trim(),
        'Parking: ' + f.spotParking.value.trim(),
        'Water (protected/open, depth, hazards): ' + f.spotWater.value.trim(),
        'Best conditions: ' + f.spotConditions.value.trim(),
        'Rules or access notes: ' + f.spotRules.value.trim(),
        'Map pin or location: ' + f.spotPin.value.trim(),
        'Your name (for credit, optional): ' + f.spotSubmitter.value.trim()
      ];
      var subject = 'Spot submission' + (name ? ': ' + name : '');
      var body = lines.join('\n');
      var mailto = 'mailto:hello@jtsrfclub.com?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
      window.location.href = mailto;
      spotModal.close();
      spotForm.reset();
    });
  }
})();

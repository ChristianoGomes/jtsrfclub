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
    var chips = Array.prototype.slice.call(chipBox.querySelectorAll('.chip[data-cat]'));
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
      if (!chip || !chip.dataset.cat) return; // e.g. the Owner's manuals link
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

  // Guide + board pages — sidebar index (search + categories) and previous / next links.
  // Each list is read from its library page (maintenance.html / boards.html), so a new
  // card there shows up here too.
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function searchText(parts) {
    return parts.join(' ').toLowerCase().replace(/\s+/g, ' ');
  }

  function readGuides(doc) {
    var labels = {};
    var order = [];
    doc.querySelectorAll('#tutChips .chip[data-cat]').forEach(function (c) {
      if (c.dataset.cat === 'all') return;
      labels[c.dataset.cat] = c.textContent.trim();
      order.push(c.dataset.cat);
    });
    var search = doc.getElementById('tutSearch');
    var lib = search && search.closest('section');
    if (!lib) return null;
    var items = [];
    var source = '';
    lib.querySelectorAll('.tut-source, .tut-grid:not(.tut-results) .tut').forEach(function (card) {
      if (card.classList.contains('tut-source')) {
        var h = card.querySelector('h3');
        source = h ? h.textContent.trim() : '';
        return;
      }
      var link = card.querySelector('h3 a');
      if (!link) return;
      var cats = (card.dataset.cat || '').split(' ').filter(Boolean);
      var p = card.querySelector('p');
      items.push({
        href: link.getAttribute('href'),
        title: link.textContent.trim(),
        group: cats[0] || 'other',
        sub: source,
        text: searchText([
          link.textContent, card.dataset.tags || '', p ? p.textContent : '', source,
          cats.map(function (c) { return labels[c] || c; }).join(' ')
        ])
      });
    });
    return { items: items, order: order, labels: labels };
  }

  function readBoards(doc) {
    var lineup = doc.querySelector('.board-lineup');
    if (!lineup) return null;
    var labels = {};
    var order = [];
    var items = [];
    var group = '';
    lineup.querySelectorAll('.board-lineup__group, .board-card').forEach(function (node) {
      if (node.classList.contains('board-lineup__group')) {
        var label = node.textContent.trim();
        group = /electric/i.test(label) ? 'electric' : /gas/i.test(label) ? 'gas' : label.toLowerCase();
        labels[group] = label;
        order.push(group);
        return;
      }
      var link = node.querySelector('h3 a');
      if (!link) return; // earlier models have no page
      var kicker = node.querySelector('.board-card__kicker');
      var p = node.querySelector('p');
      var img = node.querySelector('img');
      items.push({
        href: link.getAttribute('href'),
        title: link.textContent.trim(),
        group: group,
        sub: kicker ? kicker.textContent.trim() : '',
        img: img ? img.getAttribute('src') : '',
        text: searchText([link.textContent, kicker ? kicker.textContent : '', p ? p.textContent : '', labels[group] || ''])
      });
    });
    return { items: items, order: order, labels: labels };
  }

  function pageIndex(cfg) {
    function load() {
      try {
        var cached = sessionStorage.getItem(cfg.cacheKey);
        if (cached) return Promise.resolve(JSON.parse(cached));
      } catch (e) {}
      return fetch(cfg.source)
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
        .then(function (html) {
          var data = cfg.parse(new DOMParser().parseFromString(html, 'text/html'));
          if (data) { try { sessionStorage.setItem(cfg.cacheKey, JSON.stringify(data)); } catch (e) {} }
          return data;
        });
    }

    load().then(function (data) {
      if (!data || !data.items.length) return;
      // compare by bare page name: hosts may serve /spark-plug-tutorial for spark-plug-tutorial.html
      var pageKey = function (url) {
        return (url.split(/[?#]/)[0].split('/').pop() || 'index').replace(/\.html$/, '');
      };
      var page = pageKey(location.pathname);
      var items = data.items;
      var idx = -1;
      items.forEach(function (g, i) { if (pageKey(g.href) === page) idx = i; });
      // library pages (no mount) get the sidebar only; item pages need to be in the list
      if (idx === -1 && cfg.mount) return;

      // ---- previous / next ----
      var mid = null;
      if (cfg.mount) {
        var pager = el('nav', 'guide-pager');
        pager.setAttribute('aria-label', 'More ' + cfg.plural);
        var pagerLink = function (g, dir) {
          if (!g) return el('span', 'guide-pager__spacer');
          var a = el('a', 'guide-pager__link guide-pager__link--' + dir);
          a.href = g.href;
          a.rel = dir;
          a.appendChild(el('span', 'guide-pager__label', dir === 'prev' ? '← Previous ' + cfg.noun : 'Next ' + cfg.noun + ' →'));
          a.appendChild(el('span', 'guide-pager__title', g.title));
          return a;
        };
        pager.appendChild(pagerLink(items[idx - 1], 'prev'));
        mid = el('button', 'guide-pager__index');
        mid.type = 'button';
        mid.appendChild(el('span', 'guide-pager__label', cfg.Noun + ' ' + (idx + 1) + ' of ' + items.length));
        mid.appendChild(el('span', 'guide-pager__title', '☰ All ' + cfg.plural));
        pager.appendChild(mid);
        pager.appendChild(pagerLink(items[idx + 1], 'next'));
        cfg.mount(pager);
      }

      // ---- sidebar ----
      var fab = el('button', 'guide-fab');
      fab.type = 'button';
      fab.setAttribute('aria-controls', 'pageIndex');
      fab.setAttribute('aria-expanded', 'false');
      fab.innerHTML = '<span aria-hidden="true">☰</span> ' + cfg.Noun + ' index';

      var scrim = el('div', 'guide-scrim');
      scrim.hidden = true;

      var panel = el('aside', 'guide-index');
      panel.id = 'pageIndex';
      panel.setAttribute('aria-label', cfg.Noun + ' index');
      panel.setAttribute('aria-hidden', 'true');
      panel.inert = true;

      var head = el('div', 'guide-index__head');
      head.appendChild(el('h2', 'guide-index__heading', cfg.Noun + ' index'));
      var close = el('button', 'guide-index__close', '×');
      close.type = 'button';
      close.setAttribute('aria-label', 'Close ' + cfg.noun + ' index');
      head.appendChild(close);
      panel.appendChild(head);

      var searchWrap = el('div', 'tut-filter__search guide-index__search');
      searchWrap.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
      var input = el('input');
      input.type = 'search';
      input.placeholder = 'Search ' + cfg.plural + '…';
      input.autocomplete = 'off';
      input.setAttribute('aria-label', 'Search ' + cfg.plural);
      searchWrap.appendChild(input);
      var clear = el('button', 'tut-filter__clear', '×');
      clear.type = 'button';
      clear.setAttribute('aria-label', 'Clear search');
      clear.hidden = true;
      searchWrap.appendChild(clear);
      panel.appendChild(searchWrap);

      var count = el('p', 'guide-index__count');
      panel.appendChild(count);

      var list = el('div', 'guide-index__list');
      panel.appendChild(list);
      var empty = el('p', 'guide-index__empty', 'No ' + cfg.plural + ' match that search.');
      empty.hidden = true;
      list.appendChild(empty);

      // group by category, in the library page's order
      var groups = {};
      items.forEach(function (g, i) {
        if (!groups[g.group]) groups[g.group] = [];
        groups[g.group].push({ g: g, i: i });
      });
      var order = data.order.filter(function (c) { return groups[c]; })
        .concat(Object.keys(groups).filter(function (c) { return data.order.indexOf(c) === -1; }));

      var groupEls = [];
      var currentLink = null;
      order.forEach(function (key) {
        var box = el('div', 'guide-index__group');
        box.dataset.cat = key;
        var h = el('h3', 'guide-index__cat');
        h.appendChild(el('span', null, data.labels[key] || 'Other'));
        var n = el('span', 'guide-index__n');
        h.appendChild(n);
        box.appendChild(h);
        var ul = el('ul');
        var rows = groups[key].map(function (entry) {
          var li = el('li');
          var a = el('a', 'guide-index__link');
          a.href = entry.g.href;
          if (entry.g.img) {
            a.classList.add('guide-index__link--thumb');
            var img = el('img', 'guide-index__thumb');
            img.src = entry.g.img;
            img.alt = '';
            img.loading = 'lazy';
            a.appendChild(img);
          }
          var words = el('span', 'guide-index__words');
          words.appendChild(el('span', 'guide-index__title', entry.g.title));
          if (entry.g.sub) words.appendChild(el('span', 'guide-index__source', entry.g.sub));
          a.appendChild(words);
          if (entry.i === idx) {
            a.classList.add('is-current');
            a.setAttribute('aria-current', 'page');
            currentLink = a;
          }
          li.appendChild(a);
          ul.appendChild(li);
          return { li: li, g: entry.g };
        });
        box.appendChild(ul);
        list.appendChild(box);
        groupEls.push({ n: n, box: box, rows: rows });
      });

      function plural(n) { return n + ' ' + (n === 1 ? cfg.noun : cfg.plural); }
      function filter() {
        var q = input.value.trim().toLowerCase();
        var terms = q ? q.split(/\s+/) : [];
        var total = 0;
        groupEls.forEach(function (grp) {
          var shown = 0;
          grp.rows.forEach(function (row) {
            var ok = terms.every(function (t) { return row.g.text.indexOf(t) !== -1; });
            row.li.hidden = !ok;
            if (ok) shown++;
          });
          grp.box.hidden = shown === 0;
          grp.n.textContent = shown;
          total += shown;
        });
        clear.hidden = !q;
        empty.hidden = total !== 0;
        count.textContent = q
          ? plural(total) + ' match “' + input.value.trim() + '”'
          : plural(items.length) + ' in ' + groupEls.length + ' categories';
      }
      input.addEventListener('input', filter);
      clear.addEventListener('click', function () { input.value = ''; input.focus(); filter(); });
      filter();

      document.body.appendChild(fab);
      document.body.appendChild(scrim);
      document.body.appendChild(panel);

      var lastFocus = null;
      function setOpen(open) {
        panel.classList.toggle('is-open', open);
        panel.setAttribute('aria-hidden', open ? 'false' : 'true');
        panel.inert = !open;
        scrim.hidden = !open;
        fab.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.documentElement.classList.toggle('guide-index-open', open);
        if (open) {
          lastFocus = document.activeElement;
          if (currentLink && !input.value) {
            list.scrollTop = currentLink.offsetTop - list.clientHeight / 2;
          }
          setTimeout(function () { input.focus({ preventScroll: true }); }, 50);
        } else if (lastFocus) {
          lastFocus.focus({ preventScroll: true });
        }
      }
      fab.addEventListener('click', function () { setOpen(!panel.classList.contains('is-open')); });
      if (mid) mid.addEventListener('click', function () { setOpen(true); });
      close.addEventListener('click', function () { setOpen(false); });
      scrim.addEventListener('click', function () { setOpen(false); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && panel.classList.contains('is-open')) setOpen(false);
      });
    }).catch(function () { /* index unavailable (e.g. opened from file://) — page still works */ });
  }

  if (window.fetch && window.DOMParser) {
    var guideDoc = document.querySelector('.tutorial-doc');
    var boardCta = document.querySelector('.cta-band');
    if (document.getElementById('tutSearch')) {
      pageIndex({
        source: 'maintenance.html', cacheKey: 'jtsrf-guide-index-v2', parse: readGuides,
        noun: 'guide', Noun: 'Guide', plural: 'guides'
      });
    } else if (guideDoc) {
      pageIndex({
        source: 'maintenance.html', cacheKey: 'jtsrf-guide-index-v2', parse: readGuides,
        noun: 'guide', Noun: 'Guide', plural: 'guides',
        mount: function (pager) { guideDoc.appendChild(pager); }
      });
    } else if (/^board-[^/]*$/.test(location.pathname.split('/').pop().replace(/\.html$/, '')) && boardCta) {
      pageIndex({
        source: 'boards.html', cacheKey: 'jtsrf-board-index-v2', parse: readBoards,
        noun: 'board', Noun: 'Board', plural: 'boards',
        mount: function (pager) {
          var sec = el('section', 'board-pager');
          var wrap = el('div', 'container');
          wrap.appendChild(pager);
          sec.appendChild(wrap);
          boardCta.parentNode.insertBefore(sec, boardCta);
        }
      });
    }
  }

  // Fuel mixing guide — 50:1 oil calculator
  var mixAmount = document.getElementById('mixAmount');
  var mixUnit = document.getElementById('mixUnit');
  if (mixAmount && mixUnit) {
    var mixOz = document.getElementById('mixOz');
    var mixMl = document.getElementById('mixMl');
    var updateMix = function () {
      var amount = parseFloat(mixAmount.value);
      if (isNaN(amount) || amount <= 0) {
        mixOz.textContent = '— oz';
        mixMl.textContent = '— ml';
        return;
      }
      var oilMl = (mixUnit.value === 'gal' ? amount * 3785.41 : amount * 1000) / 50;
      var oilOz = oilMl / 29.5735;
      mixOz.textContent = (oilOz >= 10 ? oilOz.toFixed(1) : oilOz.toFixed(2)) + ' oz';
      mixMl.textContent = Math.round(oilMl) + ' ml';
    };
    mixAmount.addEventListener('input', updateMix);
    mixUnit.addEventListener('change', updateMix);
    updateMix();
  }

  (function () {
    // Board pages — "Enquire with us" opens a choice of WhatsApp, text or email
  (function () {
    var enquireButtons = Array.prototype.slice.call(document.querySelectorAll('[data-enquire]'));
    if (!enquireButtons.length) return;
    var PHONE = '13058965931', PHONE_PRETTY = '305-896-5931', EMAIL = 'info@jtsrfclub.com';
    var sheet = null, titleEl = null, listEl = null, lastFocus = null;

    var closeSheet = function () {
      if (sheet) sheet.hidden = true;
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    };

    var openSheet = function (board, button) {
      var message = "Hi JTSRF CLUB — I'm interested in the " + board + ".";
      if (!sheet) {
        sheet = el('div', 'enquire');
        sheet.innerHTML =
          '<div class="enquire__panel" role="dialog" aria-label="Contact JTSRF CLUB">' +
            '<button type="button" class="enquire__close" aria-label="Close">&times;</button>' +
            '<span class="eyebrow">Get in touch</span>' +
            '<h3 class="enquire__title"></h3>' +
            '<p class="enquire__lead">Pick whichever suits you — your message is written for you, and you can change it before sending.</p>' +
            '<div class="enquire__list"></div>' +
            '<p class="enquire__note">Miami time, most days. We answer WhatsApp fastest.</p>' +
          '</div>';
        document.body.appendChild(sheet);
        titleEl = sheet.querySelector('.enquire__title');
        listEl = sheet.querySelector('.enquire__list');
        sheet.addEventListener('click', function (e) { if (e.target === sheet) closeSheet(); });
        sheet.querySelector('.enquire__close').addEventListener('click', closeSheet);
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape' && sheet && !sheet.hidden) closeSheet();
        });
      }
      titleEl.textContent = 'Ask us about the ' + board;
      listEl.innerHTML =
        '<a class="enquire__option" target="_blank" rel="noopener" href="https://wa.me/' + PHONE + '?text=' + encodeURIComponent(message) + '">' +
          '<span class="enquire__icon enquire__icon--wa" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.02ZM12.04 20.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 0 1-1.26-4.4c0-4.54 3.7-8.23 8.24-8.23a8.2 8.2 0 0 1 5.82 2.41 8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.25 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.43-.14-.01-.31-.01-.47-.01a.9.9 0 0 0-.65.31c-.22.24-.86.84-.86 2.06s.88 2.39 1 2.55c.12.16 1.73 2.64 4.19 3.7.58.25 1.04.4 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.1-.22-.16-.47-.28Z"/></svg></span>' +
          '<span><strong>WhatsApp</strong><em>' + PHONE_PRETTY + ' — usually the fastest reply</em></span></a>' +
        '<a class="enquire__option" href="sms:+' + PHONE + '?&body=' + encodeURIComponent(message) + '">' +
          '<span class="enquire__icon enquire__icon--sms" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4l4 4 4-4h4a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"/></svg></span>' +
          '<span><strong>Text message</strong><em>' + PHONE_PRETTY + '</em></span></a>' +
        '<a class="enquire__option" href="mailto:' + EMAIL + '?subject=' + encodeURIComponent('Interested in the ' + board) + '&body=' + encodeURIComponent(message + '\n\n') + '">' +
          '<span class="enquire__icon enquire__icon--mail" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm1.4 2L12 12.5 19.6 7H4.4Z"/></svg></span>' +
          '<span><strong>Email</strong><em>' + EMAIL + '</em></span></a>';
      lastFocus = button;
      sheet.hidden = false;
      setTimeout(function () { sheet.querySelector('.enquire__option').focus(); }, 30);
    };

    enquireButtons.forEach(function (button) {
      button.addEventListener('click', function () { openSheet(button.dataset.enquire, button); });
    });
  })();

  // FAQ — filter questions as you type
  (function () {
    var faqSearch = document.getElementById('faqSearch');
    if (!faqSearch) return;
    var items = Array.prototype.slice.call(document.querySelectorAll('.faq details'));
    var groups = Array.prototype.slice.call(document.querySelectorAll('.faq__group'));
    var countEl = document.getElementById('faqCount');
    var emptyEl = document.getElementById('faqEmpty');
    items.forEach(function (item) { item._text = item.textContent.toLowerCase(); });
    var apply = function () {
      var terms = faqSearch.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      var shown = 0;
      items.forEach(function (item) {
        var ok = terms.every(function (t) { return item._text.indexOf(t) !== -1; });
        item.hidden = !ok;
        item.open = ok && terms.length > 0;
        if (ok) shown++;
      });
      groups.forEach(function (group) {
        var list = group.nextElementSibling;
        group.hidden = !list || !list.querySelector('details:not([hidden])');
        if (list) list.hidden = group.hidden;
      });
      emptyEl.hidden = shown !== 0;
      countEl.textContent = terms.length
        ? shown + (shown === 1 ? ' question' : ' questions') + ' matching “' + faqSearch.value.trim() + '”'
        : items.length + ' questions';
    };
    faqSearch.addEventListener('input', apply);
    apply();
  })();

  // Troubleshooting finder — filter symptoms by words or board type
  (function () {
    var symptomSearch = document.getElementById('symptomSearch');
    var symptomChips = document.getElementById('symptomChips');
    if (!symptomSearch || !symptomChips) return;
    var cards = Array.prototype.slice.call(document.querySelectorAll('.symptom'));
    var countEl = document.getElementById('symptomCount');
    var emptyEl = document.getElementById('symptomEmpty');
    var chips = Array.prototype.slice.call(symptomChips.querySelectorAll('.chip'));
    var kind = 'all';
    cards.forEach(function (card) { card._text = card.textContent.toLowerCase().replace(/\s+/g, ' '); });

    var apply = function () {
      var terms = symptomSearch.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      var shown = 0;
      cards.forEach(function (card) {
        var okKind = kind === 'all' || card.dataset.kind === kind;
        var okText = terms.every(function (t) { return card._text.indexOf(t) !== -1; });
        card.hidden = !(okKind && okText);
        if (!card.hidden) shown++;
      });
      emptyEl.hidden = shown !== 0;
      countEl.hidden = false;
      countEl.textContent = shown + (shown === 1 ? ' symptom' : ' symptoms') +
        (kind === 'all' ? '' : ' · ' + (kind === 'gas' ? 'gas boards' : 'electric boards')) +
        (terms.length ? ' · “' + symptomSearch.value.trim() + '”' : '');
    };

    symptomChips.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      kind = chip.dataset.symptom;
      chips.forEach(function (c) { c.classList.toggle('is-active', c === chip); });
      apply();
    });
    symptomSearch.addEventListener('input', apply);
    apply();
  })();

  // Site-wide search — one box in the nav, everything on the site behind it
    var searchButtons = Array.prototype.slice.call(document.querySelectorAll('[data-site-search]'));
    if (searchButtons.length && window.fetch) {
      var panelEl = null, inputEl = null, resultsEl = null, indexData = null, hits = [], active = -1;

      var escapeHtml = function (t) {
        return t.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
      };
      var mark = function (text, terms) {
        var out = escapeHtml(text);
        terms.forEach(function (t) {
          out = out.replace(new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<b>$1</b>');
        });
        return out;
      };
      var snippet = function (entry, terms) {
        var text = entry.d || entry.x;
        var low = text.toLowerCase();
        var at = -1;
        terms.forEach(function (t) { if (at === -1) at = low.indexOf(t); });
        var start = at > 60 ? at - 50 : 0;
        var cut = text.slice(start, start + 150).trim();
        return (start ? '…' : '') + mark(cut, terms) + '…';
      };

      var search = function (query) {
        var terms = query.toLowerCase().split(/\s+/).filter(Boolean)
          // match winterize/winterizing and board/boards
          .map(function (t) { return t.length > 4 ? t.replace(/(ings?|ed|es|s|e)$/, '') : t; });
        if (!terms.length || !indexData) { hits = []; return; }
        hits = indexData.map(function (entry) {
          var title = entry.t.toLowerCase(), desc = (entry.d || '').toLowerCase(), text = (entry.x || '').toLowerCase();
          var score = 0;
          terms.forEach(function (t) {
            if (title.indexOf(t) !== -1) score += title.indexOf(t) === 0 ? 30 : 20;
            if (desc.indexOf(t) !== -1) score += 5;
            var n = text.split(t).length - 1;
            if (n) score += Math.min(n, 3);
          });
          // every term has to appear somewhere
          var all = terms.every(function (t) { return (title + ' ' + desc + ' ' + text).indexOf(t) !== -1; });
          return all ? { entry: entry, score: score } : null;
        }).filter(Boolean).sort(function (a, b) { return b.score - a.score; }).slice(0, 8);
        return terms;
      };

      var draw = function () {
        var query = inputEl.value.trim();
        if (!query) {
          resultsEl.innerHTML = '<p class="site-search__msg">Search every guide, board and page — try <b>spark plug</b>, <b>winterize</b>, <b>electric</b> or <b>registration</b>.</p>';
          return;
        }
        if (!indexData) { resultsEl.innerHTML = '<p class="site-search__msg">Loading…</p>'; return; }
        var terms = search(query) || [];
        active = -1;
        if (!hits.length) {
          resultsEl.innerHTML = '<p class="site-search__msg">Nothing matched “' + escapeHtml(query) + '”. Try a simpler word, or browse the <a href="maintenance.html" style="color:var(--brand-bright);font-weight:600">guide library</a>.</p>';
          return;
        }
        resultsEl.innerHTML = hits.map(function (hit, i) {
          return '<a class="site-search__hit" href="' + hit.entry.u + '" data-i="' + i + '">' +
            '<span class="site-search__top"><span class="site-search__kind">' + hit.entry.k + '</span>' +
            '<span class="site-search__title">' + mark(hit.entry.t, terms) + '</span></span>' +
            '<span class="site-search__snip">' + snippet(hit.entry, terms) + '</span></a>';
        }).join('');
      };

      var move = function (step) {
        var links = resultsEl.querySelectorAll('.site-search__hit');
        if (!links.length) return;
        active = (active + step + links.length) % links.length;
        Array.prototype.slice.call(links).forEach(function (l, i) { l.classList.toggle('is-active', i === active); });
        links[active].scrollIntoView({ block: 'nearest' });
      };

      var close = function () {
        if (panelEl) panelEl.hidden = true;
        document.documentElement.classList.remove('guide-index-open');
      };

      var open = function () {
        if (!panelEl) {
          panelEl = el('div', 'site-search');
          panelEl.innerHTML =
            '<div class="site-search__panel" role="dialog" aria-label="Search the site">' +
              '<div class="site-search__head">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
                '<input type="search" autocomplete="off" placeholder="Search guides, boards, spots…" aria-label="Search the site" />' +
                '<button type="button" class="site-search__close">Esc</button>' +
              '</div>' +
              '<div class="site-search__results"></div>' +
              '<div class="site-search__foot"><span>↑ ↓ to move</span><span>↵ to open</span><span>Press / to search from anywhere</span></div>' +
            '</div>';
          document.body.appendChild(panelEl);
          inputEl = panelEl.querySelector('input');
          resultsEl = panelEl.querySelector('.site-search__results');
          panelEl.addEventListener('click', function (e) { if (e.target === panelEl) close(); });
          panelEl.querySelector('.site-search__close').addEventListener('click', close);
          inputEl.addEventListener('input', draw);
          inputEl.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
            else if (e.key === 'Enter') {
              var links = resultsEl.querySelectorAll('.site-search__hit');
              if (links.length) { e.preventDefault(); (links[active] || links[0]).click(); }
            }
          });
          fetch('assets/search-index.json')
            .then(function (r) { return r.json(); })
            .then(function (data) { indexData = data; draw(); })
            .catch(function () {
              resultsEl.innerHTML = '<p class="site-search__msg">Search isn\'t available right now — the <a href="maintenance.html" style="color:var(--brand-bright);font-weight:600">guide library</a> has its own search.</p>';
            });
        }
        panelEl.hidden = false;
        document.documentElement.classList.add('guide-index-open');
        draw();
        setTimeout(function () { inputEl.focus(); inputEl.select(); }, 30);
      };

      searchButtons.forEach(function (btn) { btn.addEventListener('click', open); });
      document.addEventListener('keydown', function (e) {
        var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
        if (e.key === '/' && !typing) { e.preventDefault(); open(); }
        else if (e.key === 'Escape' && panelEl && !panelEl.hidden) close();
      });
    }
  })();

  (function () {
    // Board finder — four questions, then a recommendation
    var boardFinder = document.getElementById('boardFinder');
    if (boardFinder) {
      var BOARDS = [
        { id: 'adventure-2-dfi', name: 'Adventure 2 DFI', href: 'board-adventure-2-dfi.html', img: 'assets/img/boards/adventure-2-dfi.png',
          why: 'The most forgiving hull in the range, with dual bindings so a second rider or a kid can go too.',
          power: 'gas', bindings: 'dual', ski: false,
          score: { riders: { solo: 1, shared: 3, family: 3 }, level: { new: 3, some: 2, pro: 0, race: 0 }, style: { cruise: 3, carve: 1, ski: 0 } } },
        { id: 'cruiser-dfi', name: 'Cruiser DFI', href: 'board-cruiser-dfi.html', img: 'assets/img/boards/cruiser-dfi.jpg',
          why: 'Long, comfortable sessions with dual bindings — stable like the Adventure, but quicker.',
          power: 'gas', bindings: 'dual', ski: false,
          score: { riders: { solo: 2, shared: 3, family: 2 }, level: { new: 2, some: 3, pro: 1, race: 0 }, style: { cruise: 3, carve: 2, ski: 0 } } },
        { id: 'race-dfi-sl', name: 'Race DFI Super Light', href: 'board-race-dfi-sl.html', img: 'assets/img/boards/race-dfi-sl.png',
          why: 'The race board — light, fast and single-stance, and the class the World Cup is run in.',
          power: 'gas', bindings: 'single', ski: false,
          score: { riders: { solo: 3, shared: 0, family: 0 }, level: { new: 0, some: 1, pro: 3, race: 3 }, style: { cruise: 0, carve: 3, ski: 0 } } },
        { id: 'titanium-dfi-sl', name: 'Titanium DFI Super Light', href: 'board-titanium-dfi-sl.html', img: 'assets/img/boards/titanium-dfi-sl.png',
          why: 'The PRO-level step up — the fastest surf board in the range, with a titanium exhaust and a racing binding.',
          power: 'gas', bindings: 'single', ski: false,
          score: { riders: { solo: 3, shared: 0, family: 0 }, level: { new: 0, some: 0, pro: 3, race: 2 }, style: { cruise: 0, carve: 3, ski: 0 } } },
        { id: 'race-dfi-ski', name: 'Race DFI Ski', href: 'board-race-dfi-ski.html', img: 'assets/img/boards/race-dfi-ski.png',
          why: 'The same race intent, ridden standing upright on a handlebar — and the bar comes off to ride it as a board.',
          power: 'gas', bindings: 'single', ski: true,
          score: { riders: { solo: 3, shared: 1, family: 1 }, level: { new: 1, some: 2, pro: 3, race: 2 }, style: { cruise: 1, carve: 2, ski: 3 } } },
        { id: 'titanium-dfi-ski', name: 'Titanium DFI Ski', href: 'board-titanium-dfi-ski.html', img: 'assets/img/boards/titanium-dfi-ski.png',
          why: 'The quickest Ski — upright riding with the titanium exhaust and the top speed that comes with it.',
          power: 'gas', bindings: 'single', ski: true,
          score: { riders: { solo: 3, shared: 1, family: 1 }, level: { new: 0, some: 1, pro: 3, race: 2 }, style: { cruise: 1, carve: 2, ski: 3 } } },
        { id: 'electric-2', name: 'Electric 2', href: 'board-electric-2.html', img: 'assets/img/boards/electric-2.png',
          why: 'Quiet, no fuel to mix, dual bindings and swappable batteries — the easiest board to live with.',
          power: 'electric', bindings: 'dual', ski: false,
          score: { riders: { solo: 2, shared: 3, family: 3 }, level: { new: 3, some: 3, pro: 1, race: 0 }, style: { cruise: 3, carve: 2, ski: 0 } } },
        { id: 'electric-2-ski', name: 'Electric 2 Ski', href: 'board-electric-2-ski.html', img: 'assets/img/boards/electric-2-ski.png',
          why: 'The electric ridden standing upright with a handlebar — silent, and the bar comes off.',
          power: 'electric', bindings: 'dual', ski: true,
          score: { riders: { solo: 2, shared: 2, family: 2 }, level: { new: 2, some: 3, pro: 2, race: 0 }, style: { cruise: 2, carve: 1, ski: 3 } } }
      ];
      var finderResult = document.getElementById('finderResult');
      var finderProgress = document.getElementById('finderProgress');
      var answers = {};
      var QUESTIONS = ['riders', 'level', 'power', 'style'];

      var pickBoards = function () {
        var ranked = BOARDS.map(function (board) {
          var total = 0;
          QUESTIONS.forEach(function (q) {
            var a = answers[q];
            if (!a) return;
            if (q === 'power') {
              if (a === 'either') total += 1;
              else total += (board.power === a ? 4 : -3);
              return;
            }
            total += (board.score[q] && board.score[q][a]) || 0;
          });
          // a shared board has to take both stances
          if (answers.riders && answers.riders !== 'solo' && board.bindings !== 'dual') total -= 3;
          if (answers.style === 'ski' && !board.ski) total -= 3;
          if (answers.style !== 'ski' && board.ski) total -= 1;
          return { board: board, total: total };
        }).sort(function (a, b) { return b.total - a.total; });
        return ranked;
      };

      var boardCard = function (board, lead) {
        var msg = encodeURIComponent("I'm interested in the " + board.name + " — the board finder suggested it.");
        return '<article class="finder__card' + (lead ? ' finder__card--lead' : '') + '">' +
          '<span class="finder__badge">' + (lead ? 'Start here' : 'Also worth a look') + '</span>' +
          '<img src="' + board.img + '" alt="" loading="lazy" />' +
          '<h3>' + board.name + '</h3>' +
          '<p>' + board.why + '</p>' +
          '<div class="finder__links">' +
            '<a class="badge-ready" href="' + board.href + '">Full details →</a>' +
            (lead ? '<a class="badge-ready" target="_blank" rel="noopener" href="https://wa.me/13058965931?text=' + msg + '">Ask us about it →</a>' : '') +
          '</div></article>';
      };

      var render = function () {
        var answered = QUESTIONS.filter(function (q) { return answers[q]; }).length;
        finderProgress.textContent = answered + ' of ' + QUESTIONS.length + ' answered';
        if (answered < QUESTIONS.length) { finderResult.hidden = true; return; }
        var ranked = pickBoards();
        finderResult.innerHTML =
          '<h3 class="finder__resultTitle">Start with the ' + ranked[0].board.name + '</h3>' +
          '<p class="finder__resultLead">Based on your answers. Read the rest of this page before you decide — and message us if you want a second opinion.</p>' +
          '<div class="finder__cards">' + boardCard(ranked[0].board, true) + boardCard(ranked[1].board, false) + '</div>' +
          '<p class="finder__note">Not convinced? <a href="boards.html">Compare all eight boards</a> side by side.</p>';
        finderResult.hidden = false;
        finderResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      };

      boardFinder.addEventListener('change', function (e) {
        if (!e.target.name) return;
        answers[e.target.name] = e.target.value;
        var q = e.target.closest('.finder__q');
        if (q) q.classList.add('is-done');
        render();
      });
      document.getElementById('finderReset').addEventListener('click', function () {
        boardFinder.reset();
        answers = {};
        Array.prototype.slice.call(boardFinder.querySelectorAll('.finder__q')).forEach(function (q) { q.classList.remove('is-done'); });
        render();
        boardFinder.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      render();
    }
  })();

  (function () {
    // Glossary — filter terms as you type
    var glossarySearch = document.getElementById('glossarySearch');
    if (glossarySearch) {
      var gItems = Array.prototype.slice.call(document.querySelectorAll('.glossary__item'));
      var gGroups = Array.prototype.slice.call(document.querySelectorAll('.glossary__group'));
      var gCount = document.getElementById('glossaryCount');
      var gEmpty = document.getElementById('glossaryEmpty');
      gItems.forEach(function (item) { item._text = item.textContent.toLowerCase(); });
      var filterGlossary = function () {
        var terms = glossarySearch.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
        var shown = 0;
        gItems.forEach(function (item) {
          var ok = terms.every(function (t) { return item._text.indexOf(t) !== -1; });
          item.hidden = !ok;
          if (ok) shown++;
        });
        gGroups.forEach(function (group) {
          var list = group.nextElementSibling;
          group.hidden = !list || !list.querySelector('.glossary__item:not([hidden])');
        });
        gEmpty.hidden = shown !== 0;
        gCount.textContent = terms.length
          ? shown + (shown === 1 ? ' term' : ' terms') + ' matching \u201c' + glossarySearch.value.trim() + '\u201d'
          : gItems.length + ' terms';
      };
      glossarySearch.addEventListener('input', filterGlossary);
      filterGlossary();
    }
  })();

  (function () {
    // Guide pages — clicking a timestamp jumps the video above it to that moment
    var guideBody = document.querySelector('.tutorial-doc');
    if (guideBody) {
      var frames = Array.prototype.slice.call(guideBody.querySelectorAll('iframe[src*="youtube.com/embed/"]'));
      var stamps = [];
      Array.prototype.slice.call(guideBody.querySelectorAll('li > strong:first-child')).forEach(function (tag) {
        var m = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})$/.exec(tag.textContent.trim());
        if (!m) return;
        var seconds = (parseInt(m[1] || 0, 10) * 3600) + (parseInt(m[2], 10) * 60) + parseInt(m[3], 10);
        // the video this step belongs to: the last one before it on the page
        var owner = null;
        frames.forEach(function (f) {
          if (f.compareDocumentPosition(tag) & Node.DOCUMENT_POSITION_FOLLOWING) owner = f;
        });
        if (!owner) owner = frames[0];
        if (!owner) return;
        var btn = el('button', 'ts');
        btn.type = 'button';
        btn.innerHTML = '<span class="ts__icon" aria-hidden="true"></span>' + tag.textContent.trim();
        btn.title = 'Play the video from ' + tag.textContent.trim();
        btn.setAttribute('aria-label', 'Play from ' + tag.textContent.trim());
        tag.parentNode.replaceChild(btn, tag);
        stamps.push({ btn: btn, seconds: seconds, frame: owner });
      });

      if (stamps.length) {
        var players = {};
        var videoId = function (frame) {
          var m = /embed\/([\w-]{11})/.exec(frame.src);
          return m ? m[1] : null;
        };
        var watchUrl = function (stamp) {
          return 'https://www.youtube.com/watch?v=' + videoId(stamp.frame) + '&t=' + stamp.seconds + 's';
        };
        var ready = false;

        var play = function (stamp) {
          var player = players[stamp.frame.dataset.ytIndex];
          if (!ready || !player || !player.seekTo) { window.open(watchUrl(stamp), '_blank', 'noopener'); return; }
          var box = stamp.frame.getBoundingClientRect();
          if (box.top < 60 || box.bottom > window.innerHeight) {
            stamp.frame.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          player.seekTo(stamp.seconds, true);
          player.playVideo();
        };
        stamps.forEach(function (stamp) {
          stamp.btn.addEventListener('click', function () { play(stamp); });
        });

        // the player API can only drive iframes that asked for it
        frames.forEach(function (frame, i) {
          frame.dataset.ytIndex = i;
          if (frame.src.indexOf('enablejsapi=') === -1) {
            frame.src += (frame.src.indexOf('?') === -1 ? '?' : '&') + 'enablejsapi=1&origin=' + encodeURIComponent(location.origin);
          }
        });
        window.onYouTubeIframeAPIReady = function () {
          frames.forEach(function (frame, i) { players[i] = new YT.Player(frame); });
          ready = true;
        };
        var api = document.createElement('script');
        api.src = 'https://www.youtube.com/iframe_api';
        api.async = true;
        document.head.appendChild(api);
      }
    }
  })();

  (function () {
    // Spots — live wind, water temp and next tide from the National Weather Service and NOAA tides
    var condCards = Array.prototype.slice.call(document.querySelectorAll('.spot-feature[data-grid]'));
    if (condCards.length && window.fetch) {
      var COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      var compass = function (deg) { return COMPASS[Math.round(((deg % 360) / 45)) % 8]; };
      var clock = function (iso) {
        var d = new Date(iso.replace(' ', 'T'));
        var h = d.getHours(), m = d.getMinutes();
        return ((h % 12) || 12) + ':' + (m < 10 ? '0' : '') + m + (h < 12 ? 'am' : 'pm');
      };
      var chip = function (label, value, cls) {
        return '<span' + (cls ? ' class="' + cls + '"' : '') + '><i>' + label + '</i> ' + value + '</span>';
      };
      var ymd = function (d) {
        return d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2);
      };

      var loadCard = function (card) {
        var box = card.querySelector('.spot-cond');
        var chips = {};
        var ORDER = ['wind', 'air', 'water', 'tide'];
        var show = function () {
          var html = ORDER.map(function (k) { return chips[k] || ''; }).join('');
          if (!html) return;
          box.innerHTML = html;
          box.hidden = false;
        };

        fetch('https://api.weather.gov/gridpoints/' + card.dataset.grid + '/forecast/hourly')
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (data) {
            var now = data && data.properties && data.properties.periods && data.properties.periods[0];
            if (!now) return;
            var speed = (now.windSpeed || '').split(' ')[0];
            var high = parseInt(speed, 10) >= 18;
            chips.wind = chip('Wind', now.windDirection + ' ' + speed + ' mph', high ? 'spot-cond__wind--high' : '');
            chips.air = chip('Air', now.temperature + '°' + now.temperatureUnit);
            show();
          })
          .catch(function () {});

        if (!card.dataset.station) {
          chips.water = chip('Water', 'Fresh — no tide');
          show();
          return;
        }
        var today = new Date();
        fetch('https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=water_temperature&application=jtsrfclub' +
          '&date=latest&station=' + card.dataset.station + '&time_zone=lst_ldt&units=english&format=json')
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (d) {
            var v = d && d.data && d.data[0] && d.data[0].v;
            if (v) { chips.water = chip('Water', Math.round(parseFloat(v)) + '°F'); show(); }
          })
          .catch(function () {});
        fetch('https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&application=jtsrfclub' +
          '&begin_date=' + ymd(today) + '&end_date=' + ymd(new Date(today.getTime() + 864e5)) +
          '&datum=MLLW&interval=hilo&station=' + card.dataset.station + '&time_zone=lst_ldt&units=english&format=json')
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (d) {
            var list = (d && d.predictions) || [];
            var next = null;
            list.forEach(function (t) {
              if (!next && new Date(t.t.replace(' ', 'T')) > new Date()) next = t;
            });
            if (next) { chips.tide = chip('Next tide', (next.type === 'H' ? 'High' : 'Low') + ' ' + clock(next.t)); show(); }
          })
          .catch(function () {});
      };

      var start = function () {
        condCards.forEach(loadCard);
        var stamp = el('p', 'spot-cond__stamp');
        stamp.innerHTML = 'Conditions from the National Weather Service and NOAA Tides &amp; Currents, updated when you open the page. Always check the forecast yourself before you launch.';
        var rail = document.getElementById('spotRail');
        if (rail) rail.parentNode.insertBefore(stamp, rail.nextSibling);
      };

      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); start(); }
        }, { rootMargin: '200px' });
        io.observe(condCards[0]);
      } else {
        start();
      }
    }
  })();

  // Spots — search by name/town, or sort by distance from a city, ZIP or the rider's location
  var spotRail = document.getElementById('spotRail');
  var spotFinder = document.getElementById('spotFinder');
  if (spotRail && spotFinder) {
    var spotQuery = document.getElementById('spotQuery');
    var spotLocate = document.getElementById('spotLocate');
    var spotStatus = document.getElementById('spotStatus');
    var spotCards = Array.prototype.slice.call(spotRail.querySelectorAll('.spot-feature[data-lat]'));
    var spotEmpty = el('p', 'spot-rail-empty', 'No spots match that. Try a town or ZIP and press Find nearest — or send us yours.');
    spotEmpty.hidden = true;
    spotRail.parentNode.insertBefore(spotEmpty, spotRail.nextSibling);

    spotCards.forEach(function (card, i) {
      card._order = i;
      card._text = card.textContent.toLowerCase().replace(/\s+/g, ' ');
      card._lat = parseFloat(card.dataset.lat);
      card._lng = parseFloat(card.dataset.lng);
      var badge = el('span', 'spot-feature__distance');
      badge.hidden = true;
      var tag = card.querySelector('.race-card__tag');
      tag.parentNode.insertBefore(badge, tag);
      card._badge = badge;
    });

    var milesBetween = function (lat1, lng1, lat2, lng2) {
      var rad = Math.PI / 180, R = 3958.8;
      var dLat = (lat2 - lat1) * rad, dLng = (lng2 - lng1) * rad;
      var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
      return 2 * R * Math.asin(Math.sqrt(a));
    };
    var plural = function (n) { return n + (n === 1 ? ' spot' : ' spots'); };
    var setStatus = function (html) { spotStatus.innerHTML = html; };
    var escapeHtml = function (t) { return t.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

    var resetSpots = function () {
      spotCards.sort(function (a, b) { return a._order - b._order; });
      spotCards.forEach(function (card) {
        card.hidden = false;
        card._badge.hidden = true;
        card.classList.remove('is-nearest');
        spotRail.appendChild(card);
      });
      spotEmpty.hidden = true;
      setStatus('<span>' + plural(spotCards.length) + '</span> · scroll sideways to see them all');
    };

    // typing filters by name / town / description straight away
    var US_ZIP = /^\d{5}(-\d{4})?$/;

    // typing filters by spot name / town / description; a ZIP or a place that matches
    // no spot keeps every card visible and waits for Find nearest
    var filterSpots = function () {
      var q = spotQuery.value.trim();
      var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
      if (!terms.length) { resetSpots(); return; }
      var matches = spotCards.filter(function (card) {
        return terms.every(function (t) { return card._text.indexOf(t) !== -1; });
      });
      if (US_ZIP.test(q) || !matches.length) {
        spotCards.forEach(function (card) { card.hidden = false; card._badge.hidden = true; card.classList.remove('is-nearest'); });
        spotEmpty.hidden = true;
        setStatus('Press <strong>Find nearest</strong> (or Enter) to sort spots by distance from “' + escapeHtml(q) + '”');
        return;
      }
      spotCards.forEach(function (card) {
        card.hidden = matches.indexOf(card) === -1;
        card._badge.hidden = true;
        card.classList.remove('is-nearest');
      });
      spotEmpty.hidden = true;
      setStatus('<strong>' + plural(matches.length) + '</strong> matching “' + escapeHtml(q) + '” · press <strong>Find nearest</strong> to sort by distance instead');
    };

    var sortByDistance = function (lat, lng, label) {
      spotCards.forEach(function (card) {
        card._miles = milesBetween(lat, lng, card._lat, card._lng);
        card.hidden = false;
        card._badge.hidden = false;
        card._badge.textContent = (card._miles < 10 ? card._miles.toFixed(1) : Math.round(card._miles).toLocaleString()) + ' mi away';
        card.classList.remove('is-nearest');
      });
      spotCards.sort(function (a, b) { return a._miles - b._miles; });
      spotCards.forEach(function (card) { spotRail.appendChild(card); });
      spotCards[0].classList.add('is-nearest');
      spotEmpty.hidden = true;
      spotRail.scrollTo({ left: 0, behavior: 'smooth' });
      var nearest = spotCards[0];
      setStatus('Nearest to <strong>' + escapeHtml(label) + '</strong>: ' + escapeHtml(nearest.querySelector('h3').textContent) +
        ' (' + nearest._badge.textContent.replace(' away', '') + ') · <button type="button" data-spot-reset>Show all in order</button>');
    };

    var busy = function (btn, on) { btn.disabled = on; };

    spotQuery.addEventListener('input', filterSpots);

    spotFinder.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = spotQuery.value.trim();
      if (!q) { setStatus('Type a city or ZIP code, or use your location.'); spotQuery.focus(); return; }
      var submitBtn = spotFinder.querySelector('button[type="submit"]');
      busy(submitBtn, true);
      setStatus('Looking up “' + escapeHtml(q) + '”…');
      // a bare 5-digit number is looked up as a US ZIP — as free text it matches postcodes worldwide
      var isZip = US_ZIP.test(q);
      var url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=en&' +
        (isZip ? 'countrycodes=us&postalcode=' + encodeURIComponent(q.slice(0, 5)) : 'q=' + encodeURIComponent(q));
      fetch(url)
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (results) {
          if (results.length) return results[0];
          if (!isZip) return null;
          // backup ZIP lookup
          return fetch('https://api.zippopotam.us/us/' + q.slice(0, 5))
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (z) {
              var pl = z && z.places && z.places[0];
              return pl ? { lat: pl.latitude, lon: pl.longitude, display_name: q.slice(0, 5) + ', ' + pl['place name'] } : null;
            });
        })
        .then(function (hit) {
          if (!hit) {
            setStatus('Couldn’t find ' + (isZip ? 'ZIP code' : 'a place called') + ' “' + escapeHtml(q) + '”. Try a city name or ZIP code.');
            return;
          }
          var parts = hit.display_name.split(',').map(function (x) { return x.trim(); });
          var place = isZip ? parts.slice(0, 2).join(', ') : parts.slice(0, 2).join(', ');
          sortByDistance(parseFloat(hit.lat), parseFloat(hit.lon), place);
        })
        .catch(function () { setStatus('Location search isn’t available right now — try <strong>Use my location</strong>.'); })
        .then(function () { busy(submitBtn, false); });
    });

    spotLocate.addEventListener('click', function () {
      if (!navigator.geolocation) { setStatus('Your browser can’t share its location — type a city or ZIP instead.'); return; }
      busy(spotLocate, true);
      setStatus('Finding your location…');
      navigator.geolocation.getCurrentPosition(function (pos) {
        busy(spotLocate, false);
        spotQuery.value = '';
        sortByDistance(pos.coords.latitude, pos.coords.longitude, 'your location');
      }, function () {
        busy(spotLocate, false);
        setStatus('Location access was blocked — type a city or ZIP instead.');
      }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 });
    });

    spotStatus.addEventListener('click', function (e) {
      if (e.target.closest('[data-spot-reset]')) { spotQuery.value = ''; resetSpots(); }
    });
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
      var location = f.spotLocation.value.trim();
      var lines = [
        'Spot name: ' + name,
        'Location (city, region, country): ' + location,
        'How you launch: ' + f.spotLaunch.value.trim(),
        'Parking: ' + f.spotParking.value.trim(),
        'Water (protected/open, depth, hazards): ' + f.spotWater.value.trim(),
        'Best conditions: ' + f.spotConditions.value.trim(),
        'Rules or access notes: ' + f.spotRules.value.trim(),
        'Map pin or location: ' + f.spotPin.value.trim(),
        'Your name (for credit, optional): ' + f.spotSubmitter.value.trim()
      ];
      var subject = 'Spot submission' + (name ? ': ' + name : '') + (location ? ' (' + location + ')' : '');
      var body = lines.join('\n');
      var mailto = 'mailto:info@jtsrfclub.com?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
      window.location.href = mailto;
      spotModal.close();
      spotForm.reset();
    });
  }
})();

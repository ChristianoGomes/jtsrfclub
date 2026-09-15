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
    var filterSpots = function () {
      var terms = spotQuery.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (!terms.length) { resetSpots(); return; }
      var shown = 0;
      spotCards.forEach(function (card) {
        var ok = terms.every(function (t) { return card._text.indexOf(t) !== -1; });
        card.hidden = !ok;
        card._badge.hidden = true;
        card.classList.remove('is-nearest');
        if (ok) shown++;
      });
      spotEmpty.hidden = shown !== 0;
      setStatus('<strong>' + plural(shown) + '</strong> matching “' + escapeHtml(spotQuery.value.trim()) + '” · press <strong>Find nearest</strong> to sort by distance from a town or ZIP');
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
      fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=en&q=' + encodeURIComponent(q))
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (results) {
          if (!results.length) {
            filterSpots();
            setStatus('Couldn’t find a place called “' + escapeHtml(q) + '”. Try a city name or ZIP code.');
            return;
          }
          var place = results[0].display_name.split(',').slice(0, 2).join(',').trim();
          sortByDistance(parseFloat(results[0].lat), parseFloat(results[0].lon), place);
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

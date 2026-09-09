// JTSRF CLUB — board comparison table
// Data mirrored from JETSURF's official compare tool: jetsurf.com/collections/compare-surfs
(function () {
  var mount = document.getElementById('boardCompare');
  if (!mount) return;

  var boards = [
    'ADVENTURE 2 DFI', 'RACE DFI SL', 'CRUISER DFI', 'ELECTRIC 2 SKI',
    'ELECTRIC 2', 'RACE DFI SKI', 'TITANIUM DFI SKI', 'TITANIUM DFI SL'
  ];

  var slugs = [
    'adventure-2-dfi', 'race-dfi-sl', 'cruiser-dfi', 'electric-2-ski',
    'electric-2', 'race-dfi-ski', 'titanium-dfi-ski', 'titanium-dfi-sl'
  ];

  var SHOP_BOARDS = 'https://jetsurfusa.com/collections/jetsurf-boards-2024';
  var SHOP_SKI = 'https://jetsurfusa.com/collections/jetsurf-ski';
  function shopFor(slug) {
    return /-ski$/.test(slug) ? SHOP_SKI : SHOP_BOARDS;
  }

  function fill(v) { return [v, v, v, v, v, v, v, v]; }

  // [ label, values[8], isBool?, wrap? ]
  var specRows = [
    ['Design', ['Fluo Yellow / Blue, Red / Blue', 'White, Fluo Yellow', 'Fluo Red, White Grey, Fluo Orange', 'Carbon', 'Carbon', 'Carbon', 'Carbon', 'White, Fluo Yellow'], false, true],
    ['Skill level', ['Beginner / Intermediate', 'Advanced', 'Beginner / Intermediate / Advanced', 'Beginner / Intermediate / Advanced', 'Beginner / Intermediate / Advanced', 'Beginner / Intermediate / Advanced', 'PRO / Racer', 'PRO / Racer'], false, true],
    ['Top speed', ['34 mph', '36 mph', '35 mph', '34 mph', '34 mph', '36 mph', '40 mph', '40 mph']],
    ['Weight', ['45 lb', '43 lb', '45 lb', '84 lb', '73 lb', '57 lb', '55 lb', '41 lb']],
    ['Range', ['60 min', '60 min', '60 min', '25–55 min', '25–55 min', '60 min', '40 min', '40 min']],
    ['Alternator', ['Yes', 'No', 'Yes', 'No', 'No', 'Yes', 'No', 'No'], true],
    ['Charging time', ['', '', '', '2.5 hr', '2.5 hr', '', '', '']],
    ['Description', [
      'Our most popular and best-selling board',
      'Allows you to reach your full riding potential',
      'Fast & agile, but at the same time suitable for long cruising',
      "World's lightest electric jet-ski",
      'Silent and at the same time powerful',
      "World's lightest jet-ski",
      "World's lightest jet-ski",
      '100cc engine with titanium exhaust makes this our fastest board'
    ], false, true],
    ['Hull', ['100% carbon fiber', '100% carbon fiber', '100% carbon fiber', '', '', '', '', '100% carbon fiber']],
    ['Hull shape intended for', ['Stability & family fun', 'Fast turning & racing & fun', 'Fast turning & carving & fun', 'Fun & fast turning', 'Fun & fast turning', 'Fun & fast turning', 'Fun & fast turning & racing', 'Fast turning & racing'], false, true],
    ['Tube compatibility', fill('Yes'), true],
    ['Dual binding', ['Yes', 'No', 'Yes', 'No', 'Yes', 'No', 'No', 'No'], true],
    ['Standard binding', ['No', 'Yes', 'No', 'No', 'No', 'No', 'No', 'No'], true],
    ['Racing binding', ['No', 'No', 'No', 'No', 'No', 'No', 'No', 'Yes'], true],
    ['Ability for racing', ['No', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'], true],
    ['JetSurf rack', ['Yes', 'No', 'No', 'No', 'No', 'No', 'No', 'No'], true],
    ['Maximum load', fill('265 lb')],
    ['Fuel / battery capacity', ['0.74 gal', '0.74 gal', '0.74 gal', '3 kWh (59 Ah)', '3 kWh (59 Ah)', '0.74 gal', '0.74 gal', '0.74 gal']],
    ['Board bag', ['Standard bag', 'Standard bag', 'Standard bag', 'SKI standard bag', 'Standard bag', 'SKI standard bag', 'SKI standard bag', 'Standard bag']],
    ['Displacement', ['100cc', '100cc', '100cc', '', '', '100cc', '100cc', '100cc']],
    ['Silencer', ['Yes', 'Yes', 'Yes', 'No', 'No', 'Yes', 'No', 'No'], true],
    ['Cooling', fill('Water cooling')],
    ['Warranty', fill('12 months')]
  ];

  // Column order, easiest -> most advanced (left to right).
  // Values are indices into the arrays above; edit this to re-sort the table.
  var ORDER = [0, 4, 3, 2, 5, 1, 6, 7];
  function pick(arr) { return ORDER.map(function (i) { return arr[i]; }); }
  boards = pick(boards);
  slugs = pick(slugs);
  specRows = specRows.map(function (row) {
    return [row[0], pick(row[1]), row[2], row[3]];
  });

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // Local detail pages, keyed by slug. Add entries as pages are built.
  var detailPages = {
    'adventure-2-dfi': 'board-adventure-2-dfi.html',
    'race-dfi-sl': 'board-race-dfi-sl.html',
    'cruiser-dfi': 'board-cruiser-dfi.html',
    'electric-2-ski': 'board-electric-2-ski.html',
    'electric-2': 'board-electric-2.html',
    'race-dfi-ski': 'board-race-dfi-ski.html',
    'titanium-dfi-ski': 'board-titanium-dfi-ski.html',
    'titanium-dfi-sl': 'board-titanium-dfi-sl.html'
  };

  var head = '<thead><tr><th aria-hidden="true"></th>' + boards.map(function (b, i) {
    var img = '<img src="assets/img/boards/' + slugs[i] + '.png" alt="" loading="lazy" />';
    var name = '<strong>' + esc(b) + '</strong>';
    var detail = detailPages[slugs[i]];
    var identity = detail
      ? '<a class="compare__head-link" href="' + detail + '">' + img + name + '</a>'
      : img + name;
    return '<th scope="col"><span class="compare__head">' + identity +
      '<a href="' + shopFor(slugs[i]) + '" target="_blank" rel="noopener">View on jetsurfusa.com →</a>' +
      '</span></th>';
  }).join('') + '</tr></thead>';

  var body = '<tbody>' + specRows.map(function (row) {
    var label = row[0], values = row[1], isBool = row[2], wrap = row[3];
    var cells = values.map(function (v) {
      if (isBool) {
        var yes = v === 'Yes';
        return '<td class="' + (yes ? 'compare--yes' : 'compare--no') + '">' +
          (yes ? '✓' : '–') + '</td>';
      }
      return '<td' + (wrap ? ' class="compare--wrap"' : '') + '>' + (v ? esc(v) : '–') + '</td>';
    }).join('');
    return '<tr><th scope="row">' + esc(label) + '</th>' + cells + '</tr>';
  }).join('') + '</tbody>';

  mount.innerHTML = '<table>' + head + body + '</table>';
})();

document.addEventListener('DOMContentLoaded', function () {
  // Mobile menu toggle
  const toggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
  }

  // Active nav link highlight
  const currentPath = window.location.pathname;
  const navLinksAll = document.querySelectorAll('.nav-links a');

  navLinksAll.forEach(function (link) {
    const href = link.getAttribute('href');
    if (href === currentPath || (href === './index.html' && currentPath.includes('index.html'))) {
      link.classList.add('active');
    }
  });

  // Docs sidebar active link
  const sidebarLinks = document.querySelectorAll('.docs-sidebar a');
  sidebarLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      sidebarLinks.forEach(function (l) { l.classList.remove('active'); });
      link.classList.add('active');
    });
  });

  // ---- Docs search functionality (language-aware, supports TH + EN boxes) ----
  const contentEl = document.querySelector('.docs-content');

  // Build the searchable index for a given language ('th' | 'en').
  // Reads only the h2/h3 that live inside that language's wrapper,
  // so an English query is matched against English titles, and vice versa.
  function buildDocSections(lang) {
    const docSections = [];
    if (!contentEl) return docSections;

    const sections = contentEl.querySelectorAll('section');
    sections.forEach(function (section) {
      const langWrap = section.querySelector('.lang-' + lang);
      if (!langWrap) return;

      const h2 = langWrap.querySelector('h2');
      const h3s = langWrap.querySelectorAll('h3');
      if (!h2) return;

      const sectionData = {
        id: section.id,
        title: h2.textContent,
        subsections: []
      };
      h3s.forEach(function (h3) {
        sectionData.subsections.push(h3.textContent);
      });
      docSections.push(sectionData);
    });

    return docSections;
  }

  function findMatchingSubsection(subsections, query) {
    for (let i = 0; i < subsections.length; i++) {
      if (subsections[i].toLowerCase().includes(query)) {
        return subsections[i];
      }
    }
    return null;
  }

  function highlightText(text, query) {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    if (index === -1) return text;

    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);

    return before + '<span class="search-highlight">' + match + '</span>' + after;
  }

  function renderResults(searchResults, results, query, lang) {
    if (results.length === 0) {
      const noResultsText = lang === 'th' ? 'ไม่พบผลลัพธ์' : 'No results found';
      searchResults.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-light);">' + noResultsText + '</div>';
      searchResults.classList.add('active');
      return;
    }

    let html = '';
    results.forEach(function (result) {
      const displayTitle = highlightText(result.title, query);
      let displaySub = '';
      if (result.subsection) {
        const inLabel = lang === 'th' ? 'ใน ' : 'in ';
        displaySub = '<div class="search-section">' + inLabel + highlightText(result.subsection, query) + '</div>';
      }
      html += '<a href="#' + result.id + '">' +
        '<div>' + displayTitle + displaySub + '</div>' +
        '</a>';
    });

    searchResults.innerHTML = html;
    searchResults.classList.add('active');
  }

  function performSearch(searchResults, query, lang) {
    if (!query || query.length < 2) {
      searchResults.classList.remove('active');
      searchResults.innerHTML = '';
      return;
    }

    const lowerQuery = query.toLowerCase();
    const docSections = buildDocSections(lang);
    const results = [];

    docSections.forEach(function (section) {
      const titleMatch = section.title.toLowerCase().includes(lowerQuery);
      const subsectionMatch = section.subsections.some(function (sub) {
        return sub.toLowerCase().includes(lowerQuery);
      });

      if (titleMatch || subsectionMatch) {
        results.push({
          id: section.id,
          title: section.title,
          subsection: subsectionMatch ? findMatchingSubsection(section.subsections, lowerQuery) : null
        });
      }
    });

    renderResults(searchResults, results, query, lang);
  }

  // Wire up every search box on the page (there's one per language).
  const searchBoxes = document.querySelectorAll('.search-box');
  searchBoxes.forEach(function (box) {
    const searchInput = box.querySelector('input[type="text"]');
    const searchResults = box.querySelector('.search-results');
    if (!searchInput || !searchResults) return;

    let searchTimeout;
    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimeout);
      const currentLang = document.documentElement.lang || 'th';
      searchTimeout = setTimeout(function () {
        performSearch(searchResults, searchInput.value, currentLang);
      }, 150);
    });

    searchInput.addEventListener('focus', function () {
      if (searchResults.children.length > 0) {
        searchResults.classList.add('active');
      }
    });
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.search-box')) {
      document.querySelectorAll('.search-results').forEach(function (el) {
        el.classList.remove('active');
      });
    }
  });
});

function setLang(lang) {
  document.documentElement.lang = lang;
  localStorage.setItem('tsl-lang', lang);

  // Update button states
  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // Show/hide language content
  document.querySelectorAll('.lang-th').forEach(function (el) {
    el.style.display = lang === 'th' ? '' : 'none';
  });
  document.querySelectorAll('.lang-en').forEach(function (el) {
    el.style.display = lang === 'en' ? '' : 'none';
  });

  // Clear any open search results/inputs so stale-language results don't linger
  document.querySelectorAll('.search-results').forEach(function (el) {
    el.classList.remove('active');
    el.innerHTML = '';
  });
  document.querySelectorAll('.docSearch').forEach(function (input) {
    input.value = '';
  });
}

// Initialize language on load
(function initLang() {
  const saved = localStorage.getItem('tsl-lang') || 'th';
  setLang(saved);
})();

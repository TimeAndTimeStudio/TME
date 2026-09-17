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

  // Docs search functionality
  const searchInput = document.getElementById('docSearch');
  const searchResults = document.getElementById('searchResults');

  if (searchInput && searchResults) {
    const docSections = [];
    const contentEl = document.querySelector('.docs-content');
    if (contentEl) {
      const sections = contentEl.querySelectorAll('section');
      sections.forEach(function (section) {
        const h2 = section.querySelector('h2');
        const h3s = section.querySelectorAll('h3');
        if (h2) {
          const sectionData = {
            id: section.id,
            title: h2.textContent,
            subsections: []
          };
          h3s.forEach(function (h3) {
            sectionData.subsections.push(h3.textContent);
          });
          docSections.push(sectionData);
        }
      });
    }

    let searchTimeout;
    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(function () {
        performSearch(searchInput.value);
      }, 150);
    });

    searchInput.addEventListener('focus', function () {
      if (searchResults.classList.contains('active') && searchResults.children.length > 0) {
        searchResults.classList.add('active');
      }
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.search-box')) {
        searchResults.classList.remove('active');
      }
    });

    function performSearch(query) {
      if (!query || query.length < 2) {
        searchResults.classList.remove('active');
        searchResults.innerHTML = '';
        return;
      }

      const lowerQuery = query.toLowerCase();
      const results = [];

      docSections.forEach(function (section) {
        const titleMatch = section.title.toLowerCase().includes(lowerQuery);
        const subsectionMatch = section.subsections.some(function (sub) {
          return sub.toLowerCase().includes(lowerQuery);
        });

        if (titleMatch || subsectionMatch) {
          let snippet = '';
          const content = section.content || '';
          const contentIndex = content.toLowerCase().indexOf(lowerQuery);
          if (contentIndex > -1) {
            const start = Math.max(0, contentIndex - 40);
            const end = Math.min(content.length, contentIndex + query.length + 60);
            snippet = (start > 0 ? '...' : '') +
              content.substring(start, end).replace(/[<>]/g, '') +
              (end < content.length ? '...' : '');
          }

          results.push({
            id: section.id,
            title: section.title,
            subsection: subsectionMatch ? findMatchingSubsection(section.subsections, lowerQuery) : null,
            snippet: snippet
          });
        }
      });

      renderResults(results, query);
    }

    function findMatchingSubsection(subsections, query) {
      for (let i = 0; i < subsections.length; i++) {
        if (subsections[i].toLowerCase().includes(query)) {
          return subsections[i];
        }
      }
      return null;
    }

    function renderResults(results, query) {
      if (results.length === 0) {
        searchResults.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-light);">No results found</div>';
        searchResults.classList.add('active');
        return;
      }

      let html = '';
      results.forEach(function (result) {
        const displayTitle = highlightText(result.title, query);
        let displaySub = '';
        if (result.subsection) {
          displaySub = '<div class="search-section">in ' + highlightText(result.subsection, query) + '</div>';
        }
        html += '<a href="#' + result.id + '">' +
          '<div>' + displayTitle + displaySub + '</div>' +
          '</a>';
      });

      searchResults.innerHTML = html;
      searchResults.classList.add('active');
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
  }
});

function setLang(lang) {
  document.documentElement.lang = lang;
  localStorage.setItem('tsl-lang', lang);
  
  // Update button states
  document.querySelectorAll('.lang-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  
  // Show/hide language content
  document.querySelectorAll('.lang-th').forEach(function(el) {
    el.style.display = lang === 'th' ? '' : 'none';
  });
  document.querySelectorAll('.lang-en').forEach(function(el) {
    el.style.display = lang === 'en' ? '' : 'none';
  });
}

// Initialize language on load
(function initLang() {
  const saved = localStorage.getItem('tsl-lang') || 'th';
  setLang(saved);
})();

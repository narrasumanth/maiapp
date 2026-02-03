// MAI Protocol Trust Badge Widget
(function() {
  'use strict';

  const container = document.getElementById('mai-trust-badge');
  if (!container) return;

  const token = container.getAttribute('data-token');
  if (!token) {
    console.error('MAI Widget: No token provided');
    return;
  }

  // Determine API URL from script source
  const scripts = document.getElementsByTagName('script');
  let baseUrl = '';
  for (let i = 0; i < scripts.length; i++) {
    if (scripts[i].src && scripts[i].src.includes('widget.js')) {
      baseUrl = scripts[i].src.replace('/widget.js', '');
      break;
    }
  }

  // Fetch widget data
  fetch(`${baseUrl}/api/widget/${token}`)
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        console.error('MAI Widget: Failed to load', data.error);
        return;
      }

      renderWidget(container, data.data);
    })
    .catch(err => {
      console.error('MAI Widget: Error loading', err);
    });

  function renderWidget(container, data) {
    const { score, name, theme = 'dark', size = 'medium' } = data;

    // Size configurations
    const sizes = {
      small: { width: '96px', height: '32px', fontSize: '12px', iconSize: '14px' },
      medium: { width: '128px', height: '40px', fontSize: '14px', iconSize: '16px' },
      large: { width: '160px', height: '48px', fontSize: '16px', iconSize: '20px' }
    };

    const sizeConfig = sizes[size] || sizes.medium;

    // Theme configurations
    const themes = {
      dark: { bg: 'rgba(0,0,0,0.9)', text: '#fff', border: 'rgba(255,255,255,0.2)' },
      light: { bg: '#fff', text: '#000', border: 'rgba(0,0,0,0.2)' }
    };

    const themeConfig = themes[theme] || themes.dark;

    // Score color
    const scoreColor = 
      score >= 90 ? (theme === 'dark' ? '#a855f7' : '#7c3aed') :
      score >= 75 ? (theme === 'dark' ? '#22c55e' : '#16a34a') :
      score >= 50 ? (theme === 'dark' ? '#eab308' : '#ca8a04') :
      (theme === 'dark' ? '#ef4444' : '#dc2626');

    // Create widget HTML
    container.innerHTML = `
      <a href="${baseUrl}/result?code=${token}" target="_blank" rel="noopener noreferrer" style="
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        border-radius: 8px;
        background: ${themeConfig.bg};
        color: ${themeConfig.text};
        border: 1px solid ${themeConfig.border};
        text-decoration: none;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: ${sizeConfig.fontSize};
        width: ${sizeConfig.width};
        height: ${sizeConfig.height};
        box-sizing: border-box;
        transition: transform 0.2s, box-shadow 0.2s;
      " onmouseover="this.style.transform='scale(1.02)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='scale(1)';this.style.boxShadow='none'">
        <span style="font-weight: bold; color: ${scoreColor}">${score}</span>
        <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; opacity: 0.8; font-size: 0.85em">MAI Verified</span>
        <svg width="${sizeConfig.iconSize}" height="${sizeConfig.iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.6">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      </a>
    `;
  }
})();

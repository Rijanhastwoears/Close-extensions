document.addEventListener('DOMContentLoaded', () => {
  const domainList = document.getElementById('domainList');
  const domainInput = document.getElementById('domainInput');
  const addButton = document.getElementById('addDomain');
  const closeTabsButton = document.getElementById('closeTabs');

  function renderDomains() {
    chrome.storage.local.get(['domains'], (result) => {
      const domains = result.domains || [];
      domainList.innerHTML = '';
      domains.forEach(domain => createDomainItem(domain));
    });
  }

  function createDomainItem(domain) {
    const item = document.createElement('div');
    item.className = 'domain-item';
    item.innerHTML = `
      <span>${domain}</span>
      <button class="remove-btn">×</button>
    `;
    
    item.querySelector('.remove-btn').addEventListener('click', () => {
      chrome.storage.local.get(['domains'], (result) => {
        const updatedDomains = (result.domains || []).filter(d => d !== domain);
        chrome.storage.local.set({ domains: updatedDomains }, () => {
          renderDomains();
        });
      });
    });
    
    domainList.appendChild(item);
  }

  addButton.addEventListener('click', () => {
    const domain = domainInput.value.trim();
    if (domain) {
      chrome.storage.local.get(['domains'], (result) => {
        const updatedDomains = [...new Set([...(result.domains || []), domain])];
        chrome.storage.local.set({ domains: updatedDomains }, () => {
          renderDomains();
          domainInput.value = '';
        });
      });
    }
  });

  closeTabsButton.addEventListener('click', async () => {
    const { domains } = await chrome.storage.local.get(['domains']);
    const targetDomains = domains || [];
    const tabs = await chrome.tabs.query({});
    const tabsToClose = tabs.filter(tab => {
      try {
        const hostname = new URL(tab.url).hostname.toLowerCase();
        return targetDomains.some(domain => hostname.includes(domain.toLowerCase()));
      } catch {
        return false;
      }
    }).map(tab => tab.id);

    if (tabsToClose.length > 0) {
      await chrome.tabs.remove(tabsToClose);
      window.close();
    }
  });

  renderDomains();
});
// Dorama Studio AI v1.3 - configuração central do backend
window.DORAMA_CONFIG = window.DORAMA_CONFIG || {};
window.DORAMA_CONFIG.backendUrl = localStorage.getItem('dorama_backend_url') || window.DORAMA_CONFIG.backendUrl || '';
window.setDoramaBackend = function(url){ localStorage.setItem('dorama_backend_url', String(url || '').replace(/\/$/, '')); location.reload(); };

/**
 * Main Application Bootstrap
 * Khởi tạo và quản lý toàn bộ ứng dụng
 */

document.addEventListener('DOMContentLoaded', () => {
  // Khởi tạo các module
  AUTH.init();
  UI.init();
  ROUTER.init();

  // Restore theme
  const theme = localStorage.getItem('ntkt_theme') || 'dark';
  document.body.classList.toggle('light', theme === 'light');
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  // Render navigation
  UI.renderNavigation();
});

/**
 * Router Module
 * Quản lý navigation và page routing
 */

const ROUTER = {
  currentPage: 'home',
  previousPage: null,

  /**
   * Khởi tạo router
   */
  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  },

  /**
   * Xử lý thay đổi route
   */
  handleRoute() {
    const hash = location.hash || '#home';

    // Kiểm tra nếu chưa đăng nhập
    if (!AUTH.isLoggedIn() && !hash.startsWith('#auth')) {
      location.hash = '#auth/login';
      return;
    }

    if (hash.startsWith('#chuong-')) {
      const slug = hash.replace('#', '');
      this.navigateTo('reader', slug);
      return;
    }

    if (hash.startsWith('#nhan-vat/')) {
      const id = hash.replace('#nhan-vat/', '');
      this.navigateTo('character-detail', id);
      return;
    }

    if (hash.startsWith('#auth/')) {
      const page = hash.replace('#auth/', '');
      this.navigateTo('auth', page);
      return;
    }

    const page = hash.replace('#', '').split('/')[0];
    this.navigateTo(page);
  },

  /**
   * Điều hướng đến trang
   */
  navigateTo(page, param = null) {
    this.previousPage = this.currentPage;
    this.currentPage = page;

    // Ẩn tất cả page
    document.querySelectorAll('.page').forEach((el) => {
      el.classList.remove('active');
    });

    // Hiển thị page yêu cầu
    let pageEl;
    if (page === 'character-detail') {
      pageEl = document.getElementById('character-detailPage');
    } else {
      pageEl = document.getElementById(`${page}Page`);
    }

    if (pageEl) {
      pageEl.classList.add('active');
    }

    // Gọi callback render tương ứng
    if (page === 'character-detail') {
      UI.render_character_detail(param);
    } else if (UI[`render_${page}`]) {
      UI[`render_${page}`](param);
    }

    // Cuộn lên đầu trang
    if (page !== 'reader') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Cập nhật active state của nav
    this.updateActiveNav(page);
  },

  /**
   * Cập nhật active state navigation
   */
  updateActiveNav(page) {
    document.querySelectorAll('[data-route]').forEach((btn) => {
      const routePage = btn.dataset.route;
      btn.classList.toggle('active', routePage === page || (page === 'reader' && routePage === 'chapters') || (page === 'character-detail' && routePage === 'characters'));
    });
  },

  /**
   * Chuyển đến trang với URL
   */
  go(hash) {
    location.hash = hash;
  }
};

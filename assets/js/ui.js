/**
 * UI Module
 * Quản lý render và interaction của tất cả các page
 */

const UI = {
  // State
  currentChapterSlug: null,
  currentCharacterFilter: 'all',
  currentChapterFilter: 'all',
  currentCharacterSearch: '',
  currentChapterSearch: '',

  /**
   * Khởi tạo UI
   */
  init() {
    this.bindEvents();
    this.renderNavigation();
    this.renderSidebar();
  },

  /**
   * Render sidebar mục lục
   */
  renderSidebar() {
    const sidebar = document.getElementById('chapterSidebar');
    if (!sidebar) return;

    const html = CHAPTERS.map((chapter) => `
      <button type="button" class="sidebar-chapter${this.currentChapterSlug === chapter.slug ? ' active' : ''}" 
              data-slug="${chapter.slug}"
              onclick="ROUTER.go('#${chapter.slug}'); return false;"
              title="${chapter.title}">
        Chương ${chapter.number}
      </button>
    `).join('');

    sidebar.innerHTML = html;
  },

  /**
   * Cập nhật active state sidebar
   */
  updateSidebarActive(slug) {
    document.querySelectorAll('.sidebar-chapter').forEach((btn) => {
      const isActive = btn.dataset.slug === slug;
      btn.classList.toggle('active', isActive);
    });
  },

  /**
   * Bind sự kiện
   */
  bindEvents() {
    // Đăng xuất
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        AUTH.logout();
        ROUTER.go('#auth/login');
        showToast('Đã đăng xuất.');
      });
    }

    // Chế độ tối/sáng
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Tìm kiếm chương
    const chapterSearch = document.getElementById('chapterSearch');
    if (chapterSearch) {
      chapterSearch.addEventListener('input', (e) => {
        this.currentChapterSearch = e.target.value;
        this.render_chapters();
      });
    }

    // Bộ lọc chương
    document.querySelectorAll('#chaptersPage .filter-button').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#chaptersPage .filter-button').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentChapterFilter = btn.dataset.filter;
        this.render_chapters();
      });
    });

    // Tìm kiếm nhân vật
    const characterSearch = document.getElementById('characterSearch');
    if (characterSearch) {
      characterSearch.addEventListener('input', (e) => {
        this.currentCharacterSearch = e.target.value;
        this.render_characters();
      });
    }

    // Bộ lọc nhân vật
    document.querySelectorAll('#charactersPage .filter-button').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#charactersPage .filter-button').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentCharacterFilter = btn.dataset.filter;
        this.render_characters();
      });
    });

    // Nút action
    document.getElementById('startReadingBtn')?.addEventListener('click', () => {
      this.openFirstUnreadChapter();
    });

    document.getElementById('openChaptersBtn')?.addEventListener('click', () => {
      ROUTER.go('#chapters');
    });

    document.getElementById('backToCharactersBtn')?.addEventListener('click', () => {
      ROUTER.go('#characters');
    });

    // Navbar buttons
    document.querySelectorAll('[data-route]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const route = btn.dataset.route;
        ROUTER.go(`#${route}`);
      });
    });

    // Reader controls
    document.getElementById('prevChapterBtn')?.addEventListener('click', () => this.navigateChapter(-1));
    document.getElementById('nextChapterBtn')?.addEventListener('click', () => this.navigateChapter(1));
    document.getElementById('fullscreenBtn')?.addEventListener('click', () => this.toggleFullscreen());

    // Font size và width
    document.getElementById('fontSizeRange')?.addEventListener('input', (e) => {
      document.documentElement.style.setProperty('--reader-font', `${e.target.value}px`);
    });

    document.getElementById('widthRange')?.addEventListener('input', (e) => {
      document.documentElement.style.setProperty('--reader-width', `${e.target.value}px`);
    });
  },

  /**
   * Render navigation
   */
  renderNavigation() {
    const user = AUTH.getCurrentUser();
    const userInfo = document.getElementById('userInfo');

    if (userInfo) {
      if (user) {
        userInfo.innerHTML = `
          <span>${user.avatar} ${user.username}</span>
          <button id="logoutBtn" class="icon-button" title="Đăng xuất">🚪</button>
        `;
        document.getElementById('logoutBtn').addEventListener('click', () => {
          AUTH.logout();
          ROUTER.go('#auth/login');
          showToast('Đã đăng xuất.');
        });
      } else {
        userInfo.innerHTML = `
          <button class="secondary-button" onclick="ROUTER.go('#auth/login')">Đăng nhập</button>
        `;
      }
    }
  },

  /**
   * Render trang chủ
   */
  render_home() {
    const user = AUTH.getCurrentUser();
    if (!user) return;

    const total = CHAPTERS.length;
    const read = user.readChapters.length;
    const percent = total ? Math.round((read / total) * 100) : 0;

    // Cập nhật thống kê
    document.getElementById('totalChapters').textContent = total;
    document.getElementById('readCount').textContent = read;
    document.getElementById('completionPercent').textContent = `${percent}%`;
    document.getElementById('progressCount').textContent = `${read} / ${total}`;
    document.getElementById('progressLabel').textContent = `${percent}%`;
    document.getElementById('progressFill').style.width = `${percent}%`;

    // Chương mới nhất
    const latest = CHAPTERS.slice(-3).reverse();
    const latestHtml = latest.map((chapter) => {
      const isRead = user.readChapters.includes(chapter.number);
      return `
        <div class="chapter-card${isRead ? ' read' : ''}">
          <h4>${chapter.title}</h4>
          <p>${chapter.sections[0]?.paragraphs[0].slice(0, 120) || ''}...</p>
          <div class="pill">${isRead ? '✓ Đã đọc' : 'Chưa đọc'}</div>
          <button class="secondary-button" type="button" onclick="ROUTER.go('#${chapter.slug}')">Đọc ngay</button>
        </div>
      `;
    }).join('');
    document.getElementById('latestChapters').innerHTML = latestHtml;

    // Nhân vật nổi bật
    const featuredCharacters = [
      CHARACTERS.find((c) => c.id === 'diep-than'),
      CHARACTERS.find((c) => c.id === 'tuyet-nhi'),
      CHARACTERS.find((c) => c.id === 'linh-than-tu'),
      CHARACTERS.find((c) => c.id === 'tieu-hac')
    ].filter(Boolean);

    const characterHtml = featuredCharacters.map((char) => `
      <div class="character-card featured">
        <h4>${char.name}</h4>
        <p class="char-title">${char.title[0] || ''}</p>
        <p class="char-role">${char.role.slice(0, 60)}...</p>
        <button class="secondary-button" type="button" onclick="ROUTER.go('#nhan-vat/${char.id}')">Chi tiết</button>
      </div>
    `).join('');
    const featuredCharsContainer = document.getElementById('featuredCharacters');
    if (featuredCharsContainer) {
      featuredCharsContainer.innerHTML = characterHtml;
    }

    // Tiếp tục đọc
    if (user.readChapters.length > 0) {
      const lastReadNumber = Math.max(...user.readChapters);
      const lastChapter = CHAPTERS.find((c) => c.number === lastReadNumber);
      const nextChapter = CHAPTERS.find((c) => c.number === lastReadNumber + 1);

      if (lastChapter && nextChapter) {
        const continueHtml = `
          <div class="continue-reading-card">
            <div>
              <span class="eyebrow">Tiếp tục đọc</span>
              <h3>${nextChapter.title}</h3>
              <p>Lần cuối đọc: Chương ${lastReadNumber}</p>
            </div>
            <button class="primary-button" onclick="ROUTER.go('#${nextChapter.slug}')">Đọc tiếp</button>
          </div>
        `;
        const continueContainer = document.getElementById('continueReading');
        if (continueContainer) {
          continueContainer.innerHTML = continueHtml;
        }
      }
    }
  },

  /**
   * Render trang danh sách chương
   */
  render_chapters() {
    const user = AUTH.getCurrentUser();
    if (!user) return;

    const query = this.currentChapterSearch.trim().toLowerCase();
    const filter = this.currentChapterFilter;

    const filtered = CHAPTERS.filter((chapter) => {
      const isRead = user.readChapters.includes(chapter.number);
      if (filter === 'read' && !isRead) return false;
      if (filter === 'unread' && isRead) return false;
      if (!query) return true;

      const text = [
        chapter.title,
        ...chapter.sections.map((s) => s.title),
        ...chapter.sections.flatMap((s) => s.paragraphs)
      ].join(' ').toLowerCase();

      const numberQuery = Number(query);
      return (numberQuery && chapter.number === numberQuery) || text.includes(query);
    });

    document.getElementById('chapterListCount').textContent = `${filtered.length} chương hiển thị`;
    document.getElementById('chapterListStatus').textContent = `Đã đọc ${user.readChapters.length} chương`;

    const html = filtered.map((chapter) => {
      const isRead = user.readChapters.includes(chapter.number);
      return `
        <div class="chapter-item${isRead ? ' read' : ''}">
          <button type="button" onclick="ROUTER.go('#${chapter.slug}')">
            <div>
              <h4>Chương ${chapter.number}</h4>
              <h5>${chapter.title}</h5>
              <p>${chapter.sections[0]?.paragraphs[0].slice(0, 100) || ''}...</p>
            </div>
            <span class="chapter-tag">${isRead ? '✓ Đã đọc' : 'Chưa đọc'}</span>
          </button>
        </div>
      `;
    }).join('');

    document.getElementById('chapterList').innerHTML = html || '<p class="empty-state">Không tìm thấy chương.</p>';
  },

  /**
   * Render trang đọc truyện
   */
  render_reader(slug) {
    const user = AUTH.getCurrentUser();
    if (!user) return;

    const chapter = CHAPTERS.find((c) => c.slug === slug);
    if (!chapter) {
      ROUTER.go('#chapters');
      return;
    }

    this.currentChapterSlug = slug;
    this.updateSidebarActive(slug);

    document.getElementById('readerTitle').textContent = chapter.title;
    document.getElementById('readerMeta').textContent = `Chương ${chapter.number}`;

    const contentHtml = chapter.sections.map((section) => `
      <div class="section">
        <h3>${section.title}</h3>
        ${section.paragraphs.map((p) => `<p>${p}</p>`).join('')}
      </div>
    `).join('');
    document.getElementById('readerContent').innerHTML = contentHtml;

    // Đánh dấu đã đọc
    if (!user.readChapters.includes(chapter.number)) {
      user.readChapters.push(chapter.number);
      user.readChapters.sort((a, b) => a - b);
      AUTH.updateProfile({ readChapters: user.readChapters });
    }

    // Cập nhật nút prev/next
    const chapterIndex = CHAPTERS.findIndex((c) => c.slug === slug);
    document.getElementById('prevChapterBtn').disabled = chapterIndex <= 0;
    document.getElementById('nextChapterBtn').disabled = chapterIndex >= CHAPTERS.length - 1;
  },

  /**
   * Render trang nhân vật
   */
  render_characters() {
    const query = this.currentCharacterSearch.trim().toLowerCase();
    const filter = this.currentCharacterFilter;

    const filtered = CHARACTERS.filter((char) => {
      if (filter !== 'all' && char.group !== filter) return false;
      if (!query) return true;
      const text = [char.name, char.group, char.role, char.identity, (char.title || []).join(' ')].join(' ').toLowerCase();
      return text.includes(query);
    });

    if (!filtered.length) {
      document.getElementById('characterList').innerHTML = `
        <div class="empty-state">
          <h3>Không tìm thấy nhân vật</h3>
          <p>Thử tìm bằng tên, nhóm hoặc vai trò khác.</p>
        </div>
      `;
      return;
    }

    const grouped = filtered.reduce((acc, char) => {
      if (!acc[char.group]) acc[char.group] = [];
      acc[char.group].push(char);
      return acc;
    }, {});

    const html = Object.entries(grouped).map(([group, chars]) => `
      <div class="character-group">
        <div class="group-heading">
          <h3>${group}</h3>
          <span>${chars.length} nhân vật</span>
        </div>
        <div class="character-grid">
          ${chars.map((char) => `
            <div class="character-card">
              <h4>${char.name}</h4>
              <p><strong>Danh hiệu:</strong> ${char.title.join(', ')}</p>
              <p><strong>Vai trò:</strong> ${char.role}</p>
              <p><strong>Xuất hiện:</strong> ${char.appearances}</p>
              ${char.skill || char.weapon || char.treasure ? `<p><strong>Công pháp / Vũ khí:</strong> ${[char.skill, char.weapon, char.treasure].filter(Boolean).join(' • ')}</p>` : ''}
              <div class="chip-list">
                ${(char.personality || []).slice(0, 3).map((item) => `<span class="chip">${item}</span>`).join('')}
              </div>
              <button class="secondary-button" type="button" onclick="ROUTER.go('#nhan-vat/${char.id}')">Xem chi tiết</button>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    document.getElementById('characterList').innerHTML = html;
  },

  /**
   * Render chi tiết nhân vật
   */
  render_character_detail(id) {
    const character = CHARACTERS.find((c) => c.id === id);
    if (!character) {
      ROUTER.go('#characters');
      return;
    }

    document.getElementById('characterDetailName').textContent = character.name;
    document.getElementById('characterDetailGroup').textContent = character.group;
    document.getElementById('characterTitles').textContent = character.title.join(', ');
    document.getElementById('characterIdentity').textContent = character.identity;
    document.getElementById('characterPersonality').textContent = (character.personality || []).join(', ');
    document.getElementById('characterRole').textContent = character.role;
    document.getElementById('characterSkill').textContent = [character.skill, character.weapon, character.treasure].filter(Boolean).join(' • ') || '---';
    document.getElementById('characterAppearances').textContent = character.appearances;

    const chaptersHtml = character.relatedChapters.map((num) => {
      const chapter = CHAPTERS.find((c) => c.number === num);
      return `<button type="button" class="chip" onclick="ROUTER.go('#${chapter.slug}')">Chương ${num}</button>`;
    }).join('');
    document.getElementById('relatedChapters').innerHTML = chaptersHtml;
  },

  /**
   * Render trang hồ sơ cá nhân
   */
  render_profile() {
    const user = AUTH.getCurrentUser();
    if (!user) return;

    const total = CHAPTERS.length;
    const read = user.readChapters.length;
    const percent = total ? Math.round((read / total) * 100) : 0;

    document.getElementById('profileAvatar').textContent = user.avatar;
    document.getElementById('profileUsername').textContent = user.username;
    document.getElementById('profileEmail').value = user.email;
    document.getElementById('profileDisplayName').value = user.profile?.displayName || user.username;
    document.getElementById('profileBio').value = user.bio || '';

    document.getElementById('profileStats').innerHTML = `
      <div class="stat">
        <span>Chương đã đọc</span>
        <strong>${read}/${total}</strong>
      </div>
      <div class="stat">
        <span>Hoàn thành</span>
        <strong>${percent}%</strong>
      </div>
      <div class="stat">
        <span>Yêu thích</span>
        <strong>${user.favorites?.length || 0}</strong>
      </div>
      <div class="stat">
        <span>Bình luận</span>
        <strong>${Object.keys(user.comments || {}).length}</strong>
      </div>
    `;

    document.getElementById('updateProfileBtn')?.addEventListener('click', () => {
      const displayName = document.getElementById('profileDisplayName').value;
      const bio = document.getElementById('profileBio').value;

      AUTH.updateProfile({
        profile: { ...user.profile, displayName },
        bio
      });
      showToast('Đã cập nhật hồ sơ.');
    }, { once: true });

    document.getElementById('changePasswordBtn')?.addEventListener('click', () => {
      const current = document.getElementById('currentPassword').value;
      const newPass = document.getElementById('newPassword').value;
      const confirm = document.getElementById('confirmPassword').value;

      if (newPass !== confirm) {
        showToast('Mật khẩu xác nhận không khớp.');
        return;
      }

      const result = AUTH.changePassword(current, newPass);
      showToast(result.message);

      if (result.success) {
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
      }
    }, { once: true });
  },

  /**
   * Render trang thống kê
   */
  render_statistics() {
    const user = AUTH.getCurrentUser();
    if (!user) return;

    const total = CHAPTERS.length;
    const read = user.readChapters.length;
    const percent = total ? Math.round((read / total) * 100) : 0;

    document.getElementById('statsTotal').textContent = read;
    document.getElementById('statsPercent').textContent = `${percent}%`;

    const statusHtml = `
      <div class="stat-card">
        <h4>Tổng chương đã đọc</h4>
        <p class="big-number">${read}/<span class="muted">${total}</span></p>
      </div>
      <div class="stat-card">
        <h4>Hoàn thành</h4>
        <p class="big-number">${percent}<span class="muted">%</span></p>
      </div>
      <div class="stat-card">
        <h4>Yêu thích</h4>
        <p class="big-number">${user.favorites?.length || 0}</p>
      </div>
      <div class="stat-card">
        <h4>Bình luận</h4>
        <p class="big-number">${Object.values(user.comments || {}).reduce((sum, arr) => sum + (arr?.length || 0), 0)}</p>
      </div>
    `;
    document.getElementById('statsOverview').innerHTML = statusHtml;

    // Chương yêu thích
    const favorites = user.favorites || [];
    const favoriteChapters = CHAPTERS.filter((c) => favorites.includes(c.slug));
    const favHtml = favoriteChapters.length > 0
      ? favoriteChapters.map((c) => `
          <div class="chapter-item">
            <button onclick="ROUTER.go('#${c.slug}')">
              <h5>Chương ${c.number}</h5>
              <p>${c.title}</p>
            </button>
          </div>
        `).join('')
      : '<p class="empty-state">Chưa có chương yêu thích.</p>';
    document.getElementById('favoriteChapters').innerHTML = favHtml;

    // Chương gần đây
    const recent = user.readChapters.slice(-5).reverse();
    const recentHtml = recent.length > 0
      ? recent.map((num) => {
        const c = CHAPTERS.find((ch) => ch.number === num);
        return `
          <div class="chapter-item">
            <button onclick="ROUTER.go('#${c.slug}')">
              <h5>Chương ${num}</h5>
              <p>${c.title}</p>
            </button>
          </div>
        `;
      }).join('')
      : '<p class="empty-state">Chưa có lịch sử đọc.</p>';
    document.getElementById('recentChapters').innerHTML = recentHtml;
  },

  /**
   * Render trang đăng nhập
   */
  render_auth(type = 'login') {
    const container = document.getElementById('authForm');
    if (!container) return;

    if (type === 'login') {
      container.innerHTML = `
        <div class="auth-card">
          <h2>Đăng nhập</h2>
          <div class="auth-form">
            <input id="loginUsername" type="text" placeholder="Tên người dùng" />
            <input id="loginPassword" type="password" placeholder="Mật khẩu" />
            <button id="loginBtn" class="primary-button">Đăng nhập</button>
          </div>
          <p class="auth-switch">Chưa có tài khoản? <a href="#" onclick="ROUTER.go('#auth/register'); return false;">Đăng ký</a></p>
        </div>
      `;

      document.getElementById('loginBtn').addEventListener('click', () => {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        const result = AUTH.login(username, password);
        showToast(result.message);

        if (result.success) {
          ROUTER.go('#home');
        }
      });
    } else if (type === 'register') {
      container.innerHTML = `
        <div class="auth-card">
          <h2>Đăng ký</h2>
          <div class="auth-form">
            <input id="regUsername" type="text" placeholder="Tên người dùng" />
            <input id="regEmail" type="email" placeholder="Email" />
            <input id="regPassword" type="password" placeholder="Mật khẩu" />
            <button id="registerBtn" class="primary-button">Đăng ký</button>
          </div>
          <p class="auth-switch">Đã có tài khoản? <a href="#" onclick="ROUTER.go('#auth/login'); return false;">Đăng nhập</a></p>
        </div>
      `;

      document.getElementById('registerBtn').addEventListener('click', () => {
        const username = document.getElementById('regUsername').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;

        const result = AUTH.register(username, email, password);
        showToast(result.message);

        if (result.success) {
          AUTH.login(username, password);
          ROUTER.go('#home');
        }
      });
    }
  },

  /**
   * Mở chương đầu tiên chưa đọc
   */
  openFirstUnreadChapter() {
    const user = AUTH.getCurrentUser();
    if (!user) return;

    const unread = CHAPTERS.find((c) => !user.readChapters.includes(c.number));
    if (unread) {
      ROUTER.go(`#${unread.slug}`);
      return;
    }

    ROUTER.go(`#${CHAPTERS[0].slug}`);
  },

  /**
   * Chuyển đến chương trước/sau
   */
  navigateChapter(direction) {
    if (!this.currentChapterSlug) return;

    const currentIndex = CHAPTERS.findIndex((c) => c.slug === this.currentChapterSlug);
    const nextIndex = currentIndex + direction;

    if (nextIndex < 0 || nextIndex >= CHAPTERS.length) return;

    ROUTER.go(`#${CHAPTERS[nextIndex].slug}`);
  },

  /**
   * Chế độ toàn màn hình
   */
  toggleFullscreen() {
    const reader = document.getElementById('readerContent');
    if (!reader) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      reader.requestFullscreen();
    }
  },

  /**
   * Chuyển đổi chế độ tối/sáng
   */
  toggleTheme() {
    const isLight = document.body.classList.toggle('light');
    const theme = isLight ? 'light' : 'dark';

    const user = AUTH.getCurrentUser();
    if (user) {
      AUTH.updateProfile({ profile: { ...user.profile, theme } });
    }

    localStorage.setItem('ntkt_theme', theme);
    document.getElementById('themeToggle').textContent = isLight ? '🌙' : '☀️';
  }
};

/**
 * Hiển thị thông báo toast
 */
function showToast(message) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
}

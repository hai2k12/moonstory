/**
 * Authentication Module
 * Quản lý đăng ký, đăng nhập, đăng xuất và thông tin người dùng
 */

const AUTH = {
  STORAGE_KEY: 'ntkt_users',
  CURRENT_USER_KEY: 'ntkt_currentUser',
  SESSION_KEY: 'ntkt_session',

  /**
   * Khởi tạo hệ thống auth
   */
  init() {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
    }
  },

  /**
   * Lấy danh sách tất cả người dùng
   */
  getAllUsers() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  },

  /**
   * Lưu danh sách người dùng
   */
  saveUsers(users) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
  },

  /**
   * Hash mật khẩu đơn giản (không phải bảo mật, chỉ để demo)
   */
  hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'h_' + Math.abs(hash).toString(36);
  },

  /**
   * Kiểm tra mật khẩu
   */
  verifyPassword(password, hash) {
    return this.hashPassword(password) === hash;
  },

  /**
   * Kiểm tra username đã tồn tại
   */
  usernameExists(username) {
    return this.getAllUsers().some((user) => user.username === username);
  },

  /**
   * Kiểm tra email đã tồn tại
   */
  emailExists(email) {
    return this.getAllUsers().some((user) => user.email === email);
  },

  /**
   * Đăng ký người dùng mới
   */
  register(username, email, password) {
    // Kiểm tra dữ liệu
    if (!username || username.length < 3) {
      return { success: false, message: 'Tên người dùng phải từ 3 ký tự trở lên.' };
    }
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Email không hợp lệ.' };
    }
    if (!password || password.length < 6) {
      return { success: false, message: 'Mật khẩu phải từ 6 ký tự trở lên.' };
    }

    if (this.usernameExists(username)) {
      return { success: false, message: 'Tên người dùng đã tồn tại.' };
    }

    if (this.emailExists(email)) {
      return { success: false, message: 'Email đã được đăng ký.' };
    }

    // Tạo người dùng mới
    const users = this.getAllUsers();
    const newUser = {
      id: 'user_' + Date.now(),
      username,
      email,
      passwordHash: this.hashPassword(password),
      avatar: this.getDefaultAvatar(username),
      createdAt: new Date().toISOString(),
      bio: '',
      readChapters: [],
      favorites: [],
      ratings: {},
      reactions: { love: 0, like: 0, wow: 0, sad: 0 },
      comments: {},
      profile: {
        displayName: username,
        theme: 'dark',
        fontSize: 18,
        width: 840
      }
    };

    users.push(newUser);
    this.saveUsers(users);

    return { success: true, message: 'Đăng ký thành công!', user: newUser };
  },

  /**
   * Đăng nhập
   */
  login(username, password) {
    if (!username || !password) {
      return { success: false, message: 'Vui lòng nhập tên người dùng và mật khẩu.' };
    }

    const users = this.getAllUsers();
    const user = users.find((u) => u.username === username);

    if (!user) {
      return { success: false, message: 'Tên người dùng không tồn tại.' };
    }

    if (!this.verifyPassword(password, user.passwordHash)) {
      return { success: false, message: 'Mật khẩu không chính xác.' };
    }

    // Lưu session đăng nhập
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    localStorage.setItem(this.SESSION_KEY, JSON.stringify({
      userId: user.id,
      loginTime: Date.now(),
      lastActive: Date.now()
    }));

    return { success: true, message: 'Đăng nhập thành công!', user };
  },

  /**
   * Đăng xuất
   */
  logout() {
    localStorage.removeItem(this.CURRENT_USER_KEY);
    localStorage.removeItem(this.SESSION_KEY);
    return { success: true, message: 'Đã đăng xuất.' };
  },

  /**
   * Lấy người dùng hiện tại
   */
  getCurrentUser() {
    try {
      const session = JSON.parse(localStorage.getItem(this.SESSION_KEY));
      if (!session) return null;

      // Kiểm tra session còn hợp lệ không (24 giờ)
      const now = Date.now();
      if (now - session.loginTime > 24 * 60 * 60 * 1000) {
        this.logout();
        return null;
      }

      // Cập nhật lastActive
      session.lastActive = now;
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

      return JSON.parse(localStorage.getItem(this.CURRENT_USER_KEY));
    } catch {
      return null;
    }
  },

  /**
   * Kiểm tra người dùng đã đăng nhập
   */
  isLoggedIn() {
    return this.getCurrentUser() !== null;
  },

  /**
   * Cập nhật thông tin hồ sơ người dùng
   */
  updateProfile(updates) {
    const user = this.getCurrentUser();
    if (!user) return { success: false, message: 'Chưa đăng nhập.' };

    const users = this.getAllUsers();
    const userIndex = users.findIndex((u) => u.id === user.id);

    if (userIndex === -1) {
      return { success: false, message: 'Người dùng không tồn tại.' };
    }

    // Cập nhật thông tin
    const updatedUser = { ...users[userIndex], ...updates };
    users[userIndex] = updatedUser;
    this.saveUsers(users);

    // Cập nhật session
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(updatedUser));

    return { success: true, message: 'Cập nhật thành công.', user: updatedUser };
  },

  /**
   * Đổi mật khẩu
   */
  changePassword(currentPassword, newPassword) {
    const user = this.getCurrentUser();
    if (!user) return { success: false, message: 'Chưa đăng nhập.' };

    if (!this.verifyPassword(currentPassword, user.passwordHash)) {
      return { success: false, message: 'Mật khẩu hiện tại không chính xác.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'Mật khẩu mới phải từ 6 ký tự trở lên.' };
    }

    const users = this.getAllUsers();
    const userIndex = users.findIndex((u) => u.id === user.id);
    users[userIndex].passwordHash = this.hashPassword(newPassword);
    this.saveUsers(users);

    return { success: true, message: 'Đổi mật khẩu thành công.' };
  },

  /**
   * Tạo avatar mặc định từ tên người dùng
   */
  getDefaultAvatar(username) {
    const emojis = ['⚔️', '🗡️', '🛡️', '⚡', '🔥', '❄️', '💎', '🌟'];
    const charCode = username.charCodeAt(0);
    return emojis[charCode % emojis.length];
  },

  /**
   * Lấy thông tin người dùng theo ID
   */
  getUserById(userId) {
    return this.getAllUsers().find((u) => u.id === userId) || null;
  }
};

// Khởi tạo auth khi load file
AUTH.init();

interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'staff';
  createdAt: string;
}

interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'staff';
}

export class AuthService {
  private static USERS_KEY = 'app_users';
  private static CURRENT_USER_KEY = 'current_user';
  private static ADMIN_USERNAME = 'admin';
  private static ADMIN_PASSWORD = 'admin123'; // Default admin password

  // Initialize with default admin user
  static initializeDefaultAdmin() {
    const users = this.getAllUsers();
    if (users.length === 0) {
      const defaultAdmin: User = {
        id: 'admin-default',
        username: this.ADMIN_USERNAME,
        password: this.hashPassword(this.ADMIN_PASSWORD),
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      this.saveUser(defaultAdmin);
    }
  }

  // Simple hash function (NOT cryptographically secure, just for basic protection)
  private static hashPassword(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private static getAllUsers(): User[] {
    try {
      const data = localStorage.getItem(this.USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading users:', error);
      return [];
    }
  }

  private static saveUsers(users: User[]) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  private static saveUser(user: User) {
    const users = this.getAllUsers();
    users.push(user);
    this.saveUsers(users);
  }

  static login(username: string, password: string): AuthUser | null {
    const users = this.getAllUsers();
    const hashedPassword = this.hashPassword(password);
    
    const user = users.find(u => 
      u.username === username && u.password === hashedPassword
    );

    if (user) {
      const authUser: AuthUser = {
        id: user.id,
        username: user.username,
        role: user.role
      };
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(authUser));
      return authUser;
    }

    return null;
  }

  static logout() {
    localStorage.removeItem(this.CURRENT_USER_KEY);
  }

  static getCurrentUser(): AuthUser | null {
    try {
      const data = localStorage.getItem(this.CURRENT_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading current user:', error);
      return null;
    }
  }

  static isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  // Admin functions
  static createUser(username: string, password: string, role: 'admin' | 'staff'): boolean {
    const users = this.getAllUsers();
    
    if (users.some(u => u.username === username)) {
      return false; // Username already exists
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      username,
      password: this.hashPassword(password),
      role,
      createdAt: new Date().toISOString()
    };

    this.saveUser(newUser);
    return true;
  }

  static updateUser(userId: string, username: string, password: string | null, role: 'admin' | 'staff'): boolean {
    const users = this.getAllUsers();
    const index = users.findIndex(u => u.id === userId);
    
    if (index === -1) return false;

    // Check if username is taken by another user
    if (users.some(u => u.username === username && u.id !== userId)) {
      return false;
    }

    users[index] = {
      ...users[index],
      username,
      password: password ? this.hashPassword(password) : users[index].password,
      role
    };

    this.saveUsers(users);
    return true;
  }

  static deleteUser(userId: string): boolean {
    const users = this.getAllUsers();
    const filtered = users.filter(u => u.id !== userId);
    
    if (filtered.length === users.length) return false;
    
    this.saveUsers(filtered);
    return true;
  }

  static listUsers(): Array<{ id: string; username: string; role: 'admin' | 'staff'; createdAt: string }> {
    const users = this.getAllUsers();
    return users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      createdAt: u.createdAt
    }));
  }

  static changePassword(oldPassword: string, newPassword: string): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;

    const users = this.getAllUsers();
    const user = users.find(u => u.id === currentUser.id);
    
    if (!user || user.password !== this.hashPassword(oldPassword)) {
      return false;
    }

    return this.updateUser(currentUser.id, user.username, newPassword, user.role);
  }
}

// Initialize default admin on load
AuthService.initializeDefaultAdmin();

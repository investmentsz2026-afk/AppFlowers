import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  darkMode: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleDarkMode: () => void;
  initializeTheme: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  darkMode: true, // Default to true for dark mode

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleDarkMode: () => set((state) => {
    const nextMode = !state.darkMode;
    if (typeof window !== 'undefined') {
      localStorage.setItem('apkexcel_theme', nextMode ? 'dark' : 'light');
      if (nextMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    return { darkMode: nextMode };
  }),

  initializeTheme: () => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('apkexcel_theme');
      // Default to dark mode (true) if there is no saved theme
      const isDark = savedTheme ? savedTheme === 'dark' : true;
      
      if (isDark) {
        document.documentElement.classList.add('dark');
        set({ darkMode: true });
      } else {
        document.documentElement.classList.remove('dark');
        set({ darkMode: false });
      }
    }
  },
}));

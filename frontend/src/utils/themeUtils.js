export const getToastConfig = (theme = 'dark') => {
  return {
    position: 'top-right',
    toastOptions: {
      duration: 4000,
      style: {
        background: 'linear-gradient(135deg, #1a1b2e 0%, #0d0e1a 100%)',
        color: '#ffffff',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      success: {
        iconTheme: {
          primary: '#10B981',
          secondary: '#ffffff',
        },
      },
      error: {
        iconTheme: {
          primary: '#EF4444',
          secondary: '#ffffff',
        },
      },
    },
  };
};

export const initializeTheme = (theme = 'dark') => {
  const savedTheme = theme || localStorage.getItem('theme') || 'dark';
  
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(savedTheme);
  
  localStorage.setItem('theme', savedTheme);
  
  applyThemeToToasts(savedTheme);
  
  return savedTheme;
};

export const applyThemeToToasts = (theme) => {
  const toastContainers = document.querySelectorAll('[data-sonner-toaster], .Toaster, [role="status"]');
  
  toastContainers.forEach(container => {
    container.style.setProperty('--toast-bg', 'linear-gradient(135deg, #1a1b2e 0%, #0d0e1a 100%)');
    container.style.setProperty('--toast-color', '#ffffff');
    container.style.setProperty('--toast-border', 'rgba(255, 255, 255, 0.1)');
  });
};

export const getToastStyles = () => {
  return {
    background: 'linear-gradient(135deg, #1a1b2e 0%, #0d0e1a 100%)',
    color: '#ffffff',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  };
};

export const toggleTheme = (currentTheme) => {
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  return initializeTheme(newTheme);
};

export const getThemeAwareStyles = (theme = 'dark') => {
  return {
    background: 'linear-gradient(135deg, #1a1b2e 0%, #0d0e1a 100%)',
    color: '#ffffff',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  };
};

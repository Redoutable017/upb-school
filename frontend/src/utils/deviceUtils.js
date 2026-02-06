// frontend/src/utils/deviceUtils.js

/**
 * Détecte le type d'appareil et système d'exploitation
 * @returns {string} 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'unknown'
 */
export const detectDevice = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // Détection iOS
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'ios';
  }
  
  // Détection Android
  if (/android/i.test(userAgent)) {
    return 'android';
  }
  
  // Détection Windows
  if (/win/i.test(userAgent)) {
    return 'windows';
  }
  
  // Détection macOS
  if (/mac/i.test(userAgent)) {
    return 'macos';
  }
  
  // Détection Linux
  if (/linux/i.test(userAgent)) {
    return 'linux';
  }
  
  return 'unknown';
};

/**
 * Vérifie si la biométrie WebAuthn est disponible sur cet appareil
 * @returns {Promise<{available: boolean, type?: string}>}
 */
export const isBiometricAvailable = async () => {
  // Vérifier si WebAuthn est supporté
  if (!window.PublicKeyCredential) {
    console.warn('WebAuthn non supporté par ce navigateur');
    return { available: false, type: 'non_supported' };
  }
  
  // Vérifier si on est en HTTPS (requis en production sauf localhost)
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    console.warn('WebAuthn nécessite HTTPS en production');
    return { available: false, type: 'https_required' };
  }
  
  try {
    // Vérifier la disponibilité de l'authentificateur
    const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    
    if (!isAvailable) {
      console.warn('Authentificateur biométrique non disponible');
      return { available: false, type: 'no_authenticator' };
    }
    
    // Déterminer le type de biométrie selon l'appareil
    const device = detectDevice();
    let biometricType = 'Biométrie';
    
    switch (device) {
      case 'ios':
        // Vérifier si c'est un appareil avec Face ID ou Touch ID
        if (/iPhone X|iPhone XR|iPhone XS|iPhone 11|iPhone 12|iPhone 13|iPhone 14|iPhone 15/i.test(navigator.userAgent)) {
          biometricType = 'Face ID';
        } else if (/iPad|iPod/i.test(navigator.userAgent)) {
          // Les iPads récents ont Face ID, les anciens Touch ID
          biometricType = /iPad Pro/i.test(navigator.userAgent) ? 'Face ID' : 'Touch ID';
        } else {
          biometricType = 'Touch ID';
        }
        break;
        
      case 'android':
        biometricType = 'Empreinte digitale';
        break;
        
      case 'windows':
        biometricType = 'Windows Hello';
        break;
        
      case 'macos':
        biometricType = 'Touch ID';
        break;
        
      default:
        biometricType = 'Authentification biométrique';
    }
    
    return { available: true, type: biometricType };
    
  } catch (error) {
    console.error('Erreur vérification biométrie:', error);
    return { available: false, type: 'error', error: error.message };
  }
};

/**
 * Récupère le type de biométrie disponible
 * @returns {string} Type de biométrie (ex: "Face ID", "Windows Hello", etc.)
 */
export const getBiometricType = () => {
  const device = detectDevice();
  
  switch (device) {
    case 'ios':
      return /iPhone X|iPhone XR|iPhone XS|iPhone 11|iPhone 12|iPhone 13|iPhone 14|iPhone 15/i.test(navigator.userAgent) 
        ? 'Face ID' 
        : 'Touch ID';
      
    case 'android':
      return 'Empreinte digitale';
      
    case 'windows':
      return 'Windows Hello';
      
    case 'macos':
      return 'Touch ID';
      
    default:
      return 'Biométrie';
  }
};

/**
 * Enregistre les credentials biométriques pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} userName - Nom d'affichage de l'utilisateur
 * @returns {Promise<{success: boolean, error?: string, message?: string}>}
 */
export const registerBiometric = async (userId, userName) => {
  try {
    const bioAvailable = await isBiometricAvailable();
    
    if (!bioAvailable.available) {
      return {
        success: false,
        error: 'Biométrie non disponible',
        details: bioAvailable.type
      };
    }
    
    // Générer un challenge côté client (dans une vraie app, ça viendrait du serveur)
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    
    const publicKey = {
      challenge: challenge,
      rp: {
        name: "UPB School",
        id: window.location.hostname
      },
      user: {
        id: new TextEncoder().encode(userId),
        name: userName,
        displayName: userName
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required"
      },
      timeout: 60000,
      attestation: "none" // "none" pour plus de simplicité
    };
    
    const credential = await navigator.credentials.create({
      publicKey: publicKey
    });
    
    // Sauvegarder localement
    localStorage.setItem(`biometric_credential_${userId}`, credential.id);
    
    // Sauvegarder la clé publique (simplifié - dans une vraie app, envoyer au serveur)
    const publicKeyString = JSON.stringify({
      id: credential.id,
      rawId: Array.from(new Uint8Array(credential.rawId)),
      response: {
        attestationObject: Array.from(new Uint8Array(credential.response.attestationObject)),
        clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON))
      }
    });
    
    localStorage.setItem(`biometric_public_key_${userId}`, publicKeyString);
    
    return {
      success: true,
      message: 'Biométrie enregistrée avec succès'
    };
    
  } catch (error) {
    console.error('Erreur enregistrement biométrie:', error);
    
    let errorMessage = 'Erreur lors de l\'enregistrement biométrique';
    
    if (error.name === 'NotAllowedError') {
      errorMessage = 'Enregistrement annulé par l\'utilisateur';
    } else if (error.name === 'InvalidStateError') {
      errorMessage = 'Biométrie déjà enregistrée pour cet utilisateur';
    } else if (error.name === 'SecurityError') {
      errorMessage = 'Erreur de sécurité - HTTPS requis';
    }
    
    return {
      success: false,
      error: errorMessage,
      details: error.message
    };
  }
};

/**
 * Authentifie un utilisateur avec la biométrie
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<{success: boolean, error?: string, message?: string}>}
 */
export const authenticateWithBiometric = async (userId) => {
  try {
    const bioAvailable = await isBiometricAvailable();
    
    if (!bioAvailable.available) {
      return {
        success: false,
        error: 'Biométrie non disponible',
        details: bioAvailable.type
      };
    }
    
    // Récupérer le credential ID sauvegardé
    const credentialId = localStorage.getItem(`biometric_credential_${userId}`);
    
    if (!credentialId) {
      return {
        success: false,
        error: 'Aucune biométrie enregistrée pour cet utilisateur'
      };
    }
    
    // Générer un challenge (dans une vraie app, ça viendrait du serveur)
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    
    // Récupérer la clé publique sauvegardée
    const publicKeyString = localStorage.getItem(`biometric_public_key_${userId}`);
    let publicKeyData;
    
    if (publicKeyString) {
      publicKeyData = JSON.parse(publicKeyString);
    }
    
    const publicKey = {
      challenge: challenge,
      allowCredentials: [{
        id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)),
        type: 'public-key',
        transports: ['internal']
      }],
      timeout: 60000,
      userVerification: 'required'
    };
    
    const credential = await navigator.credentials.get({
      publicKey: publicKey
    });
    
    // Ici, dans une vraie app, vous enverriez la réponse au serveur pour vérification
    // Pour cette version simplifiée, on considère que c'est bon
    
    return {
      success: true,
      message: 'Authentification biométrique réussie'
    };
    
  } catch (error) {
    console.error('Erreur authentification biométrique:', error);
    
    let errorMessage = 'Erreur lors de l\'authentification biométrique';
    
    if (error.name === 'NotAllowedError') {
      errorMessage = 'Authentification annulée ou échouée';
    } else if (error.name === 'SecurityError') {
      errorMessage = 'Erreur de sécurité';
    }
    
    return {
      success: false,
      error: errorMessage,
      details: error.message
    };
  }
};

/**
 * Supprime les credentials biométriques d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 */
export const deleteBiometricCredentials = (userId) => {
  localStorage.removeItem(`biometric_credential_${userId}`);
  localStorage.removeItem(`biometric_public_key_${userId}`);
};

// Alias pour compatibilité
export const removeBiometric = deleteBiometricCredentials;

/**
 * Vérifie si un utilisateur a des credentials biométriques enregistrés
 * @param {string} userId - ID de l'utilisateur
 * @returns {boolean}
 */
export const hasBiometricCredentials = (userId) => {
  return !!localStorage.getItem(`biometric_credential_${userId}`);
};

/**
 * Récupère les classes CSS adaptatives selon l'appareil
 * @returns {Object} Classes CSS adaptatives
 */
export const getResponsiveClasses = () => {
  const device = detectDevice();
  const isMobile = device === 'android' || device === 'ios';
  
  return {
    container: isMobile ? 'px-4 py-2' : 'px-6 py-4',
    card: isMobile ? 'p-4' : 'p-6',
    button: isMobile ? 'py-3 text-base' : 'py-4 text-lg',
    fontSize: {
      h1: isMobile ? 'text-2xl' : 'text-4xl',
      h2: isMobile ? 'text-xl' : 'text-3xl',
      h3: isMobile ? 'text-lg' : 'text-2xl',
      body: isMobile ? 'text-sm' : 'text-base',
      small: isMobile ? 'text-xs' : 'text-sm'
    },
    spacing: {
      small: isMobile ? 'mt-2 mb-2' : 'mt-4 mb-4',
      medium: isMobile ? 'mt-4 mb-4' : 'mt-6 mb-6',
      large: isMobile ? 'mt-6 mb-6' : 'mt-8 mb-8'
    },
    device: device
  };
};

/**
 * Applique le thème au document
 * @param {string} theme - 'dark' ou 'light'
 */
export const applyTheme = (theme) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('theme', theme);
};

/**
 * Récupère le thème actuel
 * @returns {string} 'dark' ou 'light'
 */
export const getCurrentTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  return savedTheme || (systemPrefersDark ? 'dark' : 'light');
};
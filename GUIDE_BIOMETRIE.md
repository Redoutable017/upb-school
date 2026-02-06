# Guide Biométrie - UPB School

## Vue d'ensemble

L'authentification biométrique permet aux utilisateurs de se reconnecter rapidement en utilisant leur empreinte digitale, Face ID ou Windows Hello, sans ressaisir leur mot de passe.

---

## Comment ça fonctionne

### Activation

1. L'utilisateur va dans **Paramètres** > **Biométrie**
2. Clique sur "Activer la biométrie"
3. Le navigateur demande une authentification biométrique
4. Si réussie, un credential est créé et stocké

### Stockage

Les données biométriques sont stockées à deux endroits :

1. **LocalStorage (navigateur)** :
   - `biometric_credential_[userId]` : Credential WebAuthn
   - `biometric_public_key_[userId]` : Clé publique
   - `last_user_id` : Dernier utilisateur connecté

2. **Base de données** :
   - `users.biometrie_active` : Boolean indiquant si actif

### Connexion biométrique

1. Sur la page de connexion, l'app vérifie `last_user_id`
2. Si un credential existe pour cet utilisateur, le bouton "Connexion rapide" apparaît
3. Clic → Vérification biométrique par le navigateur
4. Si valide → Appel API `/api/auth/biometric-login` avec `userId`
5. Le backend vérifie `biometrie_active = true` et génère un JWT

---

## API WebAuthn

### Technologies utilisées

L'app utilise l'API Web Authentication (WebAuthn) native du navigateur :

```javascript
// Vérification de compatibilité
if (window.PublicKeyCredential) {
  const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  // true si biométrie disponible
}
```

### Création d'un credential

```javascript
const credential = await navigator.credentials.create({
  publicKey: {
    challenge: new Uint8Array(32), // Challenge aléatoire
    rp: { name: "UPB School", id: window.location.hostname },
    user: {
      id: new Uint8Array(16),
      name: user.email,
      displayName: user.prenom
    },
    pubKeyCredParams: [
      { alg: -7, type: "public-key" },  // ES256
      { alg: -257, type: "public-key" } // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform", // Biométrie de l'appareil
      userVerification: "required"
    }
  }
});
```

### Vérification d'un credential

```javascript
const assertion = await navigator.credentials.get({
  publicKey: {
    challenge: new Uint8Array(32),
    allowCredentials: [{
      id: storedCredentialId,
      type: "public-key"
    }]
  }
});
```

---

## Comportement après déconnexion

### Ce qui est conservé
- `last_user_id` : ID du dernier utilisateur
- `biometric_credential_[userId]` : Credentials biométriques
- `biometric_public_key_[userId]` : Clés publiques

### Ce qui est supprimé
- Token JWT (session)
- Données utilisateur en mémoire

### Résultat
L'utilisateur peut se reconnecter via biométrie même après s'être déconnecté.

---

## Compatibilité

### Appareils supportés

| Appareil | Méthode | Support |
|----------|---------|---------|
| iPhone/iPad | Face ID, Touch ID | Safari uniquement |
| Android | Empreinte, Face | Chrome, Firefox |
| Windows 10/11 | Windows Hello | Edge, Chrome |
| MacBook | Touch ID | Safari, Chrome |

### Navigateurs supportés

| Navigateur | Support |
|------------|---------|
| Chrome 67+ | Oui |
| Firefox 60+ | Oui |
| Safari 14+ | Oui |
| Edge 79+ | Oui |

### Détection de compatibilité

```javascript
// Dans deviceUtils.js
export const isBiometricAvailable = async () => {
  if (!window.PublicKeyCredential) return false;
  
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
};
```

---

## Sécurité

### Points forts

1. **Clés asymétriques** : La clé privée ne quitte jamais l'appareil
2. **Pas de données biométriques transmises** : Seule une signature est envoyée
3. **Lié à l'appareil** : Un credential ne fonctionne que sur l'appareil où il a été créé
4. **Vérification côté serveur** : Le backend vérifie que `biometrie_active = true`

### Limites

1. **LocalStorage** : Les credentials sont stockés localement (peuvent être effacés)
2. **Pas de sync** : L'activation sur un appareil ne s'applique pas aux autres
3. **Dépend du navigateur** : Effacer les données du navigateur supprime les credentials

---

## Fichiers concernés

### Frontend

```
src/
├── store/
│   └── preferencesStore.js  # Gestion des préférences persistantes
├── utils/
│   └── deviceUtils.js       # Fonctions biométriques
├── pages/
│   ├── Login.jsx            # Bouton connexion biométrique
│   └── Settings.jsx         # Activation/désactivation
```

### Backend

```
backend/
├── routes/
│   └── auth.js              # Route /biometric-login
```

---

## Flux détaillé

### Activation

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Settings   │     │  WebAuthn   │     │  Backend    │
│   Page      │     │    API      │     │    API      │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ Clic "Activer"    │                   │
       │ ─────────────────>│                   │
       │                   │                   │
       │    Vérif biométrique                  │
       │ <─────────────────│                   │
       │                   │                   │
       │ Si OK, créer credential               │
       │ ─────────────────>│                   │
       │                   │                   │
       │   Credential créé │                   │
       │ <─────────────────│                   │
       │                   │                   │
       │ Stocker dans LocalStorage             │
       │                   │                   │
       │ PUT /user/preferences                 │
       │ ──────────────────────────────────────>
       │                   │                   │
       │     biometrie_active = true           │
       │ <──────────────────────────────────────
```

### Connexion

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login     │     │  WebAuthn   │     │  Backend    │
│   Page      │     │    API      │     │    API      │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ Vérif last_user_id                    │
       │                   │                   │
       │ Vérif credential existe               │
       │                   │                   │
       │ Afficher bouton biométrie             │
       │                   │                   │
       │ Clic "Connexion rapide"               │
       │ ─────────────────>│                   │
       │                   │                   │
       │    Vérif biométrique                  │
       │ <─────────────────│                   │
       │                   │                   │
       │ Si OK, POST /biometric-login          │
       │ ──────────────────────────────────────>
       │                   │                   │
       │     Vérif biometrie_active            │
       │                   │                   │
       │     Générer JWT + user data           │
       │ <──────────────────────────────────────
       │                   │                   │
       │ Connexion réussie!│                   │
```

---

## Désactivation

Pour désactiver la biométrie :

1. Aller dans Paramètres > Biométrie
2. Cliquer sur "Désactiver"
3. L'app supprime le credential du LocalStorage
4. L'app met à jour `biometrie_active = false` en base

```javascript
// Désactivation
localStorage.removeItem(`biometric_credential_${userId}`);
localStorage.removeItem(`biometric_public_key_${userId}`);

await userAPI.updatePreferences({ biometrie_active: false });
```

---

## Dépannage

### "Biométrie non disponible"
- Vérifier que l'appareil a une méthode biométrique configurée
- Vérifier que le navigateur supporte WebAuthn
- Sur iOS, utiliser Safari uniquement

### "Connexion biométrique échouée"
- Le credential a peut-être été effacé (données du navigateur)
- Désactiver puis réactiver la biométrie dans les paramètres

### "Le bouton de connexion rapide n'apparaît pas"
- S'assurer d'avoir activé la biométrie une première fois
- Vérifier que `last_user_id` est dans le LocalStorage

# Configuration Cloudinary pour PipoMarket

Ce guide vous explique comment configurer Cloudinary pour gérer l'upload d'images dans l'application (chats, logos de startups, produits, avatars).

## Pourquoi Cloudinary ?

Cloudinary offre un plan gratuit généreux et ne nécessite pas de configuration complexe de règles de sécurité comme Firebase Storage.

## Étapes de configuration

### 1. Créer un compte Cloudinary

1. Allez sur [cloudinary.com](https://cloudinary.com)
2. Cliquez sur "Sign Up" et créez un compte gratuit
3. Une fois connecté, vous arriverez sur le Dashboard

### 2. Récupérer vos credentials

Sur le Dashboard Cloudinary, vous trouverez :
- **Cloud Name** : c'est votre identifiant unique (ex: `dxxxxx`)
- Notez ce Cloud Name, vous en aurez besoin

### 3. Créer un Upload Preset (Important !)

Un upload preset permet d'uploader des images depuis l'application mobile sans exposer vos clés API.

1. Dans le menu de gauche, allez dans **Settings** (⚙️)
2. Cliquez sur l'onglet **Upload**
3. Scrollez jusqu'à "Upload presets"
4. Cliquez sur **Add upload preset**
5. Configurez le preset :
   - **Preset name** : `pipomarket_unsigned` (ou un autre nom)
   - **Signing Mode** : **Unsigned** (IMPORTANT !)
   - **Folder** : laissez vide (géré par l'app)
   - **Access mode** : Public
   - **Unique filename** : true
   - **Overwrite** : false
6. Cliquez sur **Save**
7. Notez le nom du preset créé

### 4. Configurer l'application

Ouvrez le fichier `app.json` et remplacez les valeurs suivantes :

```json
"extra": {
  "eas": {
    "projectId": "votre-project-id-eas-ici"
  },
  "cloudinaryCloudName": "VOTRE_CLOUD_NAME_ICI",
  "cloudinaryUploadPreset": "pipomarket_unsigned"
}
```

Remplacez :
- `VOTRE_CLOUD_NAME_ICI` par votre Cloud Name récupéré à l'étape 2
- `pipomarket_unsigned` par le nom de votre upload preset créé à l'étape 3

### 5. Redémarrer l'application

```bash
# Arrêtez l'application si elle tourne
# Puis relancez :
npm start
```

## Organisation des dossiers dans Cloudinary

L'application organise automatiquement les images dans des dossiers :

- `pipomarket/chat/{conversationId}/` - Images envoyées dans les chats
- `pipomarket/logos/` - Logos des startups
- `pipomarket/products/` - Images des produits
- `pipomarket/avatars/` - Photos de profil des utilisateurs

## Limites du plan gratuit

Le plan gratuit Cloudinary offre :
- 25 GB de stockage
- 25 GB de bande passante/mois
- 25 000 transformations/mois

C'est largement suffisant pour démarrer ! 🚀

## Vérification

Pour vérifier que tout fonctionne :

1. Lancez l'application
2. Essayez d'envoyer une image dans un chat
3. Essayez d'uploader un logo de startup
4. Connectez-vous sur Cloudinary Dashboard
5. Allez dans **Media Library** pour voir vos images uploadées

## Dépannage

### Erreur "Invalid upload preset"
- Vérifiez que le preset existe dans Cloudinary
- Vérifiez qu'il est bien en mode "Unsigned"
- Vérifiez l'orthographe du nom du preset dans app.json

### Erreur "Invalid cloud name"
- Vérifiez votre Cloud Name dans le Dashboard Cloudinary
- Vérifiez l'orthographe dans app.json

### Les images ne s'affichent pas
- Vérifiez que l'upload a réussi dans la Media Library Cloudinary
- Vérifiez votre connexion Internet
- Vérifiez les logs de l'application

## Support

Pour plus d'informations sur Cloudinary :
- [Documentation Cloudinary](https://cloudinary.com/documentation)
- [Upload Presets Guide](https://cloudinary.com/documentation/upload_presets)

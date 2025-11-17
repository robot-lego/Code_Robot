# Projet Robot EV3

Ce projet permet de contrôler un robot EV3 via un serveur HTTP local. Il comprend deux scripts principaux qui permettent de piloter les moteurs, lire les capteurs et émettre des sons.

---

## 📂 Contenu du projet

- `robot_server.py` : Script Python pour le contrôle du robot et la lecture des capteurs EV3.  
- `intscript.js` : Dossier contenant le code JavaScript pour l’interface mobile.   
- `README.md` : Documentation du projet.

---

## ⚙️ Fonctionnalités

### Moteurs
 Controler avec boutons ou avec accéléromètre ou gyroscope :
- Avancer et reculer
- Tourner à gauche et à droite
- Monter et descendre la barre
- Stop moteurs

### Capteurs
- Capteur ultrasonique
- Capteur de couleur
- Gyroscope

### Son
- Fonction `beeper()` pour jouer une mélodie avec le haut-parleur du robot qui correspond a son klaxon pour prévenir les autres usagers de la route.

### Serveur HTTP
- Permet de contrôler le robot à distance via des requêtes HTTP :
  - `/avancer`
  - `/reculer`
  - `/gauche`
  - `/droite`
  - `/stop`
  - `/upbarre`
  - `/downbarre`
  - `/stopbarre`
  - `/beeper`
  - Sinon, retourne les données des capteurs en JSON

---

## 💻 Installation des dépendances

Les scripts utilisent **Pybricks MicroPython**, inclus dans le firmware du robot EV3. Les modules utilisés sont :

- `pybricks.hubs`
- `pybricks.ev3devices`
- `pybricks.parameters`
- `pybricks.tools`
- `socket`
- `ujson`

Si vous utilisez MicroPython sur un PC pour tester le code (hors EV3), vous pouvez installer `ujson` avec :

```bash
pip install ujson

import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";

import MiniMap from "./MiniMap"; // ⬅️ IMPORTANT : ajoute MiniMap.js à côté

export default class App extends React.Component {
  state = {
    ev3IP: "192.168.1.191",
    sensors: {},
    ev3OK: true,

    // Position robot
    xr: 0,
    yr: 0,
    angle: 0,

    // encodeurs précédents
    prevLeft: 0,
    prevRight: 0,

    // données environnement
    obstacles: [],
    samples: [],
  };

  componentDidMount() {
    this.interval = setInterval(this.fetchSensorData, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  // ---- Protection timeout ----
  fetchWithTimeout = (url, options, timeout = 1500) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), timeout)
      ),
    ]);
  };

  // ---- Mise à jour position robot ----
  updateRobotPosition(left_deg, right_deg) {
    const { prevLeft, prevRight, xr, yr, angle } = this.state;

    const R = 28;     // rayon roue en mm
    const L = 120;    // distance entre roues en mm

    const deltaL = (left_deg - prevLeft) * (2 * Math.PI * R) / 360;
    const deltaR = (right_deg - prevRight) * (2 * Math.PI * R) / 360;

    const deltaD = (deltaL + deltaR) / 2;
    const deltaTheta = (deltaR - deltaL) / L;

    const newAngle = angle + deltaTheta;

    const newX = xr + deltaD * Math.cos(newAngle);
    const newY = yr + deltaD * Math.sin(newAngle);

    this.setState({
      xr: newX,
      yr: newY,
      angle: newAngle,
      prevLeft: left_deg,
      prevRight: right_deg,
    });
  }

  // ---- Récupération capteurs ----
  fetchSensorData = async () => {
    const url = `http://${this.state.ev3IP}:8081/`;

    try {
      const response = await this.fetchWithTimeout(url);
      const data = await response.json();

      // Mise à jour position
      if (
        data.motor_position &&
        data.motor_position.left_deg !== undefined &&
        data.motor_position.right_deg !== undefined
      ) {
        this.updateRobotPosition(
          data.motor_position.left_deg,
          data.motor_position.right_deg
        );
      }

      // Mise à jour obstacle & bobarium
      this.setState({
        sensors: data,
        ev3OK: true,
        obstacles: data.obstacles || [],
        samples: data.samples || [],
      });

    } catch (error) {
      this.setState({ ev3OK: false });
    }
  };

  // ---- Commande EV3 ----
  sendCommand = async (command) => {
    const url = `http://${this.state.ev3IP}:8081/${command}`;
    try {
      await this.fetchWithTimeout(url);
    } catch (error) {
      this.setState({ ev3OK: false });
      // Alert.alert("Erreur", "Le robot EV3 ne répond plus.");
    }
  };

  render() {
    const {
      sensors,
      ev3OK,
      xr,
      yr,
      angle,
      obstacles,
      samples
    } = this.state;

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🚗 Contrôle du Robot EV3</Text>

        {!ev3OK && (
          <Text style={styles.errorText}>
            ❌ Robot non détecté – vérifie IP ou connexion
          </Text>
        )}

        {/* Mini-map */}
        <View style={styles.mapFrame}>
          <Text style={styles.mapTitle}>🗺️ Carte du robot</Text>

          <MiniMap
            robot={{ x: xr, y: yr, angle }}
            obstacles={obstacles}
            samples={samples}
          />
        </View>

        {/* Direction */}
        <TouchableOpacity
          style={[styles.bouton, styles.boutonAvant]}
          onPress={() => this.sendCommand("avancer")}
        >
          <Text style={styles.texte}>⬆️</Text>
        </TouchableOpacity>

        <View style={styles.middleRow}>
          <TouchableOpacity
            style={[styles.bouton, styles.boutonGauche]}
            onPress={() => this.sendCommand("gauche")}
          >
            <Text style={styles.texte}>⬅️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bouton, styles.boutonStop]}
            onPress={() => this.sendCommand("stop")}
          >
            <Text style={styles.texteStop}>🛑</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bouton, styles.boutonDroite]}
            onPress={() => this.sendCommand("droite")}
          >
            <Text style={styles.texte}>➡️</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.bouton, styles.boutonArriere]}
          onPress={() => this.sendCommand("reculer")}
        >
          <Text style={styles.texte}>⬇️</Text>
        </TouchableOpacity>

        {/* Commande barre */}
        <Text style={styles.sectionTitle}>Commande barre</Text>
        <View style={styles.barreControls}>
          <TouchableOpacity
            style={[styles.bouton, styles.boutonBarre]}
            onPress={() => this.sendCommand("upbarre")}
          >
            <Text style={styles.texte}>⬆️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bouton, styles.boutonBarre]}
            onPress={() => this.sendCommand("downbarre")}
          >
            <Text style={styles.texte}>⬇️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bouton, styles.boutonBarreStop]}
            onPress={() => this.sendCommand("stopbarre")}
          >
            <Text style={styles.texte}>🛑</Text>
          </TouchableOpacity>
        </View>

        {/* Son */}
        <Text style={styles.sectionTitle}>Signal sonore</Text>
        <TouchableOpacity
          style={[styles.bouton, styles.boutonSonore]}
          onPress={() => this.sendCommand("beep")}
        >
          <Text style={styles.texte}>🔔</Text>
        </TouchableOpacity>

        {/* LEDs */}
        <Text style={styles.sectionTitle}>LED</Text>
        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          <TouchableOpacity
            style={[styles.bouton, { width: 76, height: 58, marginHorizontal: 6 }]}
            onPress={() => this.sendCommand("onled")}
          >
            <Text style={styles.texte}>💡</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bouton, { width: 76, height: 58, marginHorizontal: 6 }]}
            onPress={() => this.sendCommand("offled")}
          >
            <Text style={styles.texte}>❌💡</Text>
          </TouchableOpacity>
        </View>

        {/* Capteurs */}
        <View style={styles.sensorCard}>
          <Text style={styles.sensorTitle}>📡 Capteurs en temps réel</Text>

          <Text style={styles.sensorText}>
            Gauche : {sensors.motor_position?.left_deg ?? "—"}°
          </Text>
          <Text style={styles.sensorText}>
            Droite : {sensors.motor_position?.right_deg ?? "—"}°
          </Text>
          <Text style={styles.sensorText}>
            📏 Distance : {sensors.ultrasonic_mm ?? "—"} mm
          </Text>
          <Text style={styles.sensorText}>
            🎨 Couleur : {sensors.color ? `(${sensors.color.reflection}%)` : "—"}
          </Text>
          <Text style={styles.sensorText}>
            🧭 Gyro : {sensors.gyro_deg ?? "—"}°
          </Text>
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F2F6FA',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 24,
    color: '#0A84FF',
    fontWeight: '700',
    marginBottom: 16,
  },
  zoneSaisie: {
    backgroundColor: '#FFFFFF',
    color: '#0F1720',
    borderWidth: 0,
    borderRadius: 12,
    width: '88%',
    padding: 12,
    marginBottom: 18,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  bouton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
    width: 80,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 6,
  },
  boutonAvant: { backgroundColor: '#FFFFFF' },
  boutonArriere: { backgroundColor: '#FFFFFF' },
  boutonGauche: { backgroundColor: '#FFFFFF' },
  boutonDroite: { backgroundColor: '#FFFFFF' },
  boutonStop: {
    backgroundColor: '#FFFFFF',
    width: 84,
    height: 64,
    borderWidth: 0,
  },
  texte: {
    color: '#0F1720',
    fontSize: 20,
    fontWeight: '700',
  },
  texteStop: {
    color: '#FF3B30',
    fontSize: 20,
    fontWeight: '800',
  },

  mapGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 18,
    borderWidth: 0,
  },
  mapTitle: {
    fontSize: 15,
    color: '#1C1C1E',
    marginBottom: 8,
    fontWeight: '600',
  },
  sensorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '92%',
    marginTop: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  sensorTitle: {
    fontSize: 16,
    color: '#0A84FF',
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  sensorText: {
    color: '#3C3C43',
    fontSize: 15,
    marginVertical: 4,
  },
  barreControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 10,
  },
  boutonBarre: {
    backgroundColor: '#FFFFFF',
    width: 76,
    height: 58,
    marginHorizontal: 6,
    borderRadius: 12,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boutonBarreStop: {
    backgroundColor: '#FFFFFF',
    width: 76,
    height: 58,
    marginHorizontal: 6,
    borderRadius: 12,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boutonSonore: {
    backgroundColor: '#FFFFFF',
    width: 76,
    height: 58,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
});


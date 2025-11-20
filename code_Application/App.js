import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from "react-native";

import { Accelerometer } from "expo-sensors";
import MiniMap from "./MiniMap";

export default class App extends React.Component {
  state = {
    ev3IP: "192.168.1.191",

    sensors: {},
    accel: { x: 0, y: 0, z: 0 },

    // Commande auto (anti-spam)
    lastCommand: "",

    // Mode Tilt
    tiltMode: false,

    ev3OK: true,

    // Position robot
    xr: 0,
    yr: 0,
    angle: 0,

    // encodeurs précédents
    prevLeft: 0,
    prevRight: 0,

    // environnement
    obstacles: [],
    samples: [],
  };

  componentDidMount() {
    this.interval = setInterval(this.fetchSensorData, 1000);

    // Accelerometer
    Accelerometer.setUpdateInterval(120);

    this.accelSub = Accelerometer.addListener((data) => {
      const { accel } = this.state;
      if (
        Math.abs(data.x - accel.x) > 0.05 ||
        Math.abs(data.y - accel.y) > 0.05 ||
        Math.abs(data.z - accel.z) > 0.05
      ) {
        this.setState({ accel: data });

        if (this.state.tiltMode) {
          this.handleTiltControl(data);
        }
      }
    });
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    if (this.accelSub) this.accelSub.remove();
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

  // ---- Calcul déplacement robot ----
  updateRobotPosition(left_deg, right_deg) {
    const { prevLeft, prevRight, xr, yr, angle } = this.state;

    const R = 28; // rayon roue mm
    const L = 120; // distance entre roues mm

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

      // Support deux formats différents
      const left =
        data.motor_position?.left_deg ?? data.left_motor_deg ?? undefined;
      const right =
        data.motor_position?.right_deg ?? data.right_motor_deg ?? undefined;

      if (left !== undefined && right !== undefined) {
        this.updateRobotPosition(left, right);
      }

      this.setState({
        sensors: data,
        obstacles: data.obstacles || [],
        samples: data.samples || [],
        ev3OK: true,
      });
    } catch (error) {
      this.setState({ ev3OK: false });
    }
  };

  // ---- Envoi commandes ----
  sendCommand = async (command) => {
    if (command === this.state.lastCommand) return;

    this.setState({ lastCommand: command });

    const url = `http://${this.state.ev3IP}:8081/${command}`;
    try {
      await this.fetchWithTimeout(url);
    } catch (error) {
      this.setState({ ev3OK: false });
    }
  };

  // ---- Contrôle inclinaison ----
  handleTiltControl = (data) => {
    const { x, y } = data;

    const forwardThreshold = -0.3;
    const backwardThreshold = 0.3;
    const leftThreshold = -0.3;
    const rightThreshold = 0.3;

    if (y < forwardThreshold) return this.sendCommand("avancer");
    if (y > backwardThreshold) return this.sendCommand("reculer");
    if (x < leftThreshold) return this.sendCommand("droite");
    if (x > rightThreshold) return this.sendCommand("gauche");

    this.sendCommand("stop");
  };

  // ---- Activation / désactivation mode tilt ----
  toggleTiltMode = () => {
    const t = !this.state.tiltMode;

    this.setState({ tiltMode: t });

    if (!t) {
      this.sendCommand("stop");
    }
  };

  render() {
    const {
      sensors,
      tiltMode,
      ev3OK,
      xr,
      yr,
      angle,
      obstacles,
      samples,
    } = this.state;

    // Lecture sécurisée des capteurs
    const leftDeg =
      sensors.motor_position?.left_deg ?? sensors.left_motor_deg ?? "—";

    const rightDeg =
      sensors.motor_position?.right_deg ?? sensors.right_motor_deg ?? "—";

    const colorName = sensors.color?.name ?? "—";
    const reflection = sensors.color?.reflection ?? "—";

    const gyro = sensors.gyro_deg ?? "—";

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🚗 Contrôle du Robot EV3</Text>

        {!ev3OK && (
          <Text style={styles.errorText}>
            ❌ Robot non détecté - vérifie IP ou connexion
          </Text>
        )}

        {/* ---- SWITCH MODE TILT ---- */}
        <TouchableOpacity
          style={[
            styles.switchButton,
            tiltMode ? styles.onMode : styles.offMode,
          ]}
          onPress={this.toggleTiltMode}
        >
          <Text style={styles.switchText}>
            {tiltMode
              ? "🔄 Mode Inclinaison"
              : "🎮 Mode Boutons"}
          </Text>
        </TouchableOpacity>

        {/* ---- MINI MAP ---- */}
        <View style={styles.mapFrame}>
          <Text style={styles.mapTitle}>🗺️ Carte du robot</Text>

          <MiniMap
            robot={{ x: xr, y: yr, angle }}
            obstacles={obstacles}
            samples={samples}
          />
        </View>

        {/* ---- CONTROLES BOUTONS uniquement si pas Tilt ---- */}
        {!tiltMode && (
          <>
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
          </>
        )}

        {/* ---- COMMANDE BARRE ---- */}
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

          <TouchableOpacity
            style={[styles.bouton, styles.boutonSon]}
            onPress={() => this.sendCommand("beeper")}
          >
            <Text style={styles.texte}>🔊</Text>
          </TouchableOpacity>
        </View>

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

        {/* ---- CSV ---- */}
        <View style={styles.barreControls}>
          <TouchableOpacity
            style={[styles.bouton, styles.boutonCSV]}
            onPress={() =>
              Linking.openURL(`http://${this.state.ev3IP}:8081/csv`)
            }
          >
            <Text style={styles.texte}>CSV</Text>
          </TouchableOpacity>
        </View>

        {/* ---- CAPTEURS ---- */}
        <View style={styles.sensorCard}>
          <Text style={styles.sensorTitle}>📡 Capteurs en temps réel</Text>

          <Text style={styles.sensorText}>Gauche : {leftDeg}°</Text>
          <Text style={styles.sensorText}>Droite : {rightDeg}°</Text>
          <Text style={styles.sensorText}>
            Distance : {sensors.ultrasonic_mm ?? "—"} mm
          </Text>
          <Text style={styles.sensorText}>
            Couleur : {colorName} ({reflection}%)
          </Text>
          <Text style={styles.sensorText}>
            Gyroscope : {gyro}°
          </Text>
        </View>
      </ScrollView>
    );
  }
}

//
// -------------------------------
// STYLES
// -------------------------------
//

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F2F6FA",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 12,
  },

  title: {
    fontSize: 24,
    color: "#0A84FF",
    fontWeight: "700",
    marginBottom: 16,
  },

  errorText: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
  },

  // ---- TILT MODE BUTTON ----
  switchButton: {
    padding: 10,
    borderRadius: 10,
    width: "80%",
    marginBottom: 20,
    alignItems: "center",
  },
  onMode: { backgroundColor: "#238636" },
  offMode: { backgroundColor: "#1F6FEB" },
  switchText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },

  // ---- MINI MAP ----
  mapFrame: {
    backgroundColor: "#FFF",
    padding: 12,
    marginBottom: 16,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  mapTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 6,
    textAlign: "center",
  },

  // ---- BOUTONS ----
  bouton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    margin: 8,
    width: 80,
    height: 64,
    backgroundColor: "#FFFFFF",
    elevation: 6,
  },

  boutonAvant: { backgroundColor: "#FFFFFF" },
  boutonArriere: { backgroundColor: "#FFFFFF" },
  boutonGauche: { backgroundColor: "#FFFFFF" },
  boutonDroite: { backgroundColor: "#FFFFFF" },
  boutonStop: { backgroundColor: "#FFFFFF" },

  texte: {
    color: "#0F1720",
    fontSize: 20,
    fontWeight: "700",
  },
  texteStop: {
    color: "#FF3B30",
    fontSize: 20,
    fontWeight: "800",
  },

  middleRow: {
    flexDirection: "row",
    justifyContent: "center",
  },

  // ---- BARRE ----
  barreControls: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  boutonBarre: { backgroundColor: "#FFFFFF" },
  boutonBarreStop: { backgroundColor: "#FFFFFF" },
  boutonSon: { backgroundColor: "#FFFFFF" },

  boutonCSV: {
    backgroundColor: "#D29922",
    width: 90,
    height: 58,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  // ---- CAPTEURS ----
  sensorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    width: "92%",
    marginTop: 18,
    elevation: 4,
  },
  sensorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0A84FF",
    marginBottom: 8,
    textAlign: "center",
  },
  sensorText: {
    color: "#3C3C43",
    fontSize: 15,
    marginVertical: 4,
  },
});

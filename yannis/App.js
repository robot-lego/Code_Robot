import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Accelerometer } from "expo-sensors";
import { Linking } from "react-native";

export default class App extends React.Component {
  state = {
    ev3IP: "192.168.1.179",
    sensors: {},
    accel: { x: 0, y: 0, z: 0 },
    lastCommand: "",
    tiltMode: false,
  };

  componentDidMount() {
    this.interval = setInterval(this.fetchSensorData, 1000);

    Accelerometer.setUpdateInterval(120);

    this.accelSub = Accelerometer.addListener((data) => {
      this.setState({ accel: data });

      // Le contrôle Tilt ne s'exécute que si tiltMode = true
      if (this.state.tiltMode) {
        this.handleTiltControl(data);
      }
    });
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    if (this.accelSub) this.accelSub.remove();
  }

  // ---- Récupération capteurs ----
  fetchSensorData = async () => {
    const url = `http://${this.state.ev3IP}:8081/`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      this.setState({ sensors: data });
    } catch (error) {}
  };

  // ---- Envoi commandes ----
  sendCommand = async (command) => {
    if (command === this.state.lastCommand) return;

    this.setState({ lastCommand: command });

    const url = `http://${this.state.ev3IP}:8081/${command}`;
    try {
      await fetch(url);
    } catch (error) {}
  };

  // ---- Contrôle par inclinaison ----
  handleTiltControl = (data) => {
    const { x, y } = data;

    const forwardThreshold = -0.3;
    const backwardThreshold = 0.3;
    const leftThreshold = -0.3;
    const rightThreshold = 0.3;

    if (y < forwardThreshold) {
      this.sendCommand("avancer");
      return;
    }

    if (y > backwardThreshold) {
      this.sendCommand("reculer");
      return;
    }

    if (x < leftThreshold) {
      this.sendCommand("gauche");
      return;
    }

    if (x > rightThreshold) {
      this.sendCommand("droite");
      return;
    }

    this.sendCommand("stop");
  };

  // ---- Bouton de switch ----
  toggleTiltMode = () => {
    this.setState({ tiltMode: !this.state.tiltMode });

    // Dès qu'on quitte le mode tilt → STOP robot
    if (this.state.tiltMode === true) {
      this.sendCommand("stop");
    }
  };

  render() {
    const { sensors, tiltMode } = this.state;

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🚗 Contrôle Robot EV3</Text>

        {/* Switch Tilt Mode */}
        <TouchableOpacity
          style={[styles.switchButton, tiltMode ? styles.onMode : styles.offMode]}
          onPress={this.toggleTiltMode}
        >
          <Text style={styles.switchText}>
            {tiltMode ? "🔄 Mode Inclinaison (ON)" : "🎮 Mode Boutons (ON)"}
          </Text>
        </TouchableOpacity>

        {/* Mode boutons seulement si Tilt OFF */}
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

        {/* Commande de la barre */}
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
            style={[styles.bouton, styles.boutonSave]}
            onPress={() => this.sendCommand("beeper")}
          >
            <Text style={styles.texte}>🔊</Text>
          </TouchableOpacity>

        </View>


        {/*bouton pour telecharger les donnees des capteurs en csv sur le robot ev3 et bouton pour recuperer le csv sur son telephone*/}
        <View style={styles.barreControls}>
          <TouchableOpacity
            style={[styles.bouton, styles.boutonSave]}
            onPress={() => {
              Linking.openURL("http://" + this.state.ev3IP + ":8081/csv");
            }}
          >
            <Text style={styles.texte}>CSV</Text>
          </TouchableOpacity>

        </View>

        {/* Capteurs */} 
        <View style={styles.sensorCard}>
          <Text style={styles.sensorTitle}>📡 Capteurs en temps réel</Text>

          <Text style={styles.sensorText}>
            Angle roue gauche : {sensors.left_motor_deg ?? "—"}°
          </Text>

          <Text style={styles.sensorText}>
            Angle roue droite : {sensors.right_motor_deg ?? "—"}°
          </Text>

          <Text style={styles.sensorText}>
            Distance : {sensors.ultrasonic_mm ?? "—"} mm
          </Text>

          <Text style={styles.sensorText}>
            Couleur :{" "}
            {sensors.color
              ? `${sensors.color.name} (${sensors.color.reflection}%)`
              : "—"}
          </Text>

          <Text style={styles.sensorText}>
            Gyroscope : {sensors.gyro_deg ?? "—"}°
          </Text>
        </View>
      </ScrollView>
    );
  }
}

// ====================
// Styles
// ====================
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#0D1117",
    alignItems: "center",
    paddingVertical: 30,
  },
  title: {
    fontSize: 24,
    color: "#58A6FF",
    fontWeight: "bold",
    marginBottom: 15,
  },

  // BUTTON SWITCH MODE
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

  bouton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    margin: 8,
    width: 100,
    height: 50,
  },
  boutonAvant: { backgroundColor: "#2EA043" },
  boutonArriere: { backgroundColor: "#8B949E" },
  boutonGauche: { backgroundColor: "#58A6FF" },
  boutonDroite: { backgroundColor: "#58A6FF" },
  boutonStop: { backgroundColor: "#F85149", width: 80, height: 50 },

  texte: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  texteStop: { color: "#FFF", fontSize: 18, fontWeight: "bold" },

  middleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    fontSize: 18,
    color: "#58A6FF",
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
  },

  sensorCard: {
    backgroundColor: "#161B22",
    borderRadius: 15,
    padding: 20,
    width: "85%",
    marginTop: 20,
    borderColor: "#30363D",
    borderWidth: 1,
  },
  sensorTitle: {
    fontSize: 18,
    color: "#58A6FF",
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  sensorText: {
    color: "#C9D1D9",
    fontSize: 16,
    marginVertical: 3,
  },

  barreControls: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  boutonBarre: { backgroundColor: "#1F6FEB", width: 90 },
  boutonBarreStop: { backgroundColor: "#F85149", width: 90 },
  boutonSave: { backgroundColor: "#D29922", width: 90 },
});

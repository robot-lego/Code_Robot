import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
// Robot n2
export default class App extends React.Component {
  state = {
    ev3IP: "192.168.1.191", // IP du robot EV3
    sensors: {}, // données capteurs
  };

  componentDidMount() {
    // Récupération automatique des capteurs toutes les secondes
    this.interval = setInterval(this.fetchSensorData, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  // ---- Récupération des données des capteurs ----
  fetchSensorData = async () => {
    const url = `http://${this.state.ev3IP}:8081/`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      this.setState({ sensors: data });
    } catch (error) {
      // console.warn("Erreur de récupération des capteurs :", error.message);
    }
  };

  // ---- Envoi de commandes ----
  sendCommand = async (command) => {
    const url = `http://${this.state.ev3IP}:8081/${command}`;
    try {
      await fetch(url);
    } catch (error) {
      // console.warn("Erreur de commande :", error.message);
    }
  };

  render() {
    const { sensors } = this.state;

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View pointerEvents="none" style={[styles.bgSphere, styles.bgSphereTopLeft]} />
        <View pointerEvents="none" style={[styles.bgSphere, styles.bgSphereBottomRight]} />
        <Text style={styles.title}>🚗 Contrôle du Robot EV3</Text>

        <View style={styles.mapFrame}>
          <Text style={styles.mapTitle}>🗺️ Carte du robot</Text>
          {/* La carte sera affichée ici */}
        </View>

        {/* Boutons directionnels */}
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
          {/* Contrôles de la barre */}
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

          {/* Bouton sonore */}
          <Text style={styles.sectionTitle}>Signal sonore</Text>
          <TouchableOpacity
            style={[styles.bouton, styles.boutonSonore]}
            onPress={() => this.sendCommand("beep")}
          >
            <Text style={styles.texte}>🔔</Text>
          </TouchableOpacity>

          {/* Boutons LED */}
          <Text style={styles.sectionTitle}>LED</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8 }}>
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

        {/* Affichage des capteurs */}
        <View style={styles.sensorCard}>
          <Text style={styles.sensorTitle}>📡 Capteurs en temps réel</Text>

            <Text style={styles.sensorText}>
              Gauche :{" "}
              {sensors.motor_position && sensors.motor_position.left_deg !== undefined
                ? `${sensors.motor_position.left_deg}°`
                : "—"}
          </Text>
          <Text style={styles.sensorText}>
            Droite :{" "}
            {sensors.motor_position && sensors.motor_position.right_deg !== undefined
              ? `${sensors.motor_position.right_deg}°`
              : "—"}
          </Text>

          <Text style={styles.sensorText}>
            📏 Distance (Ultrason) :{" "}
            {sensors.ultrasonic_mm !== undefined
              ? `${sensors.ultrasonic_mm} mm`
              : "—"}
          </Text>

          <Text style={styles.sensorText}>
            🎨 Couleur :{" "}
            {sensors.color
              ? `${sensors.color.name} (${sensors.color.reflection}%)`
              : "—"}
          </Text>

          <Text style={styles.sensorText}>
            🧭 Gyroscope :{" "}
            {sensors.gyro_deg !== undefined
              ? `${sensors.gyro_deg}°`
              : "—"}
          </Text>
        </View>
      </ScrollView>
    );
  }
}

// ====================
// 💅 Styles visuels (thème clair iOS)
// ====================
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
  mapFrame: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    width: '95%',
    height: 240,
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 8,
    overflow: 'hidden',
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
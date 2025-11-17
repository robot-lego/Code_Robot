import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";



// Robot n2
export default class App extends React.Component {
  state = {
    ev3IP: "192.168.1.179", // IP du robot EV3
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
         {/* Contrôles de la barre + LED */}
        <Text style={styles.sectionTitle}>Commande barre & LED</Text>
          <View style={styles.barreControls}>
        {/* Barre contrôle */}
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

      {/* LED contrôle */}
      <TouchableOpacity
        style={[styles.bouton, styles.boutonLEDOn]}
        onPress={() => this.sendCommand("led_on")}
      >
        <Text style={styles.texte}>💡 ON</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.bouton, styles.boutonLEDOff]}
        onPress={() => this.sendCommand("led_off")}
      >
        <Text style={styles.texte}>💡OFF</Text>
      </TouchableOpacity>
    </View>
     
     
        {/* Affichage des capteurs */}
        <View style={styles.sensorCard}>
          <Text style={styles.sensorTitle}>📡 Capteurs en temps réel</Text>


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
          
          {/* ✅ Position des roues */}
          <Text style={[styles.sensorText, { marginTop: 10 }]}>
            ⚙️ Position roues :
          </Text>
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
          


        </View>
      </ScrollView>
    );
  }
}

// ====================
// 💅 Styles – Thème sombre "Futuriste Liquid Glass"
// ====================
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#0B0E13", // fond très sombre
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },

  title: {
    fontSize: 26,
    color: "#E0E6ED",
    fontWeight: "600",
    marginBottom: 25,
    letterSpacing: 0.5,
  },

  mapFrame: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 25,
    padding: 15,
    width: "90%",
    height: 180,
    marginBottom: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "rgba(0,0,0,0.6)",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 4,
  },

  mapTitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 8,
    fontWeight: "500",
  },

  middleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 15,
  },

  // 🧊 Boutons directionnels futuristes
  bouton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    margin: 8,
    width: 85,
    height: 55,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "rgba(0,0,0,0.4)",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },

  boutonAvant: { backgroundColor: "rgba(52,199,89,0.15)" },
  boutonArriere: { backgroundColor: "rgba(142,142,147,0.15)" },
  boutonGauche: { backgroundColor: "rgba(10,132,255,0.15)" },
  boutonDroite: { backgroundColor: "rgba(10,132,255,0.15)" },
  boutonStop: { backgroundColor: "rgba(255,59,48,0.18)", width: 80, height: 55 },

  texte: {
    color: "#E0E6ED",
    fontSize: 16,
    fontWeight: "500",
  },

  texteStop: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },

  // ⚙️ Carte capteurs ultra épurée avec effet "glass"
  sensorCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 22,
    width: "88%",
    marginTop: 35,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    shadowColor: "rgba(0,0,0,0.6)",
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 4,
  },

  sensorTitle: {
    fontSize: 18,
    color: "#F2F4F8",
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },

  sensorText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 15,
    marginVertical: 3,
    textAlign: "center",
    lineHeight: 20,
  },

  // 🧭 Section titre
  sectionTitle: {
    fontSize: 18,
    color: "#E0E6ED",
    fontWeight: "600",
    marginTop: 25,
    marginBottom: 12,
    textAlign: "center",
  },

  // 🔧 Boutons de la barre + LED
  barreControls: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 25,
  },

  boutonBarre: {
    backgroundColor: "rgba(10,132,255,0.15)",
    width: 85,
    marginHorizontal: 6,
  },

  boutonBarreStop: {
    backgroundColor: "rgba(255,59,48,0.18)",
    width: 85,
    marginHorizontal: 6,
  },

  boutonLEDOn: {
    backgroundColor: "rgba(52,199,89,0.18)",
    width: 85,
    marginHorizontal: 6,
  },

  boutonLEDOff: {
    backgroundColor: "rgba(142,142,147,0.15)",
    width: 85,
    marginHorizontal: 6,
  },
  
});

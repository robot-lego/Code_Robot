import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";

export default function MiniMap({ robot, obstacles, samples, ultrasonic }) {
  const size = 300; // taille de la map
  const scale = 0.01; // mm → pixels
  const ULTRA_LIFETIME = 3000;

  const [path, setPath] = useState([]);
  const [ultraPoints, setUltraPoints] = useState([]);

  useEffect(() => {
    // Ajouter la position actuelle du robot à son chemin
    setPath((prev) => [...prev, { x: robot.x, y: robot.y }]);

    // Si le capteur détecte quelque chose > 0, créer un point orange
    if (typeof ultrasonic === "number" && ultrasonic > 0) {
      const dx = ultrasonic * Math.cos(robot.angle);
      const dy = ultrasonic * Math.sin(robot.angle);
      const newPoint = { x: robot.x + dx, y: robot.y + dy, id: Date.now() };
      setUltraPoints((prev) => [...prev, newPoint]);
    }
  }, [robot, ultrasonic]);

  // Transformation pour centrer le robot
  const transformPos = (x, y) => ({
    left: size / 2 + (x - robot.x) * scale,
    top: size / 2 - (y - robot.y) * scale,
  });


  return (
    <View style={[styles.map, { width: size, height: size }]}>
      {/* Traces du robot */}
      {path.map((p, i) => (
        <View key={i} style={[styles.trace, transformPos(p.x, p.y)]} />
      ))}

      {/* Points ultrason */}
      {ultraPoints.map((p, i) => (
        <View key={i} style={[styles.ultra, transformPos(p.x, p.y)]} />
      ))}

      {/* Robot */}
      <View
        style={[
          styles.robot,
          { left: size / 2 - 8, top: size / 2 - 8 },
          { transform: [{ rotate: `${robot.angle}rad` }] },
        ]}
      />

      {/* Obstacles */}
      {obstacles.map((o, i) => (
        <View
          key={i}
          style={[
            styles.obstacle,
            transformPos(o.x, o.y),
            { backgroundColor: obstacleColor(o.type) },
          ]}
        />
      ))}

      {/* Samples */}
      {samples.map((p, i) => (
        <View key={i} style={[styles.sample, transformPos(p.x, p.y)]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    backgroundColor: "#EEE",
    borderColor: "#000",
    borderWidth: 2,
    borderRadius: 8,
    position: "relative",
  },
  robot: {
    position: "absolute",
    width: 16,
    height: 16,
    backgroundColor: "blue",
    borderRadius: 8,
  },
  trace: {
    position: "absolute",
    width: 4,
    height: 4,
    backgroundColor: "lightblue",
    borderRadius: 2,
  },
  ultra: {
    position: "absolute",
    width: 6,
    height: 6,
    backgroundColor: "orange",
    borderRadius: 3,
  },
  obstacle: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sample: {
    position: "absolute",
    width: 10,
    height: 10,
    backgroundColor: "black",
    borderRadius: 5,
  },
});

import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";


export default function MiniMap({ robot, obstacles, samples, ultrasonic, gyro }) {
  const size = 300; 
  const scaleTrace = 0.016; // pour rapprocher les traces
  const scaleUltra = 0.2;   // pour points ultrason visibles

  const [path, setPath] = useState([]);
  const [ultraPoints, setUltraPoints] = useState([]);

  useEffect(() => {
    // Ajouter la position actuelle du robot à son chemin (trace rapprochée)
    setPath(prev => [...prev, { x: robot.x, y: robot.y }]);
  }, [robot]);

  useEffect(() => {
    if (typeof ultrasonic === "number" && ultrasonic > 0 && typeof gyro === "number") {
      const angleRad = (gyro * Math.PI) / 180; 
      const dx = ultrasonic * Math.sin(angleRad) * scaleUltra;
      const dy = -ultrasonic * Math.cos(angleRad) * scaleUltra;

      const newPoint = { x: robot.x + dx, y: robot.y + dy, id: Date.now() };
      setUltraPoints(prev => [...prev, newPoint]);
    }
  }, [robot, ultrasonic, gyro]);

  // Transformation centrée pour le robot, traces et points
  const transformPos = (x, y, scale = 1, sizeOffset = 0) => ({
    left: size / 2 + x * scale - sizeOffset / 2,
    top: size / 2 - y * scale - sizeOffset / 2,
  });

  return (
    <View style={[styles.map, { width: size, height: size }]}>
      {/* Trajectoire du robot */}
      {path.map((p, i) => (
        <View key={i} style={[styles.trace, transformPos(p.x - robot.x, p.y - robot.y, scaleTrace, 4)]} />
      ))}

      {/* Points ultrason */}
      {ultraPoints.map((p, i) => (
        <View key={i} style={[styles.ultra, transformPos(p.x - robot.x, p.y - robot.y, 1, 6)]} />
      ))}

      {/* Robot */}
      <View
        style={[
          styles.robot,
          { left: size / 2 - 4, top: size / 2 - 4 }, // 8x8 centré
        ]}
      />

      {/* Obstacles */}
      {obstacles.map((o, i) => (
        <View key={i} style={[styles.obstacle, transformPos(o.x - robot.x, o.y - robot.y, 1, 12)]} />
      ))}

      {/* Samples */}
      {samples.map((p, i) => (
        <View key={i} style={[styles.sample, transformPos(p.x - robot.x, p.y - robot.y, 1, 10)]} />
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
    width: 8,
    height: 8,
    backgroundColor: "blue",
    borderRadius: 4,
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
    backgroundColor: "red",
    borderRadius: 3,
  },
  obstacle: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "gray",
  },
  sample: {
    position: "absolute",
    width: 10,
    height: 10,
    backgroundColor: "black",
    borderRadius: 5,
  },
});

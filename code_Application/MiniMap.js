import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";

export default function MiniMap({ robot, obstacles, samples, ultrasonic, gyro, color }) {
  const size = 300; 
  const scaleTrace = 0.016;
  const scaleUltra = 0.2;

  const [path, setPath] = useState([]);
  const [ultraPoints, setUltraPoints] = useState([]);
  const [isBlack, setIsBlack] = useState(false); // état noir

  useEffect(() => {
    // Détecte le noir
    const blackDetected = color?.name === "Black" || color?.reflection < 10; // seuil si besoin
    setIsBlack(blackDetected);

    // Ajouter la position actuelle à la trajectoire
    setPath(prev => [
      ...prev,
      { x: robot.x, y: robot.y, color: blackDetected ? "red" : "lightblue" }
    ]);
  }, [robot, color]);

  useEffect(() => {
    if (typeof ultrasonic === "number" && ultrasonic > 0 && typeof gyro === "number") {
      const angleRad = (gyro * Math.PI) / 180; 
      const dx = ultrasonic * Math.sin(angleRad) * scaleUltra;
      const dy = -ultrasonic * Math.cos(angleRad) * scaleUltra;

      const newPoint = { x: robot.x + dx, y: robot.y + dy, id: Date.now() };
      setUltraPoints(prev => [...prev, newPoint]);
    }
  }, [robot, ultrasonic, gyro]);

  const transformPos = (x, y, scale = 1, sizeOffset = 0) => ({
    left: size / 2 + x * scale - sizeOffset / 2,
    top: size / 2 - y * scale - sizeOffset / 2,
  });

  const robotLength = 24;
  const robotHalfWidth = 6;
  const angleRad = robot.angle; 
  const angleDeg = (angleRad * 180) / Math.PI - 90;

  return (
    <View style={[styles.map, { width: size, height: size, backgroundColor: isBlack ? "#FFCCCC" : "#EEE" }]}>
      
      {/* Trajectoire */}
      {path.map((p, i) => (
        <View
          key={i}
          style={[
            styles.trace,
            transformPos(p.x - robot.x, p.y - robot.y, scaleTrace, 4),
            { backgroundColor: p.color }
          ]}
        />
      ))}

      {/* Points ultrason */}
      {ultraPoints.map((p, i) => (
        <View
          key={i}
          style={[styles.ultra, transformPos(p.x - robot.x, p.y - robot.y, 1, 6)]}
        />
      ))}

      {/* Robot triangle */}
      <View
        style={[
          styles.robotTriangle,
          {
            left: size / 2 - robotHalfWidth,
            top: size / 2 - robotLength / 2,
            borderBottomWidth: robotLength,
            borderLeftWidth: robotHalfWidth,
            borderRightWidth: robotHalfWidth,
            transform: [{ rotate: `${angleDeg}deg` }],
          },
        ]}
      />

      {/* Obstacles */}
      {obstacles.map((o, i) => (
        <View
          key={i}
          style={[styles.obstacle, transformPos(o.x - robot.x, o.y - robot.y, 1, 12)]}
        />
      ))}

      {/* Samples */}
      {samples.map((p, i) => (
        <View
          key={i}
          style={[styles.sample, transformPos(p.x - robot.x, p.y - robot.y, 1, 10)]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    borderColor: "#000",
    borderWidth: 2,
    borderRadius: 8,
    position: "relative",
  },
  trace: {
    position: "absolute",
    width: 4,
    height: 4,
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
  robotTriangle: {
    position: "absolute",
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderBottomColor: "blue",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
});

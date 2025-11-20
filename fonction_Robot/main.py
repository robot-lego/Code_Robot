#!/usr/bin/env pybricks-micropython
from pybricks.hubs import EV3Brick
from pybricks.ev3devices import (
    ColorSensor,
    UltrasonicSensor,
    GyroSensor,
    Motor,
)
from pybricks.parameters import Port, Color, Direction, Stop
from pybricks.tools import wait
import socket
import ujson

# ===============================
# 🔧 Initialisation du robot EV3
# ===============================
ev3 = EV3Brick()

# Initialisation des moteurs
try:
    left_motor = Motor(Port.A)
    right_motor = Motor(Port.C)
    barre_motor = Motor(Port.B)
except OSError:
    left_motor = None
    right_motor = None
    barre_motor = None

# Capteurs
try:
    ultrasonic_sensor = UltrasonicSensor(Port.S2)
except OSError:
    ultrasonic_sensor = None

try:
    color_sensor = ColorSensor(Port.S3)
except OSError:
    color_sensor = None

try:
    gyro_sensor = GyroSensor(Port.S4, Direction.CLOCKWISE)
    gyro_sensor.reset_angle(0)
except OSError:
    gyro_sensor = None

# ===============================
# 🌐 Serveur HTTP local
# ===============================
HOST = ''
PORT = 8081
server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server_socket.bind((HOST, PORT))
server_socket.listen(1)

# ===============================
# 📊 Fonction de lecture des capteurs
# ===============================
def get_sensor_values():
    data = {}
    # Moteurs
    if left_motor and right_motor:
        left_angle = left_motor.angle()
        right_angle = right_motor.angle()
        data["motor_position"] = {"left_deg": left_angle, "right_deg": right_angle}
        data["left_motor_deg"] = left_angle
        data["right_motor_deg"] = right_angle
    else:
        data["motor_position"] = None
        data["left_motor_deg"] = None
        data["right_motor_deg"] = None

    # Ultrason
    data["ultrasonic_mm"] = ultrasonic_sensor.distance() if ultrasonic_sensor else None

    # Couleur
    if color_sensor:
        data["color"] = {"name": str(color_sensor.color()), "reflection": color_sensor.reflection()}
    else:
        data["color"] = None

    # Gyro
    data["gyro_deg"] = gyro_sensor.angle() % 360 if gyro_sensor else None

    return data

# ===============================
# 🚙 Fonctions de mouvement
# ===============================
def avancer():
    if left_motor and right_motor:
        left_motor.run(500)
        right_motor.run(500)

def reculer():
    if left_motor and right_motor:
        left_motor.run(-500)
        right_motor.run(-500)

def tourner_gauche():
    if left_motor and right_motor:
        left_motor.run(-100)
        right_motor.run(100)

def tourner_droite():
    if left_motor and right_motor:
        left_motor.run(100)
        right_motor.run(-100)

def stop_robot():
    if left_motor and right_motor:
        left_motor.stop(Stop.BRAKE)
        right_motor.stop(Stop.BRAKE)

def upbarre():
    if barre_motor:
        barre_motor.run(500)

def downbarre():
    if barre_motor:
        barre_motor.run(-500)

def stopbarre():
    if barre_motor:
        barre_motor.stop(Stop.BRAKE)

def beep():
    ev3.speaker.beep(1000, 200)

def onled():
    ev3.light.on(Color.GREEN)

def offled():
    ev3.light.off()

def generate_csv():
    # En-tête CSV
    csv_content = "left_deg,right_deg,ultrasonic_mm,color_name,color_reflection,gyro_deg\n"

    # Valeurs actuelles des capteurs
    left_deg = str(left_motor.angle()) if left_motor else ""
    right_deg = str(right_motor.angle()) if right_motor else ""
    ultrasonic = str(ultrasonic_sensor.distance()) if ultrasonic_sensor else ""
    color_name = str(color_sensor.color()) if color_sensor else ""
    color_reflection = str(color_sensor.reflection()) if color_sensor else ""
    gyro = str(gyro_sensor.angle()) if gyro_sensor else ""

    # Ligne de données
    csv_content += left_deg + "," + right_deg + "," + ultrasonic + "," + color_name + "," + color_reflection + "," + gyro + "\n"

    return csv_content

# ===============================
# 🧠 Boucle principale du serveur
# ===============================
try:
    while True:
        client_socket, addr = server_socket.accept()
        request = client_socket.recv(1024).decode('utf-8')
        print(request)

        response_body = ""

        if request.startswith("GET "):
            if "/avancer" in request:
                avancer()
                response_body = ujson.dumps({"status": "ok", "action": "avancer"})
            elif "/reculer" in request:
                reculer()
                response_body = ujson.dumps({"status": "ok", "action": "reculer"})
            elif "/gauche" in request:
                tourner_gauche()
                response_body = ujson.dumps({"status": "ok", "action": "gauche"})
            elif "/droite" in request:
                tourner_droite()
                response_body = ujson.dumps({"status": "ok", "action": "droite"})
            elif "/stop" in request:
                stop_robot()
                response_body = ujson.dumps({"status": "ok", "action": "stop"})
            elif "/upbarre" in request:
                upbarre()
                response_body = ujson.dumps({"status": "ok", "action": "upbarre"})
            elif "/downbarre" in request:
                downbarre()
                response_body = ujson.dumps({"status": "ok", "action": "downbarre"})
            elif "/stopbarre" in request:
                stopbarre()
                response_body = ujson.dumps({"status": "ok", "action": "stopbarre"})
            elif "/beep" in request:
                beep()
                response_body = ujson.dumps({"status": "ok", "action": "beep"})
            elif "/onled" in request:
                onled()
                response_body = ujson.dumps({"status": "ok", "action": "onled"})
            elif "/offled" in request:
                offled()
                response_body = ujson.dumps({"status": "ok", "action": "offled"})
            elif "/csv" in request:
                csv_data = generate_csv()
                client_socket.send(b"HTTP/1.1 200 OK\r\n")
                client_socket.send(b"Content-Type: text/csv\r\n")
                client_socket.send(b'Content-Disposition: attachment; filename="data.csv"\r\n\r\n')
                client_socket.send(csv_data.encode("utf-8"))
                client_socket.close()
                continue
            
            else:
                response_body = ujson.dumps(get_sensor_values())

            client_socket.send(b"HTTP/1.1 200 OK\r\n")
            client_socket.send(b"Content-Type: application/json\r\n\r\n")
            client_socket.send(response_body.encode("utf-8"))

        client_socket.close()
        wait(1)

except KeyboardInterrupt:
    print("Arrêt du serveur")
    stop_robot()
    server_socket.close()

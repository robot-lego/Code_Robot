#!/usr/bin/env pybricks-micropython
import socket
import os
import ujson
from pybricks.hubs import EV3Brick
from pybricks.ev3devices import (
    TouchSensor,
    ColorSensor,
    UltrasonicSensor,
    GyroSensor,
    Motor,
)
from pybricks.parameters import Port, Color, Direction, Stop
from pybricks.tools import wait

# ===============================
# 🔧 Initialisation du robot EV3
# ===============================
ev3 = EV3Brick()
ev3.speaker.set_volume(10, which='Beep')

# Initialisation des moteurs
try:
    left_motor = Motor(Port.A)
    right_motor = Motor(Port.C)
    barre_motor = Motor(Port.B)
except OSError:
    left_motor = None
    right_motor = None
    barre_motor = None
    ev3.speaker.beep()

# Capteurs (avec gestion d'erreur)
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
except OSError:
    gyro_sensor = None

# ===============================
# 🌐 Serveur HTTP local
# ===============================
HOST = ''
PORT = 8081
server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server_socket.bind((HOST, PORT))
server_socket.listen(1)

# ===============================
# 📊 Fonction de lecture des capteurs
# ===============================
def get_sensor_values():
    data = {}
    if left_motor and right_motor:
        data["left_motor"] = left_motor.angle()
        data["right_motor"] = right_motor.angle()
    if ultrasonic_sensor:
        data["distance"] = ultrasonic_sensor.distance()
    if color_sensor:
        data["color"] = str(color_sensor.color())
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
        left_motor.run(-500)
        right_motor.run(500)

def tourner_droite():
    if left_motor and right_motor:
        left_motor.run(500)
        right_motor.run(-500)

def stop_robot():
    if left_motor:
        left_motor.stop()
    if right_motor:
        right_motor.stop()

def upbarre():
    if barre_motor:
        barre_motor.run(500)

def downbarre():
    if barre_motor:
        barre_motor.run(-500)

def stopbarre():
    if barre_motor:
        barre_motor.stop()

def beeper():
    ev3.speaker.beep(1000, 100)

# -------------------------------
# 📁 Fonction pour générer CSV
# -------------------------------
def csv_robot():
    filename = "sensor_data.csv"
    try:
        # Vérifie si le fichier existe déjà pour ajouter l'en-tête
        file_exists = False
        try:
            with open(filename, "r") as f:
                file_exists = True
        except OSError:
            file_exists = False

        with open(filename, "a") as f:
            # Ajouter l'en-tête si le fichier est vide
            if not file_exists:
                f.write("LeftMotor,RightMotor,Distance,Color,Gyro\n")

            data = get_sensor_values()
            left = str(data.get("left_motor", ""))
            right = str(data.get("right_motor", ""))
            dist = str(data.get("distance", ""))
            color = str(data.get("color", ""))
            gyro = str(data.get("gyro", ""))  # on peut ajouter gyro si disponible

            line = left + "," + right + "," + dist + "," + color + "," + gyro + "\n"
            f.write(line)

        return True
    except Exception as e:
        print("Erreur CSV: " + str(e))
        return False

# -------------------------------
# 📁 Fonction pour envoyer CSV au client
# -------------------------------
def send_csv(client_socket):
    filename = "sensor_data.csv"
    try:
        with open(filename, "r") as f:
            content = f.read()
        # Préparer tout le contenu HTTP dans une seule chaîne, sans f-string
        header = (
            "HTTP/1.1 200 OK\r\n"
            "Content-Type: text/csv\r\n"
            "Content-Disposition: attachment; filename=\"sensor_data.csv\"\r\n"
            "Content-Length: " + str(len(content)) + "\r\n"
            "\r\n"
        )
        client_socket.send(header.encode() + content.encode())
    except Exception as e:
        print("Erreur en envoyant CSV: " + str(e))
        response_body = ujson.dumps({"status": "error", "message": "CSV not found"})
        client_socket.send(b"HTTP/1.1 404 Not Found\r\n")
        client_socket.send(b"Content-Type: application/json\r\n\r\n")
        client_socket.send(response_body.encode())



# ===============================
# 🧠 Boucle principale du serveur
# ===============================
try:
    while True:
        client_socket, client_address = server_socket.accept()
        request = client_socket.recv(1024).decode()
        
        response_body = ujson.dumps({"status": "ok"})
        
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
            elif "/upbarre" in request:
                upbarre()
                response_body = ujson.dumps({"status": "ok", "action": "upbarre"})
            elif "/downbarre" in request:
                downbarre()
                response_body = ujson.dumps({"status": "ok", "action": "downbarre"})
            elif "/stopbarre" in request:
                stopbarre()
                response_body = ujson.dumps({"status": "ok", "action": "stopbarre"})
            elif "/stop" in request:
                stop_robot()
                response_body = ujson.dumps({"status": "ok", "action": "stop"})
            elif "/beeper" in request:
                beeper()
                response_body = ujson.dumps({"status": "ok", "action": "beeper"})
            elif "/csv" in request:
                success = csv_robot()  # Sauvegarde les valeurs actuelles dans le CSV
                if success:
                    send_csv(client_socket)  # Envoie le CSV directement au téléphone
                else:
                    response_body = ujson.dumps({"status": "error", "message": "CSV not written"})
                    client_socket.send(b"HTTP/1.1 500 Internal Server Error\r\n")
                    client_socket.send(b"Content-Type: application/json\r\n\r\n")
                    client_socket.send(response_body.encode())
                client_socket.close()
                continue


        
        client_socket.send(b"HTTP/1.1 200 OK\r\n")
        client_socket.send(b"Content-Type: application/json\r\n\r\n")
        client_socket.send(response_body.encode("utf-8"))
        client_socket.close()
        wait(100)

except KeyboardInterrupt:
    print("Arret du serveur")
    stop_robot()
    server_socket.close(2)

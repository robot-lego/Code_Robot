#!/usr/bin/env pybricks-micropython
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
import socket
import ujson

# ===============================
# Initialisation du robot EV3
# =============================== 
ev3 = EV3Brick()



# Initialisation des moteurs
try:
    left_motor = Motor(Port.A)
    right_motor = Motor(Port.C)
    barre_motor=Motor(Port.B)
except OSError:
    left_motor = None
    right_motor = None
    barre_motor=None
    ev3.speaker.beep()

# Capteurs (avec gestion d’erreur pour éviter plantage)
try:
    touch_sensor = TouchSensor(Port.S1)
except OSError:
    touch_sensor = None

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
# Serveur HTTP local
# ===============================
HOST = ''
PORT = 8081
server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server_socket.bind((HOST, PORT))
server_socket.listen(1)


# ===============================
# Fonction de lecture des capteurs
# ===============================
def get_sensor_values():
    data = {}

    if left_motor and right_motor:
        data["motor_position"] = {
            "left_deg": left_motor.angle(),
            "right_deg": right_motor.angle(),
        }
    else:
        data["motor_position"] = None

    if ultrasonic_sensor:
        data["ultrasonic_mm"] = ultrasonic_sensor.distance()
    else:
        data["ultrasonic_mm"] = None

    if color_sensor:
        data["color"] = {
            "name": str(color_sensor.color()),
            "reflection": color_sensor.reflection(),
        }
    else:
        data["color"] = None

    if gyro_sensor:
        angle = gyro_sensor.angle() % 360
        data["gyro_deg"] = angle
    else:
        data["gyro_deg"] = None

    return data


# ===============================
# Fonctions de mouvement
# ===============================
def avancer():
    if left_motor and right_motor:
        left_motor.run(500)
        right_motor.run(500)
        print("➡️ Avancer")

def reculer():
    if left_motor and right_motor:
        left_motor.run(-500)
        right_motor.run(-500)
        print("⬅️ Reculer")

def tourner_gauche():
    if left_motor and right_motor:
        left_motor.run(-100)
        right_motor.run(100)
        print("↩️ Tourner à gauche")

def tourner_droite():
    if left_motor and right_motor:
        left_motor.run(100)
        right_motor.run(-100)
        print("↪️ Tourner à droite")

def stop_robot():
    if left_motor and right_motor:
        left_motor.stop(Stop.BRAKE)
        right_motor.stop(Stop.BRAKE)
        print("🛑 Stop")
def upbarre():barre_motor.run(100)
def downbarre():barre_motor.run(-100)
def stopbarre():barre_motor.stop(Stop.BRAKE)


# ===============================
#  Contrôle de la LED du EV3
# ===============================
def led_on():
    ev3.light.on(Color.GREEN)
    print("💡 LED ON")

def led_off():
    ev3.light.off()
    print("💡 LED OFF")
# ===============================
# Boucle principale du serveur
# ===============================
try:
    while True:
        client_socket, addr = server_socket.accept()
        request = client_socket.recv(1024).decode('utf-8')
        print(request)

        # --- Analyse du chemin de la requête ---
        if request.startswith("GET "):
            if "/avancer" in request:
                avancer()
                response_body = ujson.dumps({"status": "ok", "action": "avancer"})

            elif "/reculer" in request:
                reculer()
                response_body = ujson.dumps({"status": "ok", "action": "reculer"})

            elif "/upbarre" in request:
                upbarre()
                response_body = ujson.dumps({"status": "ok", "action": "upbarre"})
                
            elif "/downbarre" in request:
                downbarre()
                response_body = ujson.dumps({"status": "ok", "action": "downbarre"})

            elif "/stopbarre" in request:
                stopbarre()
                response_body = ujson.dumps({"status": "ok", "action": "stopbarre"})

            elif "/gauche" in request:
                tourner_gauche()
                response_body = ujson.dumps({"status": "ok", "action": "gauche"})

            elif "/droite" in request:
                tourner_droite()
                response_body = ujson.dumps({"status": "ok", "action": "droite"})

            elif "/stop" in request:
                stop_robot()
                response_body = ujson.dumps({"status": "ok", "action": "stop"})

            elif "/led_on" in request:
                led_on()
                response_body = ujson.dumps({"status": "ok", "action": "led_on"})

            elif "/led_off" in request:
                led_off()
                response_body = ujson.dumps({"status": "ok", "action": "led_off"})

            else:
                # Données capteurs
                response_body = ujson.dumps(get_sensor_values())

            # Envoi de la réponse HTTP
            client_socket.send(b"HTTP/1.1 200 OK\r\n")
            client_socket.send(b"Content-Type: application/json\r\n\r\n")
            client_socket.send(response_body.encode("utf-8"))


            
        client_socket.close()
        wait(5)

except KeyboardInterrupt:
    print("Arrêt du serveur")
    stop_robot()
    server_socket.close()

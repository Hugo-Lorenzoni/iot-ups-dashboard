import lgpio
import board
import time
import cv2
import adafruit_dht
import os
from dotenv import load_dotenv
import psycopg2  # Pour PostgreSQL
from datetime import datetime
from minio import Minio  # Pour MinIO
from minio.error import S3Error
from nut2 import PyNUTClient

# Configuration des GPIO
DHT_PIN = 4
PIR_PIN = 17
ALARM_PIN = 18
LED_PINS = {"green": 5, "orange": 6, "red": 13}

# Adresse IP de la caméra ESP32-CAM
ESP32_IP = "192.168.2.200"

# Connexion à la base PostgreSQL
load_dotenv()
conn = psycopg2.connect(
    dbname=os.getenv("POSTGRES_DB"),
    user=os.getenv("POSTGRES_USER"),
    password=os.getenv("POSTGRES_PASSWORD"),
    host="localhost",  # À adapter si différent
    port=5432
)
cur = conn.cursor()

# Connexion à MinIO
minio_client = Minio(
    endpoint="192.168.2.104:9000",
    access_key=os.getenv("ACCESSKEY"),
    secret_key=os.getenv("SECRETKEY"),
    secure=False
)

# Initialisation des GPIO
gpio_handle = lgpio.gpiochip_open(0)
lgpio.gpio_claim_input(gpio_handle, PIR_PIN)
lgpio.gpio_claim_output(gpio_handle, ALARM_PIN)
for pin in LED_PINS.values():
    lgpio.gpio_claim_output(gpio_handle, pin)

# Initialisation du capteur DHT22
dht_sensor = adafruit_dht.DHT22(board.D4)




# Variables globales
last_record_time = None
recording = False

def check_camera():
    """Vérifie si la caméra ESP32-CAM est accessible."""
    response = 0
    for i in range(5):
        response += os.system(f"ping -c 1 -w 1 {ESP32_IP} > /dev/null")
    
    #if response > 0:
    #    print(response)
        
    if response < 1200:
        response = 0
        
    if response:
        print("Problem with camera connection")
        os.system(f"ping -c 1 {ESP32_IP}")
    return response == 0
    
def check_all():
    """Teste le bon fonctionnement de tous les composants et retourne 1 si tout va bien, 0 sinon."""
    all_ok = True  # Variable pour suivre l'état global

    # Test de la caméra
    if check_camera():
        print("Caméra : OK")
    else:
        print("Caméra : ÉCHEC")
        all_ok = False

    # Test du capteur DHT22
    try:
        temperature = dht_sensor.temperature
        humidity = dht_sensor.humidity
        if temperature is not None or humidity is not None:
            print(f"DHT22 : OK (Temp: {temperature:.1f}°C, Hum: {humidity:.1f}%)")
        else :
            print("Problème : Pas de données lues depuis le capteur DHT22.")
            all_ok = False
    except Exception as e:
        print(f"Problème : Erreur lors de la lecture du DHT22 ({e}).")
        all_ok = False
        
    # Test de l'alarme
    try:
        print("Test de l'alarme...")
        lgpio.gpio_write(gpio_handle, ALARM_PIN, 1)
        time.sleep(0.5)  # Alarme active pendant 0,5 seconde
        lgpio.gpio_write(gpio_handle, ALARM_PIN, 0)
    except Exception as e:
        print(f"Problème : Erreur avec l'alarme ({e}).")
        all_ok = False

    # Test du capteur PIR
    try:
        lgpio.gpio_read(gpio_handle, PIR_PIN)
        
    except Exception as e:
        print(f"Problème : Erreur avec le capteur PIR ({e}).")
        all_ok = False

    # Retourne 1 si tout va bien, 0 sinon
    return 1 if all_ok else 0



def save_video_from_stream(now, duration=30):
    cap = cv2.VideoCapture(f"http://{ESP32_IP}:81/stream")

    if not cap.isOpened():
        print("Error: Could not open video stream.")
        return

    # Get the video properties (fallback to default if unavailable)
    fps = int(cap.get(cv2.CAP_PROP_FPS) or 5)  # Frames per second
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 640)
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 480)
    fourcc = cv2.VideoWriter_fourcc(*'XVID')  # Codec for the video file

    # Generate a timestamped filename
    timestamp = now.strftime("%Y%m%d_%H%M%S")
    output_file = f"video_{timestamp}.avi"

    # Create a VideoWriter object
    out = cv2.VideoWriter(output_file, fourcc, fps, (width, height))

    print(f"Saving video to {output_file}...")

    start_time = time.time()

    while time.time() - start_time < duration:
        ret, frame = cap.read()
        if not ret:
            print("Error: Could not read frame from stream.")
            break

        # Write the frame to the output file
        out.write(frame)

        # Display the frame (optional)
        cv2.imshow("Recording", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):  # Press 'q' to stop recording early
            break

    # Release resources
    cap.release()
    out.release()
    cv2.destroyAllWindows()

    print(f"Video saved successfully: {output_file}")
    
    return output_file

    
def record_video():
    """Lance un enregistrement vidéo via ESP32-CAM."""
    global last_record_time, recording
    last_record_time = datetime.now()
    now = datetime.now()
    recording = True
    cur.execute("INSERT INTO mouvement (timestmp) VALUES (%s)", (now,))
    conn.commit()
    
    video_name = save_video_from_stream(now)

    minio_client.fput_object("iot-bucket", video_name, video_name)
    os.remove(video_name)
    recording = False

def get_dht_data():
    """Récupère les données du capteur DHT22."""
    try:
        temperature = dht_sensor.temperature
        humidity = dht_sensor.humidity
        if temperature is not None and humidity is not None:
            cur.execute(
                "INSERT INTO dht (temperature, humidite) VALUES (%s, %s)",
                (temperature, humidity)
            )
            conn.commit()
            print("Save temperature and humidiy in db")
    except Exception as e:
        print(f"Erreur lors de la lecture du DHT22 : {e}")
        
def get_ups_data():
    """Récupère les données de l'UPS."""
    try:
        # Connexion au NUT server (UPS)
        nut_client = PyNUTClient()
        
        #ups_data = nut_client.list_vars("ups1")
        battery_charge = nut_client.get("ups1", "battery.charge")
        battery_runtime = nut_client.get("ups1", "battery.runtime")
        battery_voltage = nut_client.get("ups1", "battery.voltage")
        print(battery_charge,battery_runtime,battery_voltage,1)
        
        if battery_charge is not None and battery_runtime is not None and battery_voltage is not None:
            cur.execute(
                "INSERT INTO ups (battery_pourcentage, input, output, ups_load) VALUES (%s, %s, %s, %s)",
                (battery_charge, battery_voltage, battery_runtime, 1)
            )
            conn.commit()
            print("Save ups data in db")
    except Exception as e:
        print(f"Erreur lors de la récupération des données de l'UPS : {e}")

def manage_leds(status):
    """Gère l'état des LEDs."""
    if status == "ok":
        lgpio.gpio_write(gpio_handle, LED_PINS["green"], 1)
        lgpio.gpio_write(gpio_handle, LED_PINS["orange"], 0)
    elif status == "error":
        lgpio.gpio_write(gpio_handle, LED_PINS["green"], 0)
        lgpio.gpio_write(gpio_handle, LED_PINS["orange"], 1)
    elif status == "alert":
        lgpio.gpio_write(gpio_handle, LED_PINS["red"], 1)
    elif status == "end_alert":
        lgpio.gpio_write(gpio_handle, LED_PINS["red"], 0)

def bip_alert():
    """Fait 3 bips rapides avec l'alarme."""
    for _ in range(3):
        lgpio.gpio_write(gpio_handle, ALARM_PIN, 1)
        time.sleep(0.2)  # Bip allumé pendant 200 ms
        lgpio.gpio_write(gpio_handle, ALARM_PIN, 0)
        time.sleep(0.2)  # Pause entre les bips
        
def clean_db():
    # Liste des requêtes de suppression pour les 3 tables
    queries = [
        "DELETE FROM dht WHERE timestmp < NOW() - INTERVAL '2 weeks';",
        "DELETE FROM mouvement WHERE timestmp < NOW() - INTERVAL '2 weeks';",
        "DELETE FROM ups WHERE timestmp < NOW() - INTERVAL '2 weeks';"
    ]

    # Exécution des requêtes
    try:
        for query in queries:
            cur.execute(query)
            print(f"{datetime.now()} - Exécution réussie de la requête : {query}")
        
        # Valider les changements dans la base de données
        conn.commit()
        print(f"{datetime.now()} - Changements validés.")
    except Exception as e:
        print(f"{datetime.now()} - Erreur lors de l'exécution des requêtes : {e}")
        conn.rollback()
        
def cleanup_gpio():
    """Désactive toutes les sorties GPIO et libère les ressources."""
    try:
        # Éteindre les LEDs
        for pin in LED_PINS.values():
            lgpio.gpio_write(gpio_handle, pin, 0)
        
        # Désactiver l'alarme
        lgpio.gpio_write(gpio_handle, ALARM_PIN, 0)

        print("GPIO nettoyés correctement.")
    except Exception as e:
        print(f"Erreur lors du nettoyage des GPIO : {e}")
    finally:
        # Libérer le GPIO handle
        lgpio.gpiochip_close(gpio_handle)

def main():
    global last_record_time, recording
    try:
        print("Démarrage du système IoT...")
        last_pir_time = None
        
        # Check all the IoT components
        check_all()
        
        # Enregistrement d'une première temp/hum
        get_dht_data()
        get_ups_data()
            
        while True:
            # Vérification de la caméra
            camera_ok = check_camera()
            manage_leds("ok" if camera_ok else "error")
            
            # Gestion des mouvements
            pir_state = lgpio.gpio_read(gpio_handle, PIR_PIN)
            now = datetime.now()
            if pir_state:
                manage_leds("alert")
                last_pir_time = now
                if not recording and (last_record_time is None or (now - last_record_time).total_seconds() > 50):
                    bip_alert()
                    if camera_ok:
                        record_video()
                else:
                    print("Mouvement détecté, mais enregistrement déjà en cours ou trop proche.")

            # Vérification si 20s se sont écoulées sans mouvement
            if last_pir_time and (now - last_pir_time).total_seconds() > 20:
                manage_leds("end_alert")

            # Lecture DHT22 toutes 2 minutes
            if now.minute % 2 == 0 and now.second == 0:
                get_dht_data()
                get_ups_data()
                
            # Clean the old data (more than 2 weeks) each day at 00 AM
            if now.hour == 0 and now.minute == 0 and now.second == 0:
                print("YES")
                clean_db()

            time.sleep(1)
    except KeyboardInterrupt:
        print("Arrêt du système IoT.")
    finally:
        cleanup_gpio()
        conn.close()


if __name__ == "__main__":
    main()

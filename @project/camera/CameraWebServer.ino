#include <dummy.h>

#include "esp_camera.h"
#include <WiFi.h>
#include "FS.h"
#include "SD_MMC.h" // Ou <SD.h> selon votre wiring, ici on part du principe que c'est un module SD sur SD_MMC.
#include "camera_pins.h"

// Utiliser les mêmes settings que votre code actuel pour la caméra et le WiFi

#define CAMERA_MODEL_AI_THINKER  // Has PSRAM

const char *ssid = "iotpi-desktop";
const char *password = "";

void startCameraServer();
void setupLedFlash(int pin);

// Durée d'enregistrement en millisecondes
#define RECORDING_DURATION 60000
// Intervalle entre deux captures (en ms), par exemple 200 ms = ~5 fps
#define FRAME_INTERVAL 200

// Fonction pour initialiser la caméra (identique à votre code, adaptée si besoin)
bool initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.frame_size = FRAMESIZE_QVGA;
  config.pixel_format = PIXFORMAT_JPEG;
  config.fb_count = 2;
  config.jpeg_quality = 10;
  config.grab_mode = CAMERA_GRAB_LATEST;
  config.fb_location = CAMERA_FB_IN_PSRAM;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return false;
  }

  sensor_t *s = esp_camera_sensor_get();
  if (s->id.PID == OV3660_PID) {
    s->set_vflip(s, 1);
    s->set_brightness(s, 1);
    s->set_saturation(s, -2);
  }
  s->set_framesize(s, FRAMESIZE_QVGA);

  return true;
}

// Fonction pour initialiser la carte SD
bool initSDCard() {
  if(!SD_MMC.begin()){
    Serial.println("SD Card Mount Failed");
    return false;
  }

  uint8_t cardType = SD_MMC.cardType();
  if(cardType == CARD_NONE){
    Serial.println("No SD card attached");
    return false;
  }

  Serial.println("SD Card initialized.");
  return true;
}

// Fonction appelée pour enregistrer une minute de "vidéo" (en fait, plusieurs images)
void recordOneMinute() {
  Serial.println("Starting 1-minute recording...");

  unsigned long startTime = millis();
  unsigned long lastFrameTime = 0;
  int frameCounter = 0;

  while (millis() - startTime < RECORDING_DURATION) {
    if (millis() - lastFrameTime >= FRAME_INTERVAL) {
      camera_fb_t * fb = esp_camera_fb_get();
      if(!fb) {
        Serial.println("Camera capture failed");
        continue;
      }

      // Créer un nom de fichier unique pour chaque image
      char filename[32];
      snprintf(filename, sizeof(filename), "/capture_%05d.jpg", frameCounter++);
      
      File file = SD_MMC.open(filename, FILE_WRITE);
      if(!file){
        Serial.printf("Failed to open file in writing mode: %s\n", filename);
        esp_camera_fb_return(fb);
        continue;
      }

      file.write(fb->buf, fb->len); // écriture du buffer JPEG tel quel
      file.close();

      esp_camera_fb_return(fb);
      lastFrameTime = millis();
      Serial.printf("Saved frame %d\n", frameCounter);
    }

    // Petit délai pour éviter un usage CPU trop élevé (optionnel)
    delay(10);
  }

  Serial.println("Recording finished!");
}

void setup() {
  Serial.begin(115200);
  Serial.println();

  // Init Cam
  if(!initCamera()){
    Serial.println("Camera init failed");
    while(true);
  }

  // Connexion WiFi (si nécessaire pour la suite)
  WiFi.begin(ssid, password);
  WiFi.setSleep(false);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");

  // Init SD
  if(!initSDCard()){
    Serial.println("SD Init failed");
    while(true);
  }

  Serial.println("Setup complete. Waiting for motion trigger...");
}

void loop() {
  // Ici on suppose que le capteur de mouvement déclenche cette fonction.
  // Dans votre code, vous pouvez faire un test :
  // if (mouvementDetecte) { recordOneMinute(); }
  // Pour l'exemple, on déclenche juste après 5 secondes :
  static bool recordingDone = false;
  if(!recordingDone && millis() > 5000) {
    recordOneMinute();
    recordingDone = true;
  }

  delay(100);
}
/*
 * ============================================================================
 * 🚨 CrisisAgent — Physical Sensor Node Firmware (ESP32)
 * ============================================================================
 * 
 * Hardware Platform: ESP32 Dev Module
 * Attached Sensors:
 *   - DHT22 (AM2302)  : Ambient Temperature & Humidity (Pin 4)
 *   - MQ-2            : Smoke / Combustible Gas Sensor Analog (Pin 34 / ADC1_CH6)
 *   - HC-SR501 PIR    : Passive Infrared Motion / Occupancy (Pin 13)
 * Status Indicators:
 *   - Green LED (Pin 22) : Connected to WiFi / Backend Healthy
 *   - Red LED   (Pin 21) : Disconnected from WiFi / Network Error
 *   - Blue LED  (Pin 19) : Active HTTP Telemetry Transmission
 * 
 * Protocol:
 *   HTTP POST http://<SERVER_HOST>:<SERVER_PORT>/api/sensor-reading
 *   Payload: {"device_id": "esp32_001", "sensor_type": "temperature", "value": 23.5}
 *   Reporting Frequency: Every 2.0 seconds (configurable)
 * ============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

// ============================================================================
// CONFIGURATION — CONFIGURE YOUR ENVIRONMENT HERE
// ============================================================================

// 1. WiFi Credentials
const char* WIFI_SSID         = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD     = "YOUR_WIFI_PASSWORD";

// 2. CrisisAgent Backend Server Settings
const char* SERVER_HOST       = "192.168.1.100";     // Backend IP or hostname
const int   SERVER_PORT       = 8000;                // Backend FastAPI port
const char* API_PATH          = "/api/sensor-reading";

// 3. Hardware Device & Zone Identification
const char* DEVICE_ID         = "esp32_001";         // Unique Node Identifier
const char* ASSIGNED_ZONE     = "R1";                // Target building zone (e.g., R1, P1)

// 4. Transmission Timing
const unsigned long REPORT_INTERVAL_MS = 2000;       // Send telemetry every 2000ms (2s)
const unsigned long WIFI_RECONNECT_MS  = 5000;       // WiFi reconnect retry interval

// ============================================================================
// PIN DEFINITIONS
// ============================================================================

#define DHT_PIN         4       // GPIO 4  -> DHT22 Data (with 10k pull-up to 3.3V)
#define DHT_TYPE        DHT22   // Sensor Model AM2302 / DHT22

#define MQ2_PIN         34      // GPIO 34 -> MQ-2 Analog Out (A0) [ADC1, Input Only]
#define PIR_PIN         13      // GPIO 13 -> HC-SR501 PIR Digital Out

#define LED_RED         21      // GPIO 21 -> Red LED (Disconnected / Error)
#define LED_GREEN       22      // GPIO 22 -> Green LED (Connected & Ready)
#define LED_BLUE        19      // GPIO 19 -> Blue LED (Sending Data)

// ============================================================================
// GLOBAL OBJECTS & STATE VARIABLES
// ============================================================================

DHT dht(DHT_PIN, DHT_TYPE);

unsigned long lastReportTime    = 0;
unsigned long lastReconnectTime = 0;
unsigned long motionCount       = 0;
int estimatedOccupancy          = 0;
unsigned long lastMotionTime    = 0;
bool wifiWasConnected           = false;

// ============================================================================
// HELPER FUNCTIONS: LED STATUS CONTROL
// ============================================================================

void setLeds(bool red, bool green, bool blue) {
    digitalWrite(LED_RED,   red   ? HIGH : LOW);
    digitalWrite(LED_GREEN, green ? HIGH : LOW);
    digitalWrite(LED_BLUE,  blue  ? HIGH : LOW);
}

void indicateDisconnected() {
    setLeds(true, false, false); // RED on
}

void indicateConnectedIdle() {
    setLeds(false, true, false); // GREEN on
}

void indicateTransmitting() {
    setLeds(false, true, true);  // GREEN + BLUE on (or BLUE only)
}

// ============================================================================
// HELPER FUNCTIONS: WIFI CONNECTION MANAGER
// ============================================================================

void connectToWiFi() {
    Serial.println();
    Serial.println(F("=================================================="));
    Serial.print(F("[WiFi] Connecting to SSID: "));
    Serial.println(WIFI_SSID);
    
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    indicateDisconnected();
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(F("."));
        // Flash Red LED while connecting
        digitalWrite(LED_RED, !digitalRead(LED_RED));
        attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println();
        Serial.println(F("✅ [WiFi] Connected successfully!"));
        Serial.print(F("[WiFi] IP Address : "));
        Serial.println(WiFi.localIP());
        Serial.print(F("[WiFi] MAC Address: "));
        Serial.println(WiFi.macAddress());
        Serial.print(F("[WiFi] RSSI Signal: "));
        Serial.print(WiFi.RSSI());
        Serial.println(F(" dBm"));
        Serial.println(F("=================================================="));
        indicateConnectedIdle();
        wifiWasConnected = true;
    } else {
        Serial.println();
        Serial.println(F("❌ [WiFi] Connection failed. Will retry in background..."));
        indicateDisconnected();
    }
}

// ============================================================================
// HELPER FUNCTIONS: SENSOR READING & CALIBRATION
// ============================================================================

float readTemperature() {
    float temp = dht.readTemperature();
    if (isnan(temp)) {
        Serial.println(F("⚠️ [DHT22] Warning: Failed to read temperature from sensor."));
        return 22.5; // Reasonable room temp default
    }
    return temp;
}

float readHumidity() {
    float hum = dht.readHumidity();
    if (isnan(hum)) {
        return 45.0;
    }
    return hum;
}

float readSmokePercentage() {
    // Read 12-bit ADC value (0 to 4095) from MQ-2 analog pin
    int rawValue = analogRead(MQ2_PIN);
    
    // Baseline clean air ADC value for MQ-2 typically ranges ~300-800
    // Smoke / high combustible gas triggers ADC above 1500 to 4000+
    // Normalize into 0.0% to 100.0% smoke concentration scale
    float smokePct = 0.0;
    if (rawValue > 400) {
        smokePct = ((float)(rawValue - 400) / (4095.0 - 400.0)) * 100.0;
        if (smokePct > 100.0) smokePct = 100.0;
    }
    return smokePct;
}

int calculateOccupancy() {
    // Read PIR sensor digital pin (HIGH = Motion Detected)
    int pirState = digitalRead(PIR_PIN);
    unsigned long now = millis();
    
    if (pirState == HIGH) {
        if (now - lastMotionTime > 500) { // Debounce 500ms
            motionCount++;
            lastMotionTime = now;
        }
    }
    
    // Decay occupancy estimate over time if no motion
    if (now - lastMotionTime < 10000) {
        // Active motion within last 10s: calculate occupancy estimate based on activity
        estimatedOccupancy = max(1, min(12, (int)(1 + (motionCount % 8))));
    } else if (now - lastMotionTime < 30000) {
        // Lingering occupancy
        estimatedOccupancy = max(0, estimatedOccupancy - 1);
    } else {
        // Room vacant
        estimatedOccupancy = 0;
        motionCount = 0;
    }
    
    return estimatedOccupancy;
}

// ============================================================================
// HELPER FUNCTIONS: HTTP POST TRANSMISSION
// ============================================================================

bool sendSensorReading(const char* sensorType, float value) {
    if (WiFi.status() != WL_CONNECTED) {
        indicateDisconnected();
        return false;
    }
    
    HTTPClient http;
    
    // Build server URL: http://<HOST>:<PORT>/api/sensor-reading
    String serverUrl = "http://" + String(SERVER_HOST) + ":" + String(SERVER_PORT) + String(API_PATH);
    
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(2500); // 2.5 second timeout
    
    // Build JSON Payload: {"device_id": "esp32_001", "sensor_type": "...", "value": ...}
    // Format float with 1 decimal precision
    String payload = "{";
    payload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
    payload += "\"zone_id\":\"" + String(ASSIGNED_ZONE) + "\",";
    payload += "\"sensor_type\":\"" + String(sensorType) + "\",";
    payload += "\"value\":" + String(value, 1);
    payload += "}";
    
    int httpResponseCode = http.POST(payload);
    bool success = false;
    
    if (httpResponseCode > 0) {
        if (httpResponseCode >= 200 && httpResponseCode < 300) {
            success = true;
            Serial.printf("  📡 [%s] Sent: %s -> HTTP %d OK\n", sensorType, payload.c_str(), httpResponseCode);
        } else {
            Serial.printf("  ⚠️ [%s] HTTP Server Error: %d\n", sensorType, httpResponseCode);
        }
    } else {
        Serial.printf("  ❌ [%s] POST Failed, Error: %s\n", sensorType, http.errorToString(httpResponseCode).c_str());
    }
    
    http.end();
    return success;
}

// ============================================================================
// MAIN ARDUINO SETUP
// ============================================================================

void setup() {
    // 1. Initialize Serial Interface
    Serial.begin(115200);
    delay(500);
    
    Serial.println();
    Serial.println(F("=================================================="));
    Serial.println(F("   🚨 CRISISAGENT ESP32 SENSOR FIRMWARE v1.0.0   "));
    Serial.println(F("=================================================="));
    Serial.printf("   Device ID    : %s\n", DEVICE_ID);
    Serial.printf("   Bound Zone   : %s\n", ASSIGNED_ZONE);
    Serial.printf("   Target Server: http://%s:%d%s\n", SERVER_HOST, SERVER_PORT, API_PATH);
    Serial.printf("   Interval     : %lu ms\n", REPORT_INTERVAL_MS);
    Serial.println(F("=================================================="));
    
    // 2. Initialize GPIO Pins
    pinMode(LED_RED, OUTPUT);
    pinMode(LED_GREEN, OUTPUT);
    pinMode(LED_BLUE, OUTPUT);
    pinMode(PIR_PIN, INPUT);
    pinMode(MQ2_PIN, INPUT);
    
    // Initial LED Self-Test
    setLeds(true, true, true);
    delay(400);
    setLeds(false, false, false);
    
    // 3. Initialize DHT22 Sensor
    Serial.println(F("[Hardware] Initializing DHT22 temperature sensor on GPIO 4..."));
    dht.begin();
    
    // 4. Configure ADC for MQ-2
    analogReadResolution(12); // 12-bit resolution (0-4095)
    analogSetAttenuation(ADC_11db); // Full range up to ~3.3V
    
    // 5. Connect to WiFi
    connectToWiFi();
}

// ============================================================================
// MAIN ARDUINO EXECUTION LOOP
// ============================================================================

void loop() {
    unsigned long currentMillis = millis();
    
    // Check WiFi Connection & Auto-Reconnect
    if (WiFi.status() != WL_CONNECTED) {
        indicateDisconnected();
        if (currentMillis - lastReconnectTime >= WIFI_RECONNECT_MS) {
            lastReconnectTime = currentMillis;
            Serial.println(F("[WiFi] Reconnecting..."));
            WiFi.reconnect();
        }
        delay(100);
        return;
    } else {
        if (!wifiWasConnected) {
            indicateConnectedIdle();
            wifiWasConnected = true;
        }
    }
    
    // Continuously sample PIR motion in fast loop
    calculateOccupancy();
    
    // Periodic Telemetry Reporting
    if (currentMillis - lastReportTime >= REPORT_INTERVAL_MS) {
        lastReportTime = currentMillis;
        
        // Turn ON Blue LED during transmission
        indicateTransmitting();
        
        Serial.println();
        Serial.printf("⏰ [Telemetry Report @ %lu ms]\n", currentMillis);
        
        // 1. Read Sensors
        float temperature = readTemperature();
        float humidity    = readHumidity();
        float smoke       = readSmokePercentage();
        int   occupancy   = calculateOccupancy();
        
        Serial.printf("  📊 Read: Temp=%.1f°C | Hum=%.1f%% | Smoke=%.1f%% | Occ=%d\n",
                      temperature, humidity, smoke, occupancy);
        
        // 2. Transmit Readings via HTTP POST to Backend
        bool okTemp  = sendSensorReading("temperature", temperature);
        bool okSmoke = sendSensorReading("smoke", smoke);
        bool okOcc   = sendSensorReading("occupancy", (float)occupancy);
        
        // Restore Normal LED state
        if (okTemp && okSmoke && okOcc) {
            indicateConnectedIdle();
        } else {
            // Blink red on partial failure
            setLeds(true, false, false);
            delay(100);
            indicateConnectedIdle();
        }
    }
    
    // Yield CPU time to ESP32 RTOS background tasks
    delay(10);
}

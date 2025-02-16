const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");

const app = express();
const PORT = 3000;

app.use(cors());

// Función para escanear la red con Nmap
function escanearRed(callback) {
    console.log("🔍 Escaneando la red");

    const nmapPath = `"C:\\Program Files (x86)\\Nmap\\nmap.exe"`; // Ruta de Nmap en Windows
    const comando = `${nmapPath} -sn 192.168.128.0/24`; //tienes que verificar tu direccion ip para agregarla aqui

    exec(comando, (error, stdout, stderr) => {
        if (error) {
            console.error("❌ Error al escanear la red:", error.message);
            return callback({ error: error.message });
        }

        const lines = stdout.split("\n");
        const dispositivos = [];
        let currentDevice = {};

        for (let i = 0; i < lines.length; i++) {
            let matchHost = lines[i].match(/Nmap scan report for (.+) \((\d+\.\d+\.\d+\.\d+)\)/) ||
                            lines[i].match(/Nmap scan report for (\d+\.\d+\.\d+\.\d+)/);
            let matchMAC = lines[i].match(/MAC Address: ([\w:]+) \((.+)\)/);
            let matchLatency = lines[i].match(/Host is up \(([\d.]+)s latency\)/);

            if (matchHost) {
                if (Object.keys(currentDevice).length > 0) {
                    dispositivos.push(currentDevice);
                }
                currentDevice = {
                    host: matchHost[1] || "Desconocido",
                    ip: matchHost[2] || matchHost[1],
                    mac: "No detectado",
                    fabricante: "No identificado",
                    latencia: "N/A"
                };
            }

            if (matchMAC) {
                currentDevice.mac = matchMAC[1];
                currentDevice.fabricante = matchMAC[2];
            }

            if (matchLatency) {
                currentDevice.latencia = `${matchLatency[1]}s`;
            }
        }

        if (Object.keys(currentDevice).length > 0) {
            dispositivos.push(currentDevice);
        }

        callback(dispositivos);
    });
}

// Endpoint para escanear la red
app.get("/scan", (req, res) => {
    escanearRed((data) => {
        if (data.error) {
            return res.status(500).json({ error: "Error al escanear la red." });
        }
        res.json(data);
    });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

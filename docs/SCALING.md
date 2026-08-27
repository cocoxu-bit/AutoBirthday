# 🚀 Guía de Escalabilidad y Optimización de Memoria RAM (Evolution API + Baileys)

Este documento detalla la arquitectura de infraestructura, consumo de memoria por sesión de WhatsApp y la capacidad de escalabilidad de **AutoBirthday**.

---

## 1. El Problema de Fábrica de Baileys

Por defecto, cuando un usuario vincula una sesión de WhatsApp Web a través de Baileys / Evolution API:
* WhatsApp vuelca en el servidor **hasta 3 meses de mensajes pasados, fotos, audios, stickers y estados**.
* Cada sesión sin optimizar consume entre **80 MB y 120 MB de RAM**.
* **Impacto en AutoBirthday:** AutoBirthday **no necesita** el historial de conversaciones pasadas; únicamente necesita emitir felicitaciones (`sendText`), recibir confirmaciones (`messages.upsert`) y consultar nombres de contactos y grupos (`fetchAllGroups`).

---

## 2. Configuración Ultra-Ligera Aplicada

Optimizamos las variables de entorno de Evolution API para **eliminar el 100% de la carga de mensajes pasados** pero **manteniendo la lista de contactos y grupos intacta**:

```yaml
# 🚫 DESACTIVAR DESCARGA Y ALMACENAMIENTO DE MENSAJES (Ahorro del 80% de RAM):
DATABASE_SAVE_DATA_HISTORIC: "false"  # No sincroniza los 3 meses de chats antiguos al escanear QR
DATABASE_SAVE_DATA_MESSAGES: "false"  # No guarda texto de mensajes entrantes/salientes en SQLite
DATABASE_SAVE_MESSAGE_UPDATE: "false" # No rastrea ediciones/borrados de mensajes ajenos
STORE_MESSAGES: "false"               # No mantiene buffers de mensajes en la memoria RAM
STORE_MESSAGE_UP: "false"             # No mantiene historial de mensajes en memoria

# ✅ CONSERVAR CONTACTOS Y GRUPOS (< 0.5 MB por instancia):
STORE_CONTACTS: "true"                # Permite autocompletar nombres y teléfonos en el formulario
STORE_CHATS: "true"                   # Permite listar los grupos de WhatsApp en el desplegable
DATABASE_SAVE_DATA_CONTACTS: "true"
DATABASE_SAVE_DATA_CHATS: "true"

# ⚡ OPTIMIZACIÓN NODE.JS
NODE_OPTIONS: "--max-old-space-size=512 --enable-source-maps=false"
```

---

## 3. Tabla de Capacidad y Concurrencia de Usuarios

| Servidor / Hardware | RAM Disponible | Sesiones Sin Optimizar (~100 MB) | Sesiones Optimizadas (~20 MB) | Coste Mensual |
| :--- | :--- | :--- | :--- | :--- |
| **VPS Básico** | 1 GB RAM | ~8 usuarios *(Riesgo de crash)* | **~40 usuarios** | ~4 - 5 € / mes |
| **VPS Medio** | 4 GB RAM | ~35 usuarios | **~180 usuarios** | ~10 - 15 € / mes |
| **VPS Avanzado** | 8 GB RAM | ~70 usuarios | **~380 usuarios** | ~20 - 30 € / mes |
| **Oracle Cloud Always Free (Ampere A1 ARM)** | **24 GB RAM (4 OCPU)** | ~220 usuarios | **1.100 - 1.300 usuarios activos** | **0,00 € / mes (Gratis de por vida)** |

---

## 4. ¿Por qué NO recomendamos la "Hibernación / Lazy Connection"?

1. **Latencia de Reconexión:** Levantar una sesión hibernada en Baileys tarda entre 3 y 8 segundos de *handshake* criptográfico.
2. **Webhooks en Tiempo Real:** Si la sesión se hiberna, el usuario no podría recibir o responder interactivamente al bot (`SÍ / EDITAR / NO`) en tiempo real.
3. **Consumo Insignificante:** Con las variables aplicadas, un socket en reposo gasta **~15 MB de RAM y 0% de CPU**.

---

## 5. Cómo aplicar los cambios en tu Servidor VPS

1. Conéctate a tu servidor por SSH:
   ```bash
   ssh ubuntu@158.179.209.157
   ```
2. Abre tu archivo `docker-compose.yml` o `.env` de Evolution API.
3. Aplica las variables indicadas arriba.
4. Reinicia el contenedor:
   ```bash
   docker compose down && docker compose up -d
   ```

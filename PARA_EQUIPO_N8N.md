# ⚡ Restaurante Equis — Documento para el Equipo de n8n
### Lo que necesitamos de ustedes | Julio 2026

---

## Su misión

Configurar el flujo de automatización en n8n para que los pedidos del restaurante lleguen automáticamente por **WhatsApp Business** a la cocina, sin que el empleado tenga que hacer nada manualmente.

**El sistema ya está funcionando** en `http://restauranteequis.158.220.100.226.nip.io/` — actualmente el POS genera el mensaje pero el cajero lo envía a mano. El objetivo es que n8n lo haga automáticamente.

---

## Contexto: ¿Cómo funciona el flujo actual?

```
Cajero crea pedido en el POS
        ↓
Sistema guarda en la base de datos
        ↓
Se abre WhatsApp con el mensaje preparado
        ↓
Cajero presiona "Enviar" manualmente ← ESTO QUEREMOS ELIMINAR
```

---

## Flujo objetivo con n8n

```
Cajero crea pedido en el POS
        ↓
Sistema guarda en la base de datos
        ↓
Sistema llama al Webhook de n8n (automático, POST)
        ↓
n8n envía el mensaje al grupo de WhatsApp de cocina
        ↓
n8n espera 10 minutos
        ↓ (si el pedido sigue en "Preparando")
n8n envía alerta de urgencia al supervisor
```

---

## Lo que deben entregarnos

Un solo dato:

```
URL del webhook de n8n:
https://n8n.su-dominio.com/webhook/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
```

Con esa URL nosotros conectamos el backend para que envíe los pedidos automáticamente.

---

## El mensaje que recibirá el webhook

Cuando el POS procesa un pedido, n8n recibirá un `POST` con este JSON:

```json
{
  "id_pedido": 9650,
  "hora": "2026-07-06T17:05:00",
  "tipo": "mesa",
  "mesa": 4,
  "cliente": {
    "nombre": "JUAN PÉREZ",
    "cedula": "V-12345678",
    "telefono": "0414-1234567"
  },
  "items": [
    {
      "nombre": "Hamburguesa Clásica",
      "cantidad": 2,
      "notas": "SIN CEBOLLA"
    },
    {
      "nombre": "Papas Fritas",
      "cantidad": 2,
      "notas": ""
    },
    {
      "nombre": "Refresco 350ml",
      "cantidad": 2,
      "notas": ""
    }
  ],
  "subtotal": 24.00,
  "iva": 3.84,
  "total": 27.84
}
```

---

## Mensaje sugerido para WhatsApp (pueden adaptarlo)

```
🍔 *NUEVO PEDIDO #9650*

👤 *Cliente:* JUAN PÉREZ
📞 *Teléfono:* 0414-1234567
🪑 *Mesa:* 4

📋 *Ítems:*
• 2x Hamburguesa Clásica _(SIN CEBOLLA)_
• 2x Papas Fritas
• 2x Refresco 350ml

💵 Subtotal: $24.00
   IVA (16%): $3.84
💰 *TOTAL: $27.84*
```

---

## Endpoint que puede usar n8n para verificar el estado de un pedido

Si quieren implementar la alerta de pedido urgente (lleva más de 10 minutos en preparación):

```
GET http://restauranteequis.158.220.100.226.nip.io/api/ordenes?estatus=activo
```

Responde con la lista de pedidos activos. Filtrar por `hora_creacion` para detectar los que llevan más de 10 minutos.

Para cambiar el estado de un pedido desde n8n si lo necesitan:

```
PUT http://restauranteequis.158.220.100.226.nip.io/api/ordenes/{id_pedido}
Content-Type: application/json

{
  "Estatus_Orden": "Preparando"
}
```

**Estados válidos:** `"Recibido"` → `"Preparando"` → `"Listo"`

---

## Todos los endpoints disponibles (referencia)

**Documentación interactiva:** `http://restauranteequis.158.220.100.226.nip.io/api/docs`

| Método | URL | Descripción |
|--------|-----|-------------|
| GET | `/api/` | Health check |
| GET | `/api/ordenes` | Todas las órdenes |
| GET | `/api/ordenes?estatus=activo` | Órdenes activas (para monitoreo) |
| POST | `/api/ordenes` | Nueva orden (lo llama el POS) |
| PUT | `/api/ordenes/{id}` | Cambiar estado de orden |
| DELETE | `/api/ordenes/{id}` | Cancelar orden |
| GET | `/api/productos` | Catálogo de productos |
| GET | `/api/reportes/resumen` | KPIs (total pedidos, ingresos, tiempo promedio) |

---

## Flujos de n8n sugeridos (pueden construirlos)

### Flujo 1 — Notificación inmediata de nuevo pedido
1. **Nodo:** Webhook (recibe el POST del sistema)
2. **Nodo:** Set (formatear el mensaje de WhatsApp)
3. **Nodo:** WhatsApp Business → enviar al grupo de cocina

### Flujo 2 — Alerta de pedido urgente (opcional)
1. **Nodo:** Schedule Trigger (cada 5 minutos)
2. **Nodo:** HTTP Request → `GET /api/ordenes?estatus=activo`
3. **Nodo:** Function (filtrar pedidos con hora_creacion > 10 min)
4. **Nodo:** IF (¿hay pedidos urgentes?)
5. **Nodo:** WhatsApp Business → enviar alerta al supervisor

### Flujo 3 — Confirmación de despacho (opcional)
1. **Nodo:** Webhook (recibe notificación cuando estado cambia a "Listo")
2. **Nodo:** WhatsApp Business → notificar al cajero/cliente

---

## 📞 Punto de contacto

Cuando tengan el webhook de n8n configurado y la URL lista, comunicarse con **[Tu nombre]** para conectar el backend.

**Nota:** El sistema puede funcionar sin n8n en la primera etapa. La integración se activa en una segunda fase.

---

*Restaurante Equis — Sistema de Gestión v1.0 — Julio 2026*

# Smart Tennis Lab — App móvil

App de captura de estadísticas de tenis en vivo. El profe mira el partido y va tocando botones
contador; al final obtiene un reporte para trabajar con el alumno.

Pensada para celular y tablet, y sobre todo para **funcionar sin señal**: en la cancha el dato se
guarda primero en el dispositivo y se sincroniza cuando hay conexión.

El backend está en [`smart-tennis-lab-backend`](../backend).

## Stack

| | |
|---|---|
| Framework | Expo SDK 57 + React Native 0.86 |
| Lenguaje | TypeScript (strict) |
| Navegación | expo-router (typed routes) |
| Estado servidor | TanStack Query |
| Estado local | Zustand |
| Persistencia offline | expo-sqlite |
| Credenciales | expo-secure-store |

## Decisiones de diseño

**Offline-first, sin excepciones.** Durante un partido la fuente de verdad es el SQLite del
dispositivo. La app encola los taps y los manda al backend en lotes; cada evento lleva un UUID
generado en el celular, así reintentar nunca duplica nada.

**La app no sabe qué KPIs existen.** El catálogo llega de `GET /api/v1/kpis` y la pantalla de
captura se arma con eso. Cuando se agreguen los KPIs de dobles, la app los muestra sin necesidad de
publicar una versión nueva.

**UI para usar sin mirar.** Fondo oscuro para que se lea con sol directo, áreas de toque de 64 px
como mínimo, vibración en cada tap y pantalla que no se bloquea mientras hay un partido en curso.

## Cómo levantarla

```bash
cp .env.example .env    # y apuntá EXPO_PUBLIC_API_URL a tu backend
npm install
npm start               # escaneá el QR con Expo Go
```

Ojo con la URL del backend: el celular no ve el `localhost` de la compu. Usá la IP de tu máquina en
la red local (`http://192.168.x.x:8080`), o `http://10.0.2.2:8080` si estás en el emulador de
Android.

```bash
npm run typecheck
npm run lint
```

## Estructura

```
src/
├── app/      pantallas (expo-router: el archivo define la ruta)
├── api/      cliente HTTP y tipos de la API
├── lib/      SQLite, cola de sincronización y utilidades
└── theme/    tokens de diseño
```

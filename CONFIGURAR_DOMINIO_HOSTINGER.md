# 🌐 Guía de Configuración de Dominio Personalizado: `alacena.cobertores.com`

Esta guía contiene los pasos exactos para conectar tu propio dominio alojado en **Hostinger** (`cobertores.com`) con el sistema en la nube de **Firebase Hosting**.

---

## 📌 Datos Clave del Proyecto
- **Subdominio deseado:** `alacena.cobertores.com`
- **Proveedor de Dominio:** Hostinger
- **Proyecto de Firebase:** `alacena-enterprise-prod`
- **Hosting URL actual:** `https://alacena-enterprise-prod.web.app`

---

## 🚀 Paso 1: Registrar el Dominio en Firebase Console

1. Abre la consola de Firebase:  
   👉 [https://console.firebase.google.com/project/alacena-enterprise-prod/hosting/sites](https://console.firebase.google.com/project/alacena-enterprise-prod/hosting/sites)
2. En la sección **Hosting**, haz clic en el botón **"Agregar dominio personalizado"** (o *"Add custom domain"*).
3. En la casilla de texto, escribe:
   ```text
   alacena.cobertores.com
   ```
4. **Desmarca** la casilla de *"Redireccionar alacena.cobertores.com a otro sitio"* (queremos que cargue la app directamente ahí).
5. Haz clic en **Continuar**.
6. Firebase te mostrará la pantalla de **"Verificación y Configuración de DNS"** con uno o dos registros de tipo **A** o **CNAME**.
   > *Ejemplo típico que proporciona Firebase:*
   > - **Tipo:** `A`
   > - **Host / Nombre:** `alacena`
   > - **Valor / Destino:** `199.36.158.100` (y a veces una segunda IP de respaldo como `199.36.158.100`)

---

## 🛠️ Paso 2: Configurar los Registros DNS en Hostinger

1. Inicia sesión en tu cuenta de **Hostinger** (hPanel):  
   👉 [https://hpanel.hostinger.com](https://hpanel.hostinger.com)
2. Ve a la sección **Dominios** y selecciona `cobertores.com`.
3. En el menú lateral izquierdo, haz clic en **DNS / Servidores de Nombres** (o *Zona DNS*).
4. En el apartado **Administrar registros DNS**, agrega un nuevo registro:

### Opción A (Si Firebase te dio registros de tipo A — Más común):
- **Tipo:** `A`
- **Nombre:** `alacena` (Hostinger automáticamente le añade `.cobertores.com`)
- **Apunta a:** La IP que te indicó Firebase en el Paso 1 (ej. `199.36.158.100`)
- **TTL:** `300` segundos (para que se propague de inmediato)
- Haz clic en **Agregar registro**.

*(Si Firebase te proporcionó 2 direcciones IP, agrega un segundo registro `A` con el mismo nombre `alacena` y la segunda IP).*

### Opción B (Si Firebase te sugiere CNAME):
- **Tipo:** `CNAME`
- **Nombre:** `alacena`
- **Apunta a:** `alacena-enterprise-prod.web.app`
- **TTL:** `300` segundos
- Haz clic en **Agregar registro**.

---

## ⏳ Paso 3: Propagación y Certificado SSL (HTTPS Automático)

1. Una vez guardados los registros en Hostinger, regresa a la pestaña de Firebase Hosting y haz clic en **Finalizar**.
2. **Propagación DNS:** Suele tardar entre **10 y 30 minutos** (en ocasiones raras hasta 24 horas).
3. **Certificado de Seguridad SSL:** Google Firebase genera e instala automáticamente un certificado SSL gratuito Let's Encrypt para `alacena.cobertores.com`. Mientras se emite, el estado en Firebase dirá *"Aprovisionando certificado SSL"*.
4. Cuando el estado cambie a **"Conectado"**, ya podrás ingresar directamente desde cualquier teléfono o computadora a:
   👉 **`https://alacena.cobertores.com`**

---

## 🔄 Paso 4: Cómo verificar la conexión desde tu terminal

Puedes abrir PowerShell en tu computadora y ejecutar este comando en cualquier momento para comprobar si Hostinger ya está respondiendo con las IPs de Google:

```powershell
nslookup alacena.cobertores.com
```

Cuando veas que responde con las IPs de Firebase (`199.36.158.100`), la conexión está lista.

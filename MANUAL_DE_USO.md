# Manual de uso — Plataforma de Inducción RR.HH. Lavín

**Versión:** 1.1  
**Última actualización:** Junio 2026  
**Audiencia:** Empleados, encargados de área, personal de Recursos Humanos y equipo de TI

---

## Tabla de contenidos

1. [Introducción](#1-introducción)
2. [¿Qué es esta plataforma?](#2-qué-es-esta-plataforma)
3. [Requisitos y cómo acceder](#3-requisitos-y-cómo-acceder)
4. [Roles de usuario](#4-roles-de-usuario)
5. [Inicio de sesión (paso a paso)](#5-inicio-de-sesión-paso-a-paso)
6. [Vista del empleado — pantalla principal](#6-vista-del-empleado--pantalla-principal)
7. [Inducción a la empresa (10 módulos)](#7-inducción-a-la-empresa-10-módulos)
8. [Inducción al puesto (checklist)](#8-inducción-al-puesto-checklist)
9. [Exámenes y evaluaciones](#9-exámenes-y-evaluaciones)
10. [Dudas, contacto y notificaciones](#10-dudas-contacto-y-notificaciones)
11. [Vista del encargado de área (supervisor)](#11-vista-del-encargado-de-área-supervisor)
12. [Panel de Recursos Humanos (administrador)](#12-panel-de-recursos-humanos-administrador)
13. [Preguntas frecuentes y solución de problemas](#13-preguntas-frecuentes-y-solución-de-problemas)
14. [Anexo técnico para el equipo de TI](#14-anexo-técnico-para-el-equipo-de-ti)

---

## 1. Introducción

Este manual describe **en detalle** cómo usar la **Plataforma de Inducción RR.HH. de Industrias Lavín**: qué hace cada pantalla, cada botón, cada campo de formulario y cada flujo de trabajo.

La plataforma está diseñada para funcionar **dentro de la red local de la empresa** (on-premise), sin necesidad de internet. Los colaboradores acceden desde computadora, tablet o celular conectados a la red WiFi o cableada de Lavín.

---

## 2. ¿Qué es esta plataforma?

### 2.1 Propósito

La plataforma digitaliza el **programa de inducción corporativa** que antes se realizaba de forma presencial o con documentos físicos. Permite que cada colaborador:

- Vea **videos formativos** sobre la empresa, sus políticas, beneficios y normas.
- Responda **exámenes** para comprobar que comprendió el contenido.
- Complete una **encuesta de satisfacción** al terminar.
- Realice su **inducción al puesto** mediante un checklist de actividades (solo personal administrativo).
- Marque los **recordatorios importantes** (recorrido en planta y código de conducta), obligatorios para generar la evidencia.
- Envíe **dudas** directamente a Recursos Humanos.
- Solicite acceso a **sistemas** una vez terminada la inducción a la empresa (el recorrido en planta también se registra en los recordatorios).

Al mismo tiempo, Recursos Humanos puede:

- Crear y administrar usuarios.
- Ver el **progreso** de cada colaborador en tiempo real.
- Responder dudas y atender solicitudes.
- Subir videos y editar módulos.
- Generar **dos hojas de evidencia PDF** (empresa y puesto, por separado) y exportar **CSV** con el progreso.

### 2.2 Dos rutas de inducción

| Ruta | ¿Quién la usa? | ¿Qué contiene? |
|------|----------------|----------------|
| **Inducción a la empresa** | Colaboradores habilitados (operativos, administrativos y ayudante general) | 10 módulos secuenciales con video, examen y encuesta final |
| **Inducción al puesto** | Solo empleados del programa **Administrativo** con acceso habilitado | Checklist de 13 actividades presenciales con su encargado/mentor |

Además, **todos** los colaboradores con inducción empresa y/o puesto habilitada deben completar los **2 recordatorios importantes** (recorrido en planta y código de conducta). El progreso se comparte entre ambas rutas: marcarlos una vez cuenta para las dos hojas de evidencia.

Un empleado **administrativo** puede tener habilitadas **ambas rutas** y elegir cuál realizar primero desde la pantalla principal.

### 2.3 Tecnología (referencia)

- **Frontend:** aplicación web Vue 3 (interfaz en español).
- **Backend:** servidor Node.js con API REST.
- **Base de datos:** PostgreSQL local.
- **Autenticación:** usuario + contraseña con sesión segura (token JWT).

---

## 3. Requisitos y cómo acceder

### 3.1 Requisitos del dispositivo del usuario

- Navegador web moderno: Chrome, Edge, Firefox o Safari (versión reciente).
- Conexión a la **red local de la empresa** (WiFi o cable).
- No se requiere instalar ninguna aplicación.

### 3.2 URL de acceso

Abre el navegador y escribe la dirección que te proporcionó Recursos Humanos o el equipo de TI. El formato típico es:

```
http://IP-DEL-SERVIDOR:3500
```

**Ejemplo:** `http://192.168.1.50:3500`

> Si la empresa configuró un servidor web (Nginx) en el puerto 80, la URL puede ser simplemente `http://IP-DEL-SERVIDOR` sin el `:3500`.

### 3.3 Credenciales iniciales (solo personal de RH y pruebas)

Tras la instalación inicial del sistema, existen cuentas de demostración:

| Rol | Nómina | Contraseña |
|-----|--------|------------|
| Administrador RH | `ADMIN001` | `Admin2024!` |
| Encargado de área (ejemplo) | `SUP001` | `Super2024!` |

> **Importante:** Los empleados reales **no** usan estas credenciales. Cada colaborador ingresa con su **número de nómina** y crea su propia contraseña en el primer acceso.

### 3.4 Duración de la sesión

La sesión permanece activa mientras la pestaña del navegador esté abierta. Si cierras el navegador o la pestaña, deberás volver a iniciar sesión. La sesión expira automáticamente tras **8 horas** de inactividad (configurable por TI).

---

## 4. Roles de usuario

La plataforma tiene **tres tipos de cuenta**. Cada una ve pantallas diferentes al iniciar sesión.

### 4.1 Empleado

- Es el rol por defecto de todo colaborador.
- Accede al **programa de inducción** (módulos o checklist).
- Puede enviar dudas, completar exámenes y solicitar recorrido/sistemas.
- **No** puede ver el progreso de otros colaboradores.

**Subtipos de programa:**

| Programa | Inducción empresa | Inducción puesto |
|----------|-------------------|------------------|
| **Operativo** | Sí (si RH lo habilita) | No |
| **Administrativo** | Sí (si RH lo habilita) | Sí (si RH lo habilita, además de empresa) |
| **Ayudante general** | Sí (si RH lo habilita) | No |

### 4.2 Encargado de área (Supervisor)

- Ve el **progreso de los empleados de su área** asignada.
- Puede exportar un archivo CSV con el avance del equipo.
- **No** puede editar módulos, usuarios ni contenido.
- Si también tiene rol de admin, puede acceder al panel de RH.

### 4.3 Recursos Humanos (Administrador)

- Acceso completo al **panel de administración**.
- Gestiona usuarios, módulos, videos, áreas, dudas, notificaciones y encuestas.
- Ve dashboards con métricas y gráficas.
- Genera reportes de evidencia y PDF.

---

## 5. Inicio de sesión (paso a paso)

La pantalla de login (`/login`) tiene **tres pasos posibles** según tu situación.

### 5.1 Paso 1 — Ingresar nómina

**Qué ves:**
- Logo de Lavín.
- Título: *"Accede con tu nómina"*.
- Campo **Número de nómina** (teclado numérico en móvil).
- Botón **Continuar**.

**Qué hace el sistema al pulsar Continuar:**

1. Busca tu nómina en la base de datos.
2. **Si eres empleado nuevo** (nómina no registrada): crea tu cuenta automáticamente y te lleva al **Paso 2** para crear contraseña.
3. **Si ya tienes cuenta pero nunca creaste contraseña:** te lleva al **Paso 2**.
4. **Si ya tienes contraseña** (empleado, supervisor o admin): te lleva al **Paso 3**.
5. **Si la nómina es incorrecta o la cuenta está desactivada:** muestra un mensaje de error.

**Nota para RH:** En la parte inferior aparece el recordatorio: *"Personal de RR.HH.: nómina ADMIN001 y contraseña en el siguiente paso."*

---

### 5.2 Paso 2 — Crear contraseña (primer acceso)

**Cuándo aparece:** Primera vez que un empleado ingresa con su nómina.

**Qué ves:**
- Título: *"Crea tu contraseña"*.
- Saludo personalizado con tu nombre (si el sistema lo conoce).
- Campo **Nueva contraseña** (con botón de mostrar/ocultar 👁).
- Campo **Confirmar contraseña**.
- Texto de ayuda: *"Mínimo 8 caracteres, una mayúscula y un número."*
- Botón **Guardar y entrar**.
- Enlace **← Cambiar nómina** (vuelve al paso 1).

**Reglas de la contraseña:**

| Regla | Ejemplo válido | Ejemplo inválido |
|-------|----------------|------------------|
| Mínimo 8 caracteres | `Lavin2024` | `Lav1` |
| Al menos 1 mayúscula | `Lavin2024` | `lavin2024` |
| Al menos 1 número | `Lavin2024` | `LavinPass` |
| Ambas contraseñas deben coincidir | — | Si escribes diferente en confirmar |

**Qué pasa al guardar:** El sistema registra tu contraseña, inicia sesión automáticamente y te redirige a tu pantalla principal según tu rol.

---

### 5.3 Paso 3 — Ingresar contraseña

**Cuándo aparece:** Accesos posteriores al primero, o para supervisores y administradores.

**Qué ves:**
- Título: *"Ingresa tu contraseña"* (empleado) o *"Contraseña de administrador"* (RH/supervisor).
- Campo **Contraseña** con botón mostrar/ocultar.
- Botón **Entrar**.
- Enlaces adicionales (solo empleados):
  - **¿Olvidaste tu contraseña?**
  - **¿Es tu primer acceso? Crea tu contraseña**
- Enlace **← Cambiar nómina**.

**¿Olvidaste tu contraseña?**

1. Pulsa el enlace **¿Olvidaste tu contraseña?**
2. El sistema envía una **notificación a Recursos Humanos** con tu solicitud.
3. Aparece un mensaje de confirmación (verde).
4. RH atiende la solicitud desde el panel de **Notificaciones** y puede restablecer tu contraseña.
5. **No** se envía contraseña nueva automáticamente por correo; debes coordinarte con RH.

**¿Es tu primer acceso?**

Si RH te dio acceso pero aún no creaste contraseña, usa este enlace para ir al Paso 2 sin volver a escribir la nómina.

---

### 5.4 A dónde te lleva después del login

| Rol | Pantalla de destino |
|-----|---------------------|
| Empleado con acceso habilitado | Inducción (empresa o puesto, según corresponda) |
| Empleado sin acceso habilitado | Mensaje *"Inducción no disponible"* |
| Empleado administrativo con ambas rutas | Selector de ruta (empresa / puesto) |
| Supervisor | `/supervisor` — Progreso de mi equipo |
| Administrador RH | `/admin/dashboard` — Panel de administración |

---

## 6. Vista del empleado — pantalla principal

### 6.1 Barra superior (header)

Cuando ya estás dentro del programa de inducción, la parte superior muestra:

| Elemento | Qué hace |
|----------|----------|
| **Logo LAVIN · Recursos Humanos** | Enlace al inicio de la inducción |
| **Badge Administrativo / Operativo / Ayudante general** | Indica tu tipo de programa. Si tienes ambas rutas habilitadas, al pulsarlo aparece un menú para cambiar entre *Inducción a la empresa* e *Inducción al puesto* |
| **Inicio** | Desplaza la página al banner de bienvenida |
| **Módulos / Checklist** | Desplaza a la lista de módulos o al checklist (según la ruta activa) |
| **Contacto** | Desplaza a la sección de contactos de RH |
| **Cerrar sesión** | Cierra tu sesión y vuelve al login |

> En la pantalla de selector de ruta (Gate), el header **no** se muestra para dar más espacio a la elección.

---

### 6.2 Pantalla de acceso no habilitado

Si RH aún no ha activado tu inducción, verás:

- Título: **Inducción no disponible**
- Mensaje: *"Tu acceso al programa de inducción aún no ha sido habilitado. Contacta a Recursos Humanos para más información."*
- Botón **Volver a inicio de sesión**

**Qué debes hacer:** Contactar a RH para que habiliten tu acceso desde el panel de Usuarios.

---

### 6.3 Selector de ruta (empleados administrativos)

Si eres **administrativo** y tienes habilitadas **ambas** inducciones, verás dos tarjetas:

| Tarjeta | Descripción |
|---------|-------------|
| **Inducción a la empresa** | Cultura, normas, beneficios y todo lo necesario para integrarte a Lavín |
| **Inducción al puesto** | Funciones de tu área, herramientas del rol y actividades específicas |

Pulsa la tarjeta deseada para entrar a esa ruta.

> Los empleados **operativos** o quienes solo tienen una ruta habilitada **no** ven este selector: el sistema los redirige automáticamente.

---

### 6.4 Banner de bienvenida (hero)

Al entrar a la inducción verás:

- **Foto de las instalaciones** de Lavín a pantalla completa.
- **Badge** con el tipo de programa (Administrativo, Operativo o Ayudante general).
- **Título de bienvenida** personalizado.
- **Descripción** del programa.
- Botón **Comenzar inducción** → desplaza suavemente hacia la sección de módulos.

---

### 6.5 Selector de ruta en la página de inducción

Si tienes más de una ruta habilitada, debajo del banner aparece la sección **"Elige tu ruta de inducción"** con tarjetas:

| Tarjeta | Función |
|---------|---------|
| **Inducción a la empresa** | Cambia a la vista de los 10 módulos |
| **Inducción al puesto** | Cambia al checklist de 13 actividades |
| **¿Necesitas ayuda?** | Desplaza a la sección de contacto |

La tarjeta activa se resalta visualmente.

---

### 6.6 Barra de progreso

En ambas rutas (empresa y puesto) aparece un panel **"Tu progreso"** que muestra:

- **Porcentaje completado** (ej. `45% completado`).
- **Barra visual** de avance.
- **Nota descriptiva** (ej. *"8 de 12 actividades completadas"*, incluyendo módulos o checklist **más** los recordatorios importantes).

Este porcentaje se actualiza automáticamente cada vez que completas un módulo, marcas una actividad del checklist o marcas un recordatorio importante.

---

### 6.7 Recordatorios importantes

En **ambas rutas** (empresa y puesto), arriba de los módulos o del checklist, aparece un bloque amarillo titulado **Recordatorios importantes** con **2 actividades obligatorias**:

| # | Recordatorio | Cuándo marcarlo |
|---|--------------|-----------------|
| 1 | **Recorrido en la planta** | Cuando hayas realizado el recorrido por las instalaciones |
| 2 | **Código de conducta y ética empresarial** | Cuando hayas leído y comprendido el código de conducta |

**Cómo usarlos:**

1. Pulsa el **checkbox circular** a la izquierda de cada ítem al completarlo.
2. Puedes **desmarcar** si te equivocaste.
3. El avance se guarda de inmediato y **es el mismo** en empresa y puesto (no necesitas marcarlos dos veces si tienes ambas rutas).

**Importante:**

- Son **obligatorios** para descargar cualquier hoja de evidencia PDF.
- Al marcar **Recorrido en la planta**, el sistema también envía una **notificación a RH** (si aún no existía), para que coordinen la visita.
- Hasta que no estén los 2 recordatorios marcados, el botón de evidencia permanece deshabilitado aunque hayas terminado todos los módulos o el checklist de puesto.

---

## 7. Inducción a la empresa (10 módulos)

### 7.1 Regla fundamental: orden secuencial

Los módulos deben completarse **en orden**. No puedes saltar al módulo 5 si no has terminado el 4.

| Estado del módulo | Icono / botón | Significado |
|-------------------|---------------|-------------|
| **Bloqueado** | Candado 🔒 | Aún no puedes abrirlo; completa el anterior |
| **Disponible** | Play ▶ | Puedes iniciarlo |
| **Completado** | Check ✓ | Ya lo terminaste; puedes revisarlo |

---

### 7.2 Los 10 módulos

| # | Nombre | Contenido principal |
|---|--------|---------------------|
| 1 | **Historia, misión, visión y valores** | Origen de Lavín, propósito, principios corporativos |
| 2 | **Organigrama y descripción de puesto** | Estructura de la empresa y áreas (muestra organigrama en imagen) |
| 3 | **Términos laborales** | Contratación, horarios, jornadas, nómina y pagos |
| 4 | **Seguridad e Higiene** | EPP, rutas de evacuación, higiene industrial |
| 5 | **Programas de Empresa** | Capacitación, bienestar, mejora continua |
| 6 | **Políticas y objetivos de calidad** | Sistema de gestión de calidad, certificaciones |
| 7 | **Lineamientos internos** | Convivencia, uso de instalaciones, comportamiento |
| 8 | **Beneficios y prestaciones** | Vacaciones, aguinaldo, prestaciones de ley y empresa |
| 9 | **Servicio médico** | Servicio médico de la empresa, protocolos de salud |
| 10 | **Evaluación del programa** | Encuesta de satisfacción (no es un examen con calificación) |

Cada módulo muestra además una **duración estimada** (referencia visual, no es un límite de tiempo).

---

### 7.3 Cómo completar un módulo (flujo detallado)

#### Paso A — Abrir el módulo

1. En la lista de módulos, pulsa el botón de acción del módulo disponible (▶ **Iniciar** o similar).
2. La pantalla se divide: a la izquierda queda la lista; a la derecha se abre el **visor del módulo**.
3. En la parte superior del visor verás: **← Volver a módulos** y **Módulo X de 10**.

#### Paso B — Ver el contenido

Según el módulo, verás uno de estos contenidos:

| Tipo | Qué ocurre |
|------|------------|
| **Video** | Reproductor con controles de play/pausa, barra de tiempo y pantalla completa. Debes ver el video hasta el final. |
| **Imagen (organigrama)** | En el módulo 2 se muestra el organigrama corporativo como imagen estática. |
| **Sin video aún** | Mensaje: *"El video de este módulo estará disponible pronto."* Contacta a RH si persiste. |

**Controles del reproductor de video:**

- **Play / Pausa:** iniciar o detener reproducción.
- **Barra de progreso:** avanzar o retroceder en el video.
- **Pantalla completa:** expandir el video a toda la pantalla.
- El video se reproduce **inline** en dispositivos móviles (no fuerza pantalla completa en iPhone).

Cuando terminas de ver el contenido, aparece un indicador: **"Contenido visto"** o **"Video completado"**.

#### Paso C — Examen (si el módulo lo tiene)

Los módulos 1 al 9 incluyen un **examen de evaluación**. El módulo 10 es la **encuesta** (ver sección 7.4).

1. Al terminar el video, el sistema abre automáticamente un **modal de examen**.
2. También puedes ver el mensaje: *"Responde la evaluación para continuar al siguiente módulo."*
3. Responde **todas** las preguntas (cada una es de opción múltiple con un solo acierto).
4. Pulsa **Enviar examen**.
5. El sistema muestra tu **calificación** inmediatamente.

**Reglas del examen:**

| Parámetro | Valor por defecto |
|-----------|-------------------|
| Calificación mínima para aprobar | **70%** |
| Intentos permitidos | **3** |
| Si apruebas | El módulo queda completado ✓ |
| Si repruebas | Puedes reintentar hasta agotar intentos |
| Si agotas intentos | Debes contactar a RH para habilitar más intentos |

> Si ya aprobaste un examen, **no** puedes volver a presentarlo.

#### Paso D — Finalizar módulo sin examen

Si el módulo no requiere examen (solo el módulo 10 funciona distinto), tras ver el contenido pulsa **Finalizar módulo**.

#### Paso E — Siguiente módulo

Una vez completado, aparece el botón **Siguiente módulo** que te lleva directamente al siguiente disponible.

---

### 7.4 Módulo 10 — Encuesta de satisfacción

El último módulo **no tiene examen con calificación**. En su lugar, presenta una **encuesta de texto libre** con estas preguntas:

1. ¿La información proporcionada fue clara y comprensible?
2. ¿El contenido del programa fue relevante para tu trabajo?
3. ¿Te sientes preparado(a) para desempeñar tus funciones?
4. ¿Cómo calificarías la organización general del programa de inducción?
5. ¿Tienes algún comentario o sugerencia para mejorar el programa?

**Cómo completarla:**

1. Abre el módulo 10 (debe estar desbloqueado tras completar el 9).
2. Responde **todas** las preguntas en los campos de texto (obligatorios).
3. Pulsa **Enviar encuesta y finalizar módulo**.
4. Aparece el mensaje: *"Encuesta completada. ¡Gracias por tu retroalimentación!"*

---

### 7.5 Pantalla post-inducción (al completar los 10 módulos)

Cuando terminas **todos** los módulos de empresa, la interfaz cambia a la vista de **finalización** con:

#### Sección: Solicita tu recorrido y sistemas

> **Nota:** El **recorrido en planta** también se registra en los **Recordatorios importantes** (sección 6.7). Al marcarlo ahí, RH recibe la notificación. Los botones de esta sección sirven además para solicitar **sistemas** y como referencia del estado de las solicitudes.

| Botón | Qué hace | Estados posibles |
|-------|----------|------------------|
| **Recorrido en planta** | Envía notificación a RH para coordinar visita física (si no se generó ya al marcar el recordatorio) | Pendiente → Atendida |
| **Sistemas** | Envía notificación a RH para coordinar acceso a sistemas informáticos | Pendiente → Atendida |

- Solo puedes solicitar cada paso **una vez**.
- Tras enviar, el botón muestra *"Solicitud enviada"* y queda deshabilitado.
- Cuando RH atiende la solicitud, cambia a *"Atendida"*.

#### Sección: Mis dudas enviadas

Lista expandible de todas las preguntas que enviaste durante la inducción, con sus respuestas de RH (si ya fueron contestadas).

---

## 8. Inducción al puesto (checklist)

### 8.1 ¿Quién puede acceder?

Solo empleados del programa **Administrativo** con la opción **"Habilitar Inducción al puesto"** activada por RH.

Los empleados **operativos** no ven esta ruta.

### 8.2 Las 13 actividades del checklist

| # | Actividad |
|---|-----------|
| 1 | Presentación con el equipo de trabajo |
| 2 | Designación de Mentor |
| 3 | Entrega de herramientas de trabajo |
| 4 | Explicación de descripción de puesto |
| 5 | Explicación y revisión de cada una de las carpetas o materiales |
| 6 | Sistegramas y Procedimientos del Puesto |
| 7 | Indicadores de Gestión |
| 8 | Programas de trabajo, metas y objetivos periódicos |
| 9 | Relaciones cliente-proveedor internas y externas |
| 10 | Gestión de entrevistas con clientes-proveedores internos y externos |
| 11 | Introducción general a su puesto |
| 12 | Definir programa de Trabajo Inicial |
| 13 | Evaluación de seguimiento |

> A diferencia de los módulos de empresa, **no hay orden obligatorio**: puedes marcar las actividades en el orden que las completes con tu mentor o encargado.

---

### 8.3 Cómo usar el checklist (paso a paso)

#### Marcar actividades

1. Cada actividad tiene un **checkbox circular** a la izquierda.
2. Pulsa el checkbox cuando hayas completado esa actividad con tu mentor/encargado.
3. El checkbox se marca con ✓ y la fila cambia de estilo.
4. Puedes **desmarcar** una actividad pulsando de nuevo el checkbox (por si te equivocaste).

#### Campos de notas

Debajo del checklist hay dos áreas de texto:

| Campo | Para qué sirve | Cuándo se guarda |
|-------|----------------|------------------|
| **Comentarios** | Anotar observaciones, acuerdos o pendientes de tu integración | Al salir del campo (perder foco) |
| **Temas del puesto** | Listar manuales, carpetas, procedimientos o temas adicionales de tu puesto | Al salir del campo (perder foco) |

Al guardar aparece brevemente: *"Cambios guardados"*.

#### Finalizar inducción al puesto

1. Debes tener **las 13 actividades del checklist marcadas**.
2. Debes tener **los 2 recordatorios importantes** marcados (sección 6.7).
3. Si falta algún recordatorio, verás el mensaje: *"Completa los recordatorios importantes para finalizar la inducción."*
4. Cuando todo está completo, aparece el botón **Finalizar inducción**.
5. Al pulsarlo, el sistema envía una **notificación a Recursos Humanos** indicando que terminaste.
6. Mensaje de confirmación: *"RH fue notificado"* / *"Inducción finalizada. RH fue notificado."*
7. El botón desaparece y no puedes enviar la notificación de nuevo.

---

## 9. Exámenes y evaluaciones

### 9.1 Diferencia entre examen y encuesta

| | Examen (módulos 1–9) | Encuesta (módulo 10) |
|---|---------------------|----------------------|
| Tipo de respuesta | Opción múltiple (una correcta) | Texto libre |
| Calificación | Sí (porcentaje) | No |
| Intentos limitados | Sí (3 por defecto) | Una sola vez |
| Aprueba con | ≥ 70% | Solo completar todas las preguntas |

### 9.2 Modal de examen — elementos

| Elemento | Descripción |
|----------|-------------|
| **Título del examen** | Nombre del examen vinculado al módulo |
| **Descripción + mínimo** | Ej. *"Evaluación módulo 4 · Mínimo: 70%"* |
| **Preguntas numeradas** | Cada pregunta con opciones tipo radio (solo una respuesta) |
| **Cancelar** | Cierra el modal sin enviar (puedes volver después) |
| **Enviar examen** | Califica y muestra resultado |

### 9.3 Resultado del examen

Tras enviar, aparece un cuadro de alerta con:

- **Aprobado:** calificación ≥ 70%. El módulo queda completado.
- **No aprobado:** calificación < 70%. Indica intentos restantes.
- **Intentos agotados:** mensaje para contactar a RH.

---

## 10. Dudas, contacto y notificaciones

### 10.1 Enviar una duda durante un módulo

1. Mientras ves un módulo, pulsa **¿Tienes dudas?** (parte inferior del visor).
2. Se abre un modal con el nombre del módulo activo.
3. Escribe tu pregunta en el campo de texto.
4. Pulsa **Enviar**.
5. La duda queda registrada y RH la ve en su panel de **Dudas**.

### 10.2 Ver tus dudas y respuestas

En la sección **Mis dudas enviadas** (visible durante y después de la inducción):

| Estado | Significado |
|--------|-------------|
| **Pendiente** (badge amarillo) | RH aún no ha respondido |
| **Respondida** (badge verde) | RH ya escribió una respuesta |

Pulsa una duda para expandirla y leer la respuesta de RH.

### 10.3 Sección de contacto

Al final de la página de inducción, sección **¿Necesitas ayuda?** con tres tarjetas:

| Área | Contacto |
|------|----------|
| **Nómina, vacaciones, contrataciones** | dbajonero@lavin.com.mx · Tel. +52 (777) 333-03-00 Ext. 221 y 112 |
| **Capacitación y Sistegrama** | ljuarez@lavin.com.mx · Tel. +52 (777) 333-03-00 Ext. 117 |
| **Administración de personal** | sperez@lavin.com.mx · ycalderon@lavin.com.mx · Tel. +52 (777) 333-03-00 Ext. 281 y 136 |

Los correos y teléfonos son enlaces clicables (abren tu app de correo o marcador telefónico).

### 10.4 Tipos de notificaciones que genera el empleado

| Tipo | Cuándo se genera | Quién la atiende |
|------|------------------|------------------|
| `recorrido_planta` | Al marcar el recordatorio **Recorrido en la planta** o al solicitar recorrido tras completar la inducción empresa | RH |
| `sistemas` | Tras completar inducción empresa, al solicitar acceso a sistemas | RH |
| `recuperar_password` | Al pulsar "¿Olvidaste tu contraseña?" en login | RH |
| `induccion_puesto_completada` | Al pulsar "Finalizar inducción" en checklist de puesto (con recordatorios completos) | RH |

---

## 11. Vista del encargado de área (supervisor)

### 11.1 Acceso

- Nómina y contraseña asignadas por RH (rol **Encargado de área**).
- URL de destino: `/supervisor`
- Si el encargado también es admin, puede acceder al panel de RH.

### 11.2 Pantalla: Progreso de mi equipo

**Encabezado:**
- Título: *Progreso de mi equipo*
- Subtítulo con el **nombre de tu área** asignada.

**Tarjetas de resumen:**

| Tarjeta | Qué muestra |
|---------|-------------|
| **Empleados** | Total de empleados en tu área |
| **Con al menos 1 módulo** | Cuántos ya iniciaron la inducción |
| **Sin iniciar (0 módulos)** | Cuántos no han empezado (resaltado en amarillo) |

**Tabla de empleados:**

| Columna | Descripción |
|---------|-------------|
| Nómina | Número de empleado |
| Nombre | Nombre completo |
| Programa | Operativo o Administrativo |
| Área | Departamento |
| Módulos | Avance numérico (ej. `7 / 10`) |
| Estado | **Completo** (verde), **En curso** o **Pendiente** (amarillo) |

**Botón Exportar CSV:**
- Descarga un archivo `progreso-empleados.csv` con los datos de la tabla.
- Útil para reportes internos o seguimiento en Excel.

> El supervisor **solo** ve empleados de **su área**. No puede editar usuarios ni contenido.

---

## 12. Panel de Recursos Humanos (administrador)

### 12.1 Acceso y navegación

- Nómina: `ADMIN001` (o la que RH haya configurado).
- URL de destino: `/admin/dashboard`
- **Menú lateral izquierdo** con todas las secciones.

| Sección del menú | Ruta | Función principal |
|------------------|------|-------------------|
| **Dashboard** | `/admin/dashboard` | Métricas y gráficas del programa |
| **Usuarios** | `/admin/usuarios` | Crear, editar y desactivar cuentas |
| **Progreso** | `/admin/progreso` | Ver avance y descargar hojas de evidencia PDF (empresa y puesto) |
| **Módulos** | `/admin/modulos` | Editar módulos, ítems y exámenes |
| **Checklist puesto** | `/admin/checklist-puesto` | Gestionar actividades de inducción al puesto |
| **Áreas** | `/admin/areas` | Catálogo de departamentos |
| **Dudas** | `/admin/dudas` | Responder preguntas de empleados |
| **Notificaciones** | `/admin/notificaciones` | Atender solicitudes (recorrido, sistemas, contraseñas) |
| **Encuesta** | `/admin/encuesta` | Ver respuestas de satisfacción |
| **Videos** | `/admin/videos` | Subir y vincular videos a módulos |

**Badges en el menú:**
- **Dudas** y **Notificaciones** muestran un contador rojo con pendientes.
- Se actualiza automáticamente cada 45 segundos.

**Cerrar sesión:** Menú del usuario (esquina inferior del sidebar) → **Cerrar sesión**.

---

### 12.2 Dashboard (Overview)

**Pestañas de filtro:**

| Pestaña | Qué muestra |
|---------|-------------|
| **General** | Todos los empleados |
| **Operativos** | Solo programa operativo |
| **Administrativos** | Solo programa administrativo |

**Tarjetas KPI (indicadores):**

- Total de empleados
- Inducciones completadas
- En curso
- Sin iniciar
- Dudas pendientes
- Encuestas respondidas
- Notificaciones pendientes

**Gráficas:**

| Gráfica | Información |
|---------|-------------|
| **Estado global** (dona) | Distribución: completados / en curso / sin iniciar |
| **Inducción completada** (gauge) | Porcentaje global con desglose operativo vs administrativo |
| **Comparativa por programa** | Barras operativo vs administrativo |
| **Progreso por área** | Barras horizontales por departamento |
| **Progreso por módulo** | Cuántos empleados completaron cada módulo |
| **Radar de módulos** | Vista alternativa del avance por módulo |

---

### 12.3 Usuarios

**Barra de herramientas:**

| Elemento | Función |
|----------|---------|
| **Buscar** | Filtra por nombre o nómina en tiempo real |
| **Filtros por rol** | Todos / Colaborador / RH |
| **+ Nuevo usuario** | Abre formulario de creación |

**Tabla de usuarios:**

| Columna | Descripción |
|---------|-------------|
| Nómina | Identificador único |
| Nombre | Nombre completo |
| Tipo | Colaborador o RH |
| Programa | Operativo, Administrativo, Ayudante general o — |
| Área | Departamento asignado |
| Estado | Activo / Inactivo |
| Acciones | Editar, restablecer contraseña, eliminar, activar/desactivar |

**Acciones por usuario:**

| Botón | Qué hace |
|-------|----------|
| ✏️ **Editar** | Modifica datos del usuario |
| 🔑 **Restablecer contraseña** | (Solo colaboradores) Borra la contraseña para que cree una nueva en el próximo acceso |
| 🗑️ **Eliminar** | Elimina permanentemente al colaborador y todo su progreso (acción irreversible) |
| 🚫 **Deshabilitar** | Desactiva la cuenta; no podrá iniciar sesión |
| ✅ **Habilitar** | Reactiva una cuenta desactivada |

**Formulario nuevo/editar usuario:**

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| **Nombre** | Sí | Nombre completo del colaborador |
| **Nómina** | Sí | Número único. **No editable** al editar un usuario existente |
| **Email** | No | Correo de contacto |
| **Tipo de cuenta** | Sí | **Colaborador** o **RH (Administrador)** |
| **Programa** | Solo colaboradores | Operativo, Administrativo o Ayudante general |
| **Área** | No | Select del catálogo de áreas activas |
| **Habilitar Inducción a la empresa** | Checkbox | Si está marcado, el colaborador puede ver los 10 módulos |
| **Habilitar Inducción al puesto** | Checkbox | Solo visible si programa = Administrativo |

> **Flujo típico para dar de alta a un colaborador nuevo:**
> 1. Crear usuario con su nómina y nombre.
> 2. Asignar programa (Operativo, Administrativo o Ayudante general) y área.
> 3. Marcar **Habilitar Inducción a la empresa** (y puesto si aplica).
> 4. El colaborador ingresa con su nómina y crea su contraseña en el primer acceso.

---

### 12.4 Progreso

Permite ver el **avance detallado** de cada colaborador y generar las **hojas de evidencia** en PDF.

**Funciones principales:**

| Función | Descripción |
|---------|-------------|
| **Listado de colaboradores** | Tabla con búsqueda y filtros (completo, en curso, sin iniciar) |
| **Ver reporte** (👁) | Abre modal con vista previa de la evidencia; pestañas **Empresa** y **Puesto** |
| **Descargar evidencia empresa** (📥) | PDF de inducción a la empresa (solo si está completa) |
| **Descargar evidencia puesto** (📋) | PDF de inducción al puesto; siempre visible, deshabilitado si no aplica o está incompleta |
| **Exportar CSV** | Descarga resumen de progreso de todos los colaboradores |

**Requisitos para descargar cada PDF:**

| Hoja | Requisitos |
|------|------------|
| **Evidencia empresa** | 10 módulos completados **+** 2 recordatorios importantes |
| **Evidencia puesto** | 13 ítems del checklist completados **+** 2 recordatorios importantes |

Si falta algo, el botón aparece **deshabilitado** con un mensaje al pasar el cursor (ej. *"Faltan recordatorios importantes"*, *"Módulos de empresa incompletos"*, *"Inducción al puesto no habilitada"*).

**Las dos hojas de evidencia PDF incluyen:**

**Hoja de evidencia de inducción a la empresa:**
- Datos del colaborador (nombre, nómina, programa, área, fecha de emisión).
- Resumen: inducción empresa, inducción puesto, evaluación final, promedio de exámenes.
- Tabla de los **10 módulos** con estado, fecha y calificación.
- Tabla de **recordatorios importantes** (2 ítems).
- Evaluación final y resumen de exámenes.
- **Firmas de conformidad** (5 espacios: Nombre, Fecha, Firma, Área).
- Referencia: Ref. P-GP-12 F-GP-56 Rev. 3.

**Hoja de evidencia de inducción al puesto:**
- Datos del colaborador y resumen de avance.
- Tabla del **checklist de puesto** (13 ítems, presentados en dos bloques).
- Tabla de **recordatorios importantes** (los mismos 2 ítems, mismo estado que en empresa).
- **Firmas de conformidad** (3 espacios).
- Referencia: Ref. P-GP-12 F-GP-56 Rev. 3.

> Los recordatorios se marcan **una sola vez** por colaborador; el mismo estado y fecha aparecen en ambas hojas.

---

### 12.5 Módulos

Gestiona el contenido de la **inducción a la empresa**.

**Lista de módulos:**
- Muestra los 10 módulos con nombre, slug, orden, programa y estado activo/inactivo.
- Permite crear, editar y desactivar módulos.

**Formulario de módulo:**

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Título visible para el empleado |
| **Slug** | Identificador técnico único (no editable después de crear) |
| **Descripción** | Texto que aparece al abrir el módulo |
| **Programa** | A quién aplica: ambos / administrativo / operativo |
| **Orden** | Posición en la lista (1–10) |
| **Activo** | Si está desactivado, los empleados no lo ven |

**Ítems del módulo:**
Cada módulo puede tener ítems internos (pasos, recursos, videos vinculados).

| Campo del ítem | Descripción |
|----------------|-------------|
| **Tipo** | paso / recurso |
| **Título** | Nombre del ítem |
| **Descripción** | Texto explicativo |
| **URL de video** | Enlace al video subido |
| **URL de archivo** | PDF u otro recurso descargable |

**Exámenes (desde Módulos):**
- Cada módulo (excepto encuesta) puede tener un examen asociado.
- Desde aquí se editan preguntas, opciones, calificación mínima e intentos permitidos.

---

### 12.6 Checklist puesto

Administra las **13 actividades** de inducción al puesto.

| Campo | Descripción |
|-------|-------------|
| **Título** | Nombre de la actividad |
| **Orden** | Posición en el checklist (1–13) |
| **Activa** | Si está inactiva, los empleados no la ven |

Puedes agregar, editar, reordenar o desactivar actividades.

---

### 12.7 Áreas

Catálogo de **departamentos** de la empresa.

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Único en el sistema (ej. Producción, Calidad, RH) |
| **Activa** | Solo las áreas activas aparecen al asignar usuarios |

**Áreas de ejemplo** (creadas en instalación inicial):
Producción, Calidad, Recursos Humanos, Mantenimiento, Almacén, Administración.

---

### 12.8 Dudas

Lista todas las preguntas enviadas por empleados durante su inducción.

**Información por duda:**

| Dato | Descripción |
|------|-------------|
| Empleado | Nombre y nómina |
| Módulo | En qué módulo se formuló la duda |
| Pregunta | Texto enviado por el empleado |
| Estado | Pendiente / Respondida |
| Fecha | Cuándo se envió |

**Responder una duda:**

1. Pulsa la duda pendiente.
2. Escribe la **respuesta** en el campo de texto.
3. Guarda.
4. El empleado verá la respuesta en su sección **Mis dudas enviadas**.

---

### 12.9 Notificaciones

Centraliza las **solicitudes** que los empleados generan.

| Tipo | Origen | Acción de RH |
|------|--------|--------------|
| **Recorrido en planta** | Post-inducción empresa | Coordinar visita y marcar como atendida |
| **Sistemas** | Post-inducción empresa | Dar acceso a sistemas y marcar como atendida |
| **Recuperar contraseña** | Login del empleado | Restablecer contraseña desde Usuarios y marcar atendida |
| **Inducción puesto completada** | Checklist finalizado | Confirmar cierre y marcar atendida |

**Estados:** Pendiente → Atendida

**Atender notificación:**
1. Revisa el detalle (empleado, fecha, tipo).
2. Realiza la acción correspondiente fuera del sistema (coordinar recorrido, resetear contraseña, etc.).
3. Pulsa **Atender** para cerrar la solicitud.

---

### 12.10 Encuesta

Muestra las **respuestas de satisfacción** del módulo 10.

**Funciones:**
- Ver listado de empleados que respondieron.
- Leer cada respuesta por pregunta.
- Editar las **preguntas de la encuesta** (texto y orden) si se requiere actualizar el cuestionario.

**Preguntas actuales:**
1. ¿La información proporcionada fue clara y comprensible?
2. ¿El contenido del programa fue relevante para tu trabajo?
3. ¿Te sientes preparado(a) para desempeñar tus funciones?
4. ¿Cómo calificarías la organización general del programa de inducción?
5. ¿Tienes algún comentario o sugerencia para mejorar el programa?

---

### 12.11 Videos

Subida y gestión de **archivos de video** para los módulos.

**Wizard de subida (3 pasos):**

| Paso | Qué haces |
|------|-----------|
| **1. Archivo** | Seleccionas el video desde tu computadora |
| **2. Detalles** | Título, descripción (máx. 500 caracteres), módulo opcional |
| **3. Confirmar** | Revisas y confirmas la subida |

**Requisitos del archivo:**

| Parámetro | Valor |
|-----------|-------|
| Formatos permitidos | MP4, WebM, MOV |
| Tamaño máximo | 2 GB (2000 MB) |
| Campo del formulario | `archivo` (multipart) |

**Lista de videos:**
- Ver videos subidos con título, módulo vinculado, tamaño y fecha.
- Editar metadatos o eliminar videos.
- Los videos se sirven con **streaming** (soporta avance en la barra sin descargar todo el archivo).

> Si la sesión expira durante una subida larga, deberás cerrar sesión, volver a entrar y reintentar.

---

## 13. Preguntas frecuentes y solución de problemas

### Para empleados

| Problema | Causa probable | Qué hacer |
|----------|----------------|-----------|
| "Inducción no disponible" | RH no habilitó tu acceso | Contactar a Recursos Humanos |
| No puedo abrir un módulo (candado) | No completaste el módulo anterior | Termina el módulo previo primero |
| El video no carga | Video aún no subido o error de red | Verificar conexión WiFi; contactar RH |
| Repruebo el examen | Calificación < 70% | Reintentar (tienes hasta 3 intentos) |
| "Intentos agotados" en examen | Usaste los 3 intentos | Pedir a RH que habilite más intentos |
| Olvidé mi contraseña | — | Usar "¿Olvidaste tu contraseña?" y esperar respuesta de RH |
| La sesión se cerró sola | Token expirado (8 h) o cerraste el navegador | Volver a iniciar sesión |
| No veo "Inducción al puesto" | Eres operativo o no está habilitada | Solo administrativos con acceso habilitado por RH |
| No puedo descargar evidencia PDF | Faltan módulos, checklist de puesto o recordatorios | Completar todo lo requerido; revisar tooltips en Progreso (RH) |
| Marqué recorrido pero RH no fue notificado | Ya existía una solicitud previa | Revisar en Notificaciones; el recordatorio igual cuenta para evidencia |

### Para Recursos Humanos

| Problema | Qué hacer |
|----------|-----------|
| Empleado no puede entrar | Verificar que esté **Activo** y tenga inducción habilitada |
| Restablecer contraseña | Usuarios → 🔑 Restablecer contraseña → colaborador crea nueva en primer acceso |
| Botón PDF deshabilitado en Progreso | Verificar módulos/checklist **y** los 2 recordatorios importantes |
| Eliminar colaborador | Usuarios → 🗑️ Eliminar (borra progreso permanentemente) |
| Video no se reproduce | Verificar que el video esté subido y vinculado al módulo correcto |
| Subida de video falla (413) | El archivo supera 2 GB; comprimir o dividir |
| Subida falla (415) | Formato no permitido; usar MP4, WebM o MOV |
| Contador de dudas no actualiza | Esperar 45 s o recargar la página |

### Para el equipo de TI

| Problema | Qué hacer |
|----------|-----------|
| La app no arranca | Verificar PostgreSQL activo, `.env` configurado, `npm start` |
| Error de base de datos | Revisar `DATABASE_URL` en `.env` |
| Pantalla en blanco | Ejecutar `npm run build:client` antes de `npm start` |
| No acceden desde otros dispositivos | Verificar IP del servidor y firewall del puerto 3500 |

---

## 14. Anexo técnico para el equipo de TI

### 14.1 Comandos principales

```bash
# Desarrollo (API + Vue en un solo puerto)
npm run dev
# → http://localhost:3500

# Solo API
npm run dev:server

# Solo frontend Vue
npm run dev:client

# Producción
npm run build:client
npm start

# Base de datos
npm run migrate          # Aplicar migraciones
npm run prisma:generate  # Regenerar cliente Prisma
npm run seed             # Datos iniciales (admin, módulos, áreas)

# Respaldo
npm run backup
```

### 14.2 Instalación automatizada

```bash
chmod +x scripts/setup.sh scripts/backup.sh
./scripts/setup.sh
```

El script configura PostgreSQL, `.env`, dependencias, migraciones, seed y PM2.

### 14.3 Variables de entorno (`.env`)

| Variable | Obligatoria | Default | Descripción |
|----------|-------------|---------|-------------|
| `DATABASE_URL` | Sí | — | `postgresql://lavin_user:lavin_pass@localhost:5432/induccion_db` |
| `JWT_SECRET` | Sí | — | Cadena aleatoria larga para firmar tokens |
| `JWT_EXPIRES_IN` | No | `8h` | Expiración de sesión |
| `PORT` | No | `3500` | Puerto del servidor |
| `NODE_ENV` | No | — | `development` o `production` |
| `UPLOAD_DIR` | No | `./uploads` | Carpeta de videos subidos |
| `MAX_FILE_SIZE_MB` | No | `2000` | Límite de subida de video |
| `BACKUP_DIR` | No | `./backups` | Carpeta de respaldos SQL |

### 14.4 PM2 (producción)

```bash
pm2 start ecosystem.config.js
pm2 status
pm2 logs induccion-rrhh
pm2 restart induccion-rrhh
```

### 14.5 Estructura de carpetas relevante

```
lavin-app/
├── client/              → Frontend Vue 3 (código fuente)
├── public/dist/         → Build de producción del frontend
├── src/                 → Backend Express (API, controladores, middleware)
├── prisma/schema.prisma → Esquema de base de datos
├── scripts/             → setup.sh, seed.js, backup.sh, datos de módulos
├── uploads/videos/      → Videos subidos por RH
└── backups/             → Respaldos de PostgreSQL
```

### 14.6 Roles en base de datos

| Valor `rol` | Descripción |
|-------------|-------------|
| `empleado` | Colaborador en inducción |
| `supervisor` | Encargado de área |
| `admin` | Recursos Humanos |

### 14.7 Seguridad

- Contraseñas almacenadas con **bcrypt** (hash irreversible).
- API protegida con **JWT** en header `Authorization: Bearer <token>`.
- Videos requieren token válido (header o query `?token=`).
- Sesión del navegador en `sessionStorage` (se borra al cerrar pestaña).

### 14.8 Respaldo de base de datos

```bash
npm run backup
# o manualmente:
bash scripts/backup.sh
```

Los dumps se guardan en `backups/` comprimidos con fecha.

---

## Glosario

| Término | Significado |
|---------|-------------|
| **Nómina** | Número de empleado; es tu usuario de acceso |
| **Módulo** | Unidad de contenido de la inducción a la empresa (hay 10) |
| **Alcance** | Tipo de inducción: `empresa` o `puesto` |
| **Checklist** | Lista de actividades de inducción al puesto (13 ítems) |
| **Recordatorios importantes** | 2 actividades obligatorias compartidas (recorrido en planta y código de conducta) |
| **Slug** | Identificador técnico único de un módulo (no visible para empleados) |
| **JWT** | Token de sesión que mantiene tu login activo |
| **On-premise** | Software instalado en servidores de la empresa, no en la nube |
| **CSV** | Archivo de valores separados por comas, abrible en Excel |
| **PDF evidencia empresa** | Constancia de inducción a la empresa (10 módulos + recordatorios) |
| **PDF evidencia puesto** | Constancia de inducción al puesto (13 ítems + recordatorios) |
| **Firmas de conformidad** | Tabla al pie de cada hoja de evidencia para firmas de responsables |
| **Programa operativo** | Colaboradores de planta/producción |
| **Programa administrativo** | Colaboradores de oficina/gestión |
| **Programa ayudante general** | Colaboradores del programa Ayudante general (inducción empresa, sin puesto) |

---

## Diagrama de flujo general

```
┌─────────────────────────────────────────────────────────────────┐
│                    ABRIR http://IP:3500                         │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
                    ┌────────────────┐
                    │  Pantalla Login │
                    │  Ingresar nómina│
                    └────────┬───────┘
                             ▼
              ┌──────────────────────────────┐
              │ ¿Primera vez / sin contraseña?│
              └──────┬───────────────┬───────┘
                     │ Sí            │ No
                     ▼               ▼
            ┌──────────────┐  ┌──────────────┐
            │ Crear        │  │ Ingresar     │
            │ contraseña   │  │ contraseña   │
            └──────┬───────┘  └──────┬───────┘
                   └────────┬────────┘
                            ▼
              ┌─────────────────────────────┐
              │         ¿Qué rol?           │
              └──┬──────────┬──────────┬──────┘
                 │          │          │
           admin │  super.  │  empleado│
                 ▼          ▼          ▼
          ┌──────────┐ ┌────────┐ ┌──────────────────┐
          │ Panel RH │ │ Mi     │ │ ¿Acceso          │
          │ Dashboard│ │ equipo │ │ habilitado?      │
          └──────────┘ └────────┘ └──┬──────────┬────┘
                                     │ No       │ Sí
                                     ▼          ▼
                              ┌──────────┐ ┌─────────────────┐
                              │ Contactar│ │ Inducción       │
                              │ a RH     │ │ empresa / puesto│
                              └──────────┘ └────────┬────────┘
                                                  ▼
                                    ┌─────────────────────────┐
                                    │ Videos → Exámenes →     │
                                    │ Encuesta                │
                                    └────────┬────────────────┘
                                             ▼
                                    ┌─────────────────────────┐
                                    │ Recordatorios           │
                                    │ importantes (2 ítems)   │
                                    └────────┬────────────────┘
                                             ▼
                                    ┌─────────────────────────┐
                                    │ Solicitar sistemas /    │
                                    │ Descargar evidencia PDF │
                                    └─────────────────────────┘
```

---

*Manual generado para la Plataforma de Inducción RR.HH. — Industrias Lavín. Uso interno.*

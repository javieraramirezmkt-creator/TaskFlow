# TaskFlow
App para gestionar y optimizar tareas (To-Do-List) diseñada con una estética cálida y acogedora. El proyecto aplica conceptos avanzados de JavaScript moderno, Programación Orientada a Objetos y consumo de APIs, envueltos en una interfaz femenina inspirada en los colores del otoño.

Experiencia de Usuario
- Bitácora Dinámica: Gestión completa de notas (creación, edición y borrado) con una interfaz fluida.
- Ciclos de Vida: Transición de estados entre Pendiente y Completada con retroalimentación visual inmediata.
- Memoria Persistente: Implementación de localStorage para que tus pensamientos nunca se pierdan al cerrar el navegador.
- Inspiración Externa: Módulo de sincronización asíncrona que recupera ideas desde una API externa (JSONPlaceholder).

Flujo Interactivo:
- Búsqueda Inteligente: Filtrado por texto en tiempo real mediante eventos keyup.
- Foco Sensorial: Resaltado de elementos mediante mouseover para una navegación más orgánica.
- Validación de Datos: Sistema de prevención de errores y feedback mediante Toasts y textos de ayuda.
- Gestión del Tiempo: Cronómetros activos mediante intervalos que calculan el tiempo restante de tus compromisos.

Arquitectura Técnica
El core de la aplicación ha sido construido bajo estándares modernos de desarrollo:
- Estructura POO: Organización del código basada en clases (Nota y Diario), garantizando escalabilidad y un código limpio (Clean Code).
- Motor Asíncrono: Manejo avanzado de promesas y Async/Await para la comunicación con servicios externos.
- Simulación de Latencia: Uso controlado de setTimeout para replicar el comportamiento de servidores reales y gestionar estados de carga.
- Diseño Atómico: Interfaz construida íntegramente con JavaScript Vanilla (manipulación directa del DOM) y CSS3 puro, utilizando variables para una paleta de colores coherente:

Colores: 
- Terracota (#B05B3B) para el vigor de las acciones.
- Crema (#FDF6EC) para la serenidad del entorno.

Organización del Ecosistema

taskflow/
 ├── index.html   # Estructura semántica y accesibilidad.
 ├── style.css    # Identidad visual otoñal y diseño adaptativo.
 └── app.js       # Cerebro lógico y controladores de estado.

Se recomienda el uso de Live Server para validar correctamente

Filosofía de Desarrollo
A diferencia de los gestores de tareas convencionales, TaskFlow separa la Entidad (la información bruta) del Controlador (la lógica de guardado). Cada acción de la interfaz está centralizada en un único punto de renderizado, asegurando que lo que ves en pantalla sea siempre una copia exacta del estado interno de tus datos.

Creado por:
Javiera

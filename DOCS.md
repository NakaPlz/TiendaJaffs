# Documentación Técnica e Infraestructura AI

Este archivo sirve como índice inicial de la estructura del proyecto y como guía para el trabajo colaborativo con los agentes de IA que escribirán el código en adelante.

## Estructura de Directorios
- `/src`: Código fuente principal de la aplicación, vistas y estilos.
- `/public`: Archivos estáticos accesibles al público general, como logos o favicons de Jaff's Lomos.
- `/docs`: Documentación interna o especificaciones técnicas del proyecto.

---

## Integraciones: Servidores MCP (Model Context Protocol) Sugeridos

Para poder desarrollar este proyecto eficazmente, es ideal que el agente en la siguiente sesión utilice los siguientes **Servidores MCP**:

1. **GitHub MCP Server:**
   - **Por qué:** Como los cambios se desplegarán mediante Github a Easypanel, este servidor permite clonar, crear ramas, abrir PRs y hacer commits de forma automatizada y ordenada directamente gestionado por el agente.

2. **Browser / Puppeteer / Playwright MCP Server:**
   - **Por qué:** Permite que el agente abra la página web local y vea el resultado renderizado en un navegador. Al ser un menú gastronómico, el componente estético es vital, y esta herramienta permite al autor verificar su propio diseño UI/UX.

3. *(Opcional)* **Database / PostgreSQL MCP Server:**
   - **Por qué:** Si deciden que el menú dejará de ser estático y pasará a conectarse a una base de datos para cargar platos de forma dinámica o guardar pedidos, un servidor de bases de datos aceleraría la creación de esquemas.

## Agent Skills Sugeridos

Para ayudar al próximo agente con el diseño y código, recomendamos activar o proveer las siguientes habilidades:
- **Desarrollo Frontend / UI Design:** Habilidades centradas en la creación de interfaces de usuario bellas (con Tailwind o CSS modular) y dinámicas (micro-animaciones), crucial para impactar con la app de venta de comidas.
- **Docker / Infraestructura Básica:** Habilidades de estandarización de contenedores para resolver fricciones rápidas en el build pipeline hacia Easypanel.

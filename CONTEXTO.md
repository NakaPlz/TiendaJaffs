# Contexto del Proyecto: Jaff's Lomos

## Negocio
El proyecto es una página web y menú digital para **Jaff's Lomos**, un negocio gastronómico. Funcionará como una carta virtual donde los clientes podrán hacer pedidos al local, tanto con delivery como con retiro en el local (Take Away).

## Manejo de Pedidos
- Los pedidos serán enviados al número de WhatsApp de Jaff's Lomos mediante un mensaje predefinido.
- El mensaje se genera cuando el cliente completa sus datos en el formulario de finalización de compra.
- Datos requeridos del cliente:
  1. Nombre y Apellido
  2. Modalidad (Delivery o Retiro en local)
  3. (Si es Delivery) Dirección de entrega, entre calles, observaciones/referencias.
  4. Método de pago (Efectivo o Transferencia únicamente).

### Formato del Mensaje de WhatsApp
```text
Hola! Soy *{Nombre y Apellido}*. Quiero hacer un pedido para *{Delivery o Take Away}*

(Si selecciona Delivery, se agregan los datos de envío, con el siguiente formato:)
Entregar en *{Direccion de entrega}*
Entre calles *{Entre calles}*
Observaciones: *{Observaciones / Referencias}*

Mi pedido:
- {Cantidad} x {Item del catalogo} ({Precio del item, multiplicado por la cantidad})
- {Cantidad} x {Item del catalogo} ({Precio del item, multiplicado por la cantidad})
- Etc...

Subtotal del pedido: {Precio de cada item sumado en el pedido}
Costo envio: (solo si es con delivery) {Variable de envio definida en pantalla de admin}
*Total pedido: {Suma de subtotal y costo de envio}*

Forma de pago: *{TRANSFERENCIA o EFECTIVO}*

Pedido: {Numero de orden}
Muchas gracias!!
```
*(Los asteriscos aplican formato en negrita en WhatsApp).*
Cada pedido será guardado en la base de datos para reportes y gestión.

## Carta y Manejo de Productos
- La página inicial será un menú dividido en categorías (comidas, extras, etc.).
- Cada botón de categoría puede tener una imagen personalizable por el admin.
- Dentro de cada categoría se listan los ítems. Al seleccionar uno, se ve su descripción y se pueden agregar unidades al carrito.
- El carrito (esquina superior derecha) permite sumar unidades y agregar comentarios a los ítems (ej. "sin cebolla").
- Todas las categorías, ítems y la organización de la web son 100% configurables desde el panel de admin (ordenar categorías/ítems, editar precios, características y opciones).
- Las imágenes de los ítems no son obligatorias para su creación.

## Panel de Administración (Admin)
- Roles: **Empleados** y **Administrador** (el admin tiene permisos críticos como eliminar órdenes).
- Control total de la organización de la carta visual y de sus artículos.
- Gestión de Órdenes: Permite agregar órdenes presenciales al sistema y eliminar órdenes canceladas.
- Reportes:
  - Cierre de caja manual (registra la facturación al finalizar la jornada, ya que no cierra a las 00:00hs).
  - Estadísticas de negocio (cantidad de órdenes diarias/mensuales).
  - "Productos estrella": Lista ordenada histórica y periódica de los ítems más vendidos, mostrando la "posición" de todos los productos del catálogo.

## Infraestructura, Estructura y Despliegue
- Entorno de desarrollo inicial: Localhost hasta estabilizar funcionalidades.
- La estructura del código separará lógicamente Frontend, Backend y Admin.
- Base de Datos: PostgreSQL.
- Hospedaje: Servidor privado virtual (VPS) gestionado con Easypanel.
- Despliegue: Dockerfiles para contenerizar la app, mediante push hacia GitHub conectado a Easypanel.

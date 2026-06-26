# TechLab - Interfaz Cliente (Frontend-Tester)

Este repositorio contiene la capa de presentación de forma totalmente independiente y desacoplada para el ecosistema **TechLab e-Commerce**, desarrollado en el marco del curso **Java Back-End de Talento-Tech**.

La aplicación funciona como una SPA (Single Page Application) estática que consume de forma asíncrona los servicios web expuestos por la API de Spring Boot.

## Tecnologías Utilizadas

* **HTML5 & CSS3:** Estructuración semántica y estilos nativos.
* **Bootstrap 5:** Framework de diseño para garantizar una interfaz limpia, moderna y completamente responsiva.
* **FontAwesome 6:** Kits de iconos vectoriales para la botonera y navegación.
* **JavaScript Nativo (ES6+):** Lógica del cliente, manejo de estados locales y consumo de API mediante `Fetch`.

## Características Implementadas

* **Catálogo Dinámico:** Renderizado automático de productos consumiendo el endpoint `GET /productos`.
* **Módulo ABM de Productos:**  
    * Formulario interactivo para dar de alta nuevos artículos enviando payloads estructurados en JSON.
    * Actualización de productos ya existentes.
    * Eliminación de productos.
* **Módulo ABM de Categorias de productos:** 
    * Formulario interactivo para dar de alta nuevas categorías enviando payloads estructurados en JSON.
    * Actualización de categorias ya existentes.
    * Eliminacion de categorias.
* **Carrito de Compras con Estado Local:**
  * Gestión de estado dinámico en la memoria del navegador (`CARRITO_LOCAL`).
  * Validación visual contra el stock máximo permitido (`maxStock`) devuelto por el servidor para evitar sobreventas.
  * Cálculo automatizado de subtotales por fila y Total a Pagar formateado en moneda local (`ARS`).
* **Historial de Pedidos:** Sección basada en componentes de Acordeón de Bootstrap que lista las órdenes de compra e impacta los cambios transaccionales (como la baja de pedidos y reversión automática de stock en la Base de Datos).

## Configuración y Conexión con el Backend

Por defecto, la interfaz está configurada para conectarse de forma local con la API de Spring Boot en la siguiente dirección base:

```javascript
const BASE_URL = "http://localhost:8080";
```

> ⚠️ **Nota:** Asegúrese de tener levantado el servidor de Java Spring Boot y la base de datos MySQL activa para que los módulos carguen los datos correctamente.

## Estructura del Repositorio

```text
.
├── index.html       # Estructura visual y componentes de Bootstrap.
└── script.js        # Lógica de consumo de API y manejo de eventos del DOM.     
```

## Proyecto Principal (Backend)
El núcleo de procesamiento, las reglas de negocio, la persistencia con Spring Data JPA y el manejo global de excepciones se encuentran en el repositorio principal:
 **https://github.com/EmanuelEspinosa/Sistema-de-Gestion-TechLab.git**


## Autor

Proyecto realizado por: Emanuel Roberto Espinosa.  
Curso: Java Backend - Talento Tech.  
Año: 2026

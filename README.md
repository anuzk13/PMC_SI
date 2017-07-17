# PMC SI

Sistema Información para indicadores Programa Madre Canguro


# Instalación:
El sistema de informacion para indicadores Programa Madre Canguro (PMCSI) se distribuye como una aplicación portable.

[Manual de Usuario y de instalación](https://github.com/anuzk13/PMC_SI/raw/master/Guia%20Usuario%20e%20Instalaci%C3%B3n%20PMC%20SI.pdf)

## Descargas 
Instalador de Windows:
[Aplicación Portable Windows](https://drive.google.com/open?id=0B-UFYDHdcO3HdkxTRU5wOTJqd2c)

# Contribuir

Esta aplicación hace uso de:

* [NodeWebkit](https://nwjs.io/) - Despliegue como aplicación portable
* [AngularJS](https://angularjs.org/) - Desarrollo aplicación web standalone
* [Bower](https://bower.io/) - Dependencias de JS
* [D3.js](https://d3js.org/) - Visualizaciones interactivas en web
* [Gulp](http://gulpjs.com/) - Build y despliegue del sistema

Para desplegar la aplicación en un servidor de desarrollo (Windows)

```sh
$ cd src
$ npm install
$ node_modules\.bin\bower install 
$ node_modules\.bin\gulp serve
```

# Licencia 

Este programa corresponde a codigo abierto licenciado bajo MIT:
[LICENCIA](https://raw.githubusercontent.com/anuzk13/PMC_SI/master/LICENSE)

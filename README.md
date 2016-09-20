Colector de actividades deportivas.

# Instalación

Se requiere tener instalado nodejs y npm como paquetes del sistema.

El proceso de instalación se realiza ejecutando el comando desde el directorio
principal del programa

```
npm install
```

Se instalaran todos las dependencias

# Funcionamiento

El colector se ejecuta con el siguiente comando:

```
node indes.js [PROVIDER] [IDUSER]
```

siendo *PROVIDER* el nombre del proveedor de datos tal y como está guardado en
la base de datos.

El flujo de trabajo es el siguiente:

1. Se realiza una consulta para obtener el proveedor de datos
2. Se obtienen todos los usuarios, y sus tokens, que se han registrado con ese proveedor
3. Por cada usuario se solicita al proveedor el listado de actividades desde
la última marca de tiempo almacenada.
4. Por cada actividad, se extraen lso datos relevantes y se almacenan junto con el
objeto devuelto por el proveedor de datos por si en el futuro se quiere aprovechar
dicha información

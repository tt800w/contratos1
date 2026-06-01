# 📄 Tags de Contratos - Campuslands

Este documento define los **tags dinámicos** utilizados en la generación automática de contratos de Campuslands. Cada etiqueta (`tag`) será reemplazada automáticamente con la información del camper o representante legal durante el proceso de automatización.

---

# 🏷️ Tags Disponibles para Contratos

| Tag                                     | Descripción                                                                                                                            |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `{NOMBRE DEL REPRESENTANTE LEGAL}`      | Nombre completo de la persona responsable. En caso de que el camper sea menor de edad, corresponde al acudiente o representante legal. |
| `{NOMBRE DEL CAMPER}`                   | Nombre completo del camper que realizará el curso en Campuslands.                                                                      |
| `{NUMERO DE CEDULA}`                    | Número de cédula de la persona responsable o representante legal.                                                                      |
| `{NUMERO DE DOCUMENTO}`                 | Número de documento del camper.                                                                                                        |
| `{DIRECCION FISICA DEL CAMPER}`         | Dirección de residencia del camper que ingresa a Campuslands.                                                                          |
| `{DIA}`                                 | Día en el que se firma el contrato.                                                                                                    |
| `{MES}`                                 | Mes en el que se firma el contrato.                                                                                                    |
| `{ANUAL}`                               | Año en el que se firma el contrato.                                                                                                    |
| `{EMAIL CAMPER}`        | Dirección de correo electrónico del camper.                                                                                            |
| `{EMAIL REPRESENTANTE}` | Dirección de correo electrónico del representante o acudiente.                                                                         |
| `{CELULAR CAMPER}`                      | Número de contacto del camper.                                                                                                         |
| `{CELULAR REPRESENTANTE}`               | Número de contacto del representante o acudiente.                                                                                                      |
| `{VALOR LETRAS}`                        | Valor total de la formación expresado en letras.                                                                                       |
| `{VALOR FORMACION}`                     | Valor total a pagar correspondiente a la formación del camper.                                                                         |
| `{NUMERO DE PAGARE}`                    | Número de pagaré asignado al camper.                                                                                                   |

---

# 📊 Datos Necesarios para el Excel de Registro

El archivo Excel debe contener obligatoriamente los siguientes campos para garantizar la correcta automatización de contratos y registros.

| Campo                                         | Descripción                                                 |
| --------------------------------------------- | ----------------------------------------------------------- |
| Dirección electrónica del estudiante          | Correo electrónico personal del camper.                     |
| Nombre completo del camper                    | Nombre completo del estudiante/camper.                      |
| Tipo de identificación                        | Tipo de documento del camper (CC, TI, CE, Pasaporte, etc.). |
| Número del documento estudiante                          | Documento de identidad del camper.                          |
| Ciudad de expedición del documento del Camper | Ciudad donde fue expedido el documento del camper.          |
| Contacto del Camper                           | Número telefónico del camper.                               |
| Dirección de residencia                       | Dirección física del camper.                                |
| Barrio de Residencia                          | Barrio de residencia del camper.                            |
| Municipio                                     | Municipio o ciudad de residencia.                           |
| Tipo financiación                             | Tipo de financiación seleccionada por el camper.            |
| Nombre del representante completo             | Nombre completo del acudiente o representante legal.        |
| Parentesco                                    | Relación del representante con el camper.                   |
| Número del documento del acudiente            | Documento del representante o acudiente.                    |
| Contacto del acudiente                        | Número telefónico del representante.                        |
| Dirección electrónica del acudiente           | Correo electrónico del acudiente o representante legal.     |

---


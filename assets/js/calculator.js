let fechasSeleccionadas = {};
let totalResumen = {
  totalMonto: 0,
  totalHoras: 0,
  totalHorasFormateado: "00:00",
};

let entradaDefault = document.getElementById("horaEntrada").value;
let salidaDefault = document.getElementById("horaSalida").value;
let descansoDefault = parseInt(document.getElementById("descanso").value) || 0;


document.addEventListener("DOMContentLoaded", () => {
  setCurrentMonthYear();

  document.querySelectorAll("#horaEntrada, #horaSalida, #descanso, #precio_hora, #moneda").forEach((elem) => {
      elem.addEventListener("change", () => {
        actualizarData(fechasSeleccionadas);
        calcularTotal(fechasSeleccionadas);
        actualizarUIData(fechasSeleccionadas);
      });
    });

    //Abrir calendario
    document.getElementById("seleccionarFechas").addEventListener("click", () => {
        // Abrir calendario
        flatpickr("#calendarioContainer", {
        mode: "multiple",
        dateFormat: "Y-m-d",
        enableTime: false,
        defaultDate: Object.keys(fechasSeleccionadas),
        onClose: function (selectedDates) {
            const fechasActualizadas = {};
            selectedDates.forEach((date) => {
            const dateString = date.toISOString().substring(0, 10);
            fechasActualizadas[dateString] = {
                entrada: entradaDefault,
                salida: salidaDefault,
                descanso: descansoDefault,
            };
            });
            fechasSeleccionadas = fechasActualizadas;
            actualizarData(fechasSeleccionadas);
            calcularTotal(fechasSeleccionadas);
            actualizarUIData(fechasSeleccionadas);
        },
        onReady: function (selectedDates, dateStr, instance) {
            instance.calendarContainer.classList.add("flatpickr-calendario");
            const okButton = document.createElement("button");
            okButton.textContent = "OK";
            okButton.className = "border-0 px-3 py-2 rounded-3 w-100";
            okButton.addEventListener("click", () => {
            instance.close();
            });

            instance.calendarContainer.prepend(okButton);
        },
        }).open();
    });

  const btnDescargar = document.getElementById("btnDescargar");
  btnDescargar.addEventListener("click", () =>
    descargarPDF(fechasSeleccionadas)
  );
});


function actualizarUIData(dates) {
    const container = document.getElementById("fechasSeleccionadasContainer");
    container.innerHTML = "";
    Object.keys(dates).forEach((fecha) => {
        let detalles = dates[fecha];
        container.innerHTML += `
                    <tr>
                        <td>${fecha}</td>
                        <td>${detalles.entrada}
                        <td>${detalles.salida}</td>
                        <td>${detalles.descanso} mins</td>
                    </tr>
                `;
    });

    //   Actualizar campos en el form
    const monedaSeleccionada = document.getElementById("moneda").value;
    document.getElementById("monto_total").value = `${totalResumen.totalMonto.toFixed(2)} ${monedaSeleccionada}`;
    document.getElementById("total_horas").value = `${totalResumen.totalHorasFormateado}`;
}

function actualizarData(dates) {
  let entradaModificado = document.getElementById("horaEntrada").value;
  let salidaModificado = document.getElementById("horaSalida").value;
  let descansoModificado = parseInt(
    document.getElementById("descanso").value || 0
  ); // En minutos

  Object.keys(dates).forEach((fecha) => {
    dates[fecha].entrada = entradaModificado;
    dates[fecha].salida = salidaModificado;
    dates[fecha].descanso = descansoModificado;

    // Convertir horas y minutos a objetos dayjs para calcular la diferencia
    let entrada = dayjs(fecha + " " + entradaModificado);
    let salida = dayjs(fecha + " " + salidaModificado);

    let diferenciaHoras = salida.diff(entrada, "hour", true);
    let descansoHoras = descansoModificado / 60;
    let totalHoras = Math.round((diferenciaHoras - descansoHoras) * 100) / 100;
    dates[fecha].totalHoras = totalHoras;
  });
}

function calcularTotal(dates) {
    const pagoPorHora = parseFloat(
        document.getElementById("precio_hora").value || 0
    );

    let totalHorasResumen = 0;
    Object.keys(dates).forEach((fecha) => {
        totalHorasResumen += dates[fecha].totalHoras;
    });

    const totalMontoResumen = totalHorasResumen * pagoPorHora;

    // Convertir fracciones de hora a minutos
    const horas = Math.floor(totalHorasResumen); // Horas completas
    const minutos = Math.round((totalHorasResumen - horas) * 60); // Minutos restantes

    // Formatear a Horas:Minutos
    const totalHorasFormateado = `${horas}:${minutos
        .toString()
        .padStart(2, "0")}`;

    totalResumen = {
        totalMonto: totalMontoResumen,
        totalHoras: totalHorasResumen,
        totalHorasFormateado: totalHorasFormateado, // Redondea a dos decimales para el monto
    };
}

function setCurrentMonthYear() {
  const inputMesActual = document.getElementById("seleccionarFechas");
  const fechaActual = new Date();
  const opciones = { month: "long", year: "numeric" };
  const idiomaNavegador = navigator.language;
  const mesYAnio = new Intl.DateTimeFormat(idiomaNavegador, opciones).format(
    fechaActual
  );
  inputMesActual.value = mesYAnio;
}

function descargarPDF(fechasSeleccionadas) {

    const preferredLanguage = localStorage.getItem('preferredLanguage') || navigator.language.split('-')[0];
    const idiomas = {
        es: {
          user: "Nombre del Usuario",
          date: "Fecha",
          in: "Entrada",
          out: "Salida",
          break: "Descanso",
          resume: "Resumen",
          total_hours: "Horas Totales",
          price_per_hour: "Precio por Hora",
          total_amount: "Monto Total"
        },
        en: {
          user: "User Name",
          date: "Date",
          in: "In",
          out: "Out",
          break: "Break",
          resume: "Resume",
          total_hours: "Total Hours",
          price_per_hour: "Price per Hour",
          total_amount: "Total Amount"
        }
      };
    
    const traducciones = idiomas[preferredLanguage];


  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Definir márgenes
  const marginLeft = 40;
  const marginRight = 40;
  const marginTop = 20;
  const marginBottom = 20;
  const pageWidth = doc.internal.pageSize.getWidth() - marginLeft - marginRight;

  const img = new Image();
  img.src = "./assets/img/logotipo.png";
  img.onload = () => {
    const imgWidthInPdf = 50;
    const imgHeightInPdf = (imgWidthInPdf / 592) * 130;
    const xPosition = marginLeft + pageWidth / 2 - imgWidthInPdf / 2;
    doc.addImage(
      img,
      "PNG",
      xPosition,
      marginTop,
      imgWidthInPdf,
      imgHeightInPdf
    );

    let yPosition = marginTop + imgHeightInPdf + 5;

    // Añade "www.tu-time.com"
    const fontSize = 11;
    doc.setFontSize(fontSize);
    const sitioWeb = "www.tu-time.com";
    const sitioWebWidth = doc.getTextWidth(sitioWeb);
    doc.text(
      sitioWeb,
      marginLeft + pageWidth / 2 - sitioWebWidth / 2,
      yPosition
    );
    yPosition += 8;

    // Añade el nombre del usuario centrado y subrayado
    const nombreUsuario = `${document.getElementById("nombreUsuario").value}`;
    const nombreUsuarioWidth = doc.getTextWidth(nombreUsuario);
    doc.text(
      nombreUsuario,
      marginLeft + pageWidth / 2 - nombreUsuarioWidth / 2,
      yPosition
    );

    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.1);
    doc.line(
      marginLeft + pageWidth / 2 - nombreUsuarioWidth / 2 - 5,
      yPosition + 1,
      marginLeft + pageWidth / 2 + nombreUsuarioWidth / 2 + 5,
      yPosition + 1
    );

    yPosition += 15;

    doc.setFontSize(12);
    doc.text(traducciones.date, marginLeft, yPosition);
    doc.text(traducciones.in, marginLeft + pageWidth / 4, yPosition);
    doc.text(traducciones.out, marginLeft + pageWidth / 2, yPosition);
    doc.text(traducciones.break, marginLeft + (3 * pageWidth) / 4, yPosition);

    yPosition += 7;

    Object.keys(fechasSeleccionadas).forEach((fecha) => {
      if (yPosition > doc.internal.pageSize.getHeight() - marginBottom) {
        doc.addPage();
        yPosition = marginTop;
      }
      const { entrada, salida, descanso } = fechasSeleccionadas[fecha];
      doc.text(fecha, marginLeft, yPosition);
      doc.text(entrada, marginLeft + pageWidth / 4, yPosition);
      doc.text(salida, marginLeft + pageWidth / 2, yPosition);
      doc.text(`${descanso} mins`, marginLeft + (3 * pageWidth) / 4, yPosition);
      yPosition += 7;
    });

    // Resumen al final
    if (yPosition + 30 > doc.internal.pageSize.getHeight() - marginBottom) {
      // Asegura espacio para el resumen
      doc.addPage();
      yPosition = marginTop;
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(traducciones.resume, marginLeft, (yPosition += 10));
    doc.setFont("helvetica", "normal");
    doc.text(
      `${traducciones.total_hours}: ${document.getElementById("total_horas").value}`,
      marginLeft,
      (yPosition += 7)
    );
    doc.text(
      `${traducciones.price_per_hour}: ${document.getElementById("precio_hora").value} ${
        document.getElementById("moneda").value
      }`,
      marginLeft,
      (yPosition += 6)
    );
    doc.text(
      `${traducciones.total_amount}: ${document.getElementById("monto_total").value}`,
      marginLeft,
      (yPosition += 6)
    );

    doc.save("resume.pdf");
  };
}

document.getElementById("resumenModal").addEventListener("shown.bs.modal", function () {
    document.getElementById("nombreUsuario").focus();
});

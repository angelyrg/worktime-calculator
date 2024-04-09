let fechasSeleccionadas = {};
let totalResumen = {
  totalMonto: 0,
  totalHoras: 0,
  totalHorasFormateado: "00:00",
};


document.addEventListener("DOMContentLoaded", () => {
  var toastEl = document.getElementById('miToast');
  var toast = new bootstrap.Toast(toastEl);
  toast.show();

  document.querySelectorAll("#precio_hora, #moneda").forEach((elem) => {
      elem.addEventListener("change", () => {
        calcularTotal(fechasSeleccionadas);

      });
    });

  const btnDescargar = document.getElementById("btnDescargar");
  btnDescargar.addEventListener("click", () =>
    descargarPDF(fechasSeleccionadas)
  );
});

document.getElementById("seleccionarFechas").addEventListener("click", () => {
  // Convertir las claves del objeto fechasSeleccionadas a un array para establecer como fechas predeterminadas
  const fechasPredeterminadas = Object.keys(fechasSeleccionadas);
  
  // Abrir calendario con Flatpickr
  flatpickr("#calendarioContainer", {
      mode: "multiple",
      dateFormat: "Y-m-d",
      enableTime: false,
      defaultDate: fechasPredeterminadas, // Establece las fechas seleccionadas como fechas predeterminadas
      disable: fechasPredeterminadas, // Deshabilita las fechas que ya han sido seleccionadas
      onClose: function (selectedDates) {
          selectedDates.forEach((date) => {
              const dateString = date.toISOString().substring(0, 10);
              if (!fechasSeleccionadas.hasOwnProperty(dateString)) {
                  fechasSeleccionadas[dateString] = {
                      entrada: $("#horaEntrada").val(),
                      salida: $("#horaSalida").val(),
                      descanso: $("#descanso").val(),
                      totalHoras: calcularHorasTrabajadas()
                  };
              }
          });

          calcularTotal(fechasSeleccionadas);
          actualizarUIData(fechasSeleccionadas);
          sumarTotalHorasYCalcularPago(fechasSeleccionadas)
          updateTotalDiasCounter();

      },
      onReady: function(selectedDates, dateStr, instance) {
          const okButton = document.createElement("button");
          okButton.textContent = "Agregar";
          okButton.className = "add_button";
          okButton.addEventListener("click", () => instance.close());
          instance.calendarContainer.appendChild(okButton);
      }
  }).open();

  
});


function calcularHorasTrabajadas() {
  const entrada = document.getElementById("horaEntrada").value;
  const salida = document.getElementById("horaSalida").value;
  const descanso = parseInt(document.getElementById("descanso").value) || 0;

  // Convertir las horas y minutos a minutos totales desde medianoche
  const [horaEntrada, minutoEntrada] = entrada.split(':').map(n => parseInt(n));
  const [horaSalida, minutoSalida] = salida.split(':').map(n => parseInt(n));

  const entradaTotalMinutos = horaEntrada * 60 + minutoEntrada;
  const salidaTotalMinutos = horaSalida * 60 + minutoSalida;

  let minutosTrabajados = salidaTotalMinutos - entradaTotalMinutos - descanso;

  const horasTrabajadas = Math.floor(minutosTrabajados / 60);
  const minutosRestantes = minutosTrabajados % 60;

  return `${horasTrabajadas}:${minutosRestantes.toString().padStart(2, '0')}`;
}

function sumarTotalHorasYCalcularPago(dates) {
  const MontoPorHora = $("#precio_hora").val();
  let totalMinutos = 0;

  Object.values(dates).forEach(fecha => {
    const [horas, minutos] = fecha.totalHoras.split(":").map(Number);
    totalMinutos += horas * 60 + minutos;
  });

  const totalHorasDecimal = totalMinutos / 60;
  const pagoTotal = totalHorasDecimal * MontoPorHora;

  return {
    totalHorasDecimal: totalHorasDecimal.toFixed(2),
    pagoTotal: pagoTotal.toFixed(2)
  };
}

function actualizarUIData(dates) {
    const container = document.getElementById("fechasSeleccionadasContainer");
    container.innerHTML = "";
    let contador = 1;
    Object.keys(dates).forEach((fecha) => {
      let detalles = dates[fecha];
      let descansoFormateado = (!detalles.descanso || detalles.descanso === "0") ? "00:00" : "00:"+detalles.descanso;
      container.innerHTML += `
          <tr>
              <td>${contador}</td>
              <td>${fecha}</td>
              <td>${detalles.entrada}
              <td>${detalles.salida}</td>
              <td>${descansoFormateado}</td>
              <td><button>x</button></td>
          </tr>`;
      contador++;
    });

    //Actualizar campos en el form
    const monedaSeleccionada = document.getElementById("moneda").value;
    document.getElementById("monto_total").value = `${totalResumen.totalMonto} ${monedaSeleccionada}`;
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
  const pagoPorHora = parseFloat($("#precio_hora").val() || 0);

  let totalMinutos = 0;

  // Sumar todas las horas y minutos trabajados convertidos a minutos
  Object.values(dates).forEach(({totalHoras}) => {
    const [horas, minutos] = totalHoras.split(":").map(Number);
    totalMinutos += horas * 60 + minutos;
  });

  // Convertir minutos totales a horas en formato decimal
  const totalHorasResumen = totalMinutos / 60;
  
  // Calcular el monto total
  const totalMontoResumen = totalHorasResumen * pagoPorHora;

  // Convertir de nuevo a formato HH:MM para la visualización
  const horas = Math.floor(totalHorasResumen);
  const minutos = Math.round((totalHorasResumen - horas) * 60);

  const totalHorasFormateado = `${horas}:${minutos.toString().padStart(2, "0")}`;

  totalResumen = {
      totalHoras: totalHorasResumen.toFixed(2), // Horas totales en formato decimal
      totalMonto: totalMontoResumen.toFixed(2), // Monto total basado en el pago por hora
      totalHorasFormateado: totalHorasFormateado // Horas y minutos formateados para visualización
  };
}


function updateTotalDiasCounter(){
  const total = Object.keys(fechasSeleccionadas).length;
  $("#total_dias_selected").text(total)
}

async function cargarTraducciones(language) {
  const response = await fetch(`./../../lang/${language}.json`);
  if (!response.ok) {
    throw new Error('No se pudo cargar el archivo de idioma');
  }
  return await response.json();
}

async function descargarPDF(fechasSeleccionadas) {

    const preferredLanguage = localStorage.getItem('preferredLanguage') || navigator.language.split('-')[0];

    
    const texts = await cargarTraducciones(preferredLanguage);
    const traducciones = texts.pdf;
    console.log(preferredLanguage, traducciones);


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

document.getElementById("nameModal").addEventListener("shown.bs.modal", function () {
    document.getElementById("nombreUsuario").focus();
});

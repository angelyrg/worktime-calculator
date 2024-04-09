let fechasSeleccionadas = {};
let totalResumen = {
  totalMonto: 0,
  totalHoras: 0,
  totalHorasFormateado: "00:00",
};


document.getElementById("moneda").addEventListener("change", updateResumenFormUI);

document.getElementById("btnDescargar").addEventListener("click", () => descargarPDF(fechasSeleccionadas));

document.getElementById("precio_hora").addEventListener("click", () => {
  actualizarTotalResumenDATA(fechasSeleccionadas);
  actualizarTablaResumenUI(fechasSeleccionadas);
  updateTotalDiasCounterUI();
  updateResumenFormUI();
});

document.getElementById("seleccionarFechas").addEventListener("click", () => {
  openCalendar();
});

async function openCalendar(){
  const preferredLanguage = localStorage.getItem('preferredLanguage') || navigator.language.split('-')[0];
  const texts = await cargarTraducciones(preferredLanguage);
  console.log("traducciones", texts.js.add_dates);


  // Convertir las claves del objeto fechasSeleccionadas a un array para establecer como fechas predeterminadas
  const fechasPredeterminadas = Object.keys(fechasSeleccionadas);

  const entradaInput = $("#horaEntrada").val();
  const salidaInput = $("#horaSalida").val();
  const descansoInput = $("#descanso").val();
  
  // Abrir calendario con Flatpickr
  flatpickr("#calendarioContainer", {
      mode: "multiple",
      dateFormat: "Y-m-d",
      enableTime: false,
      defaultDate: fechasPredeterminadas, // Establece las fechas seleccionadas como fechas predeterminadas
      disable: fechasPredeterminadas, // Deshabilita las fechas que ya han sido seleccionadas
      onClose: function (selectedDates) {
          let diasAgregados = 0;
          selectedDates.forEach((date) => {
              const dateString = date.toISOString().substring(0, 10);
              if (!fechasSeleccionadas.hasOwnProperty(dateString)) {
                  fechasSeleccionadas[dateString] = {
                    entrada: entradaInput,
                    salida: salidaInput,
                    descanso: descansoInput,
                    totalHoras: getHourPerDay(entradaInput, salidaInput, descansoInput),
                  };
                  diasAgregados++;
              }
          });

          showToast(`${diasAgregados} ${texts.js.dates_added}`);

          actualizarTotalResumenDATA(fechasSeleccionadas);
          actualizarTablaResumenUI(fechasSeleccionadas);

          updateTotalDiasCounterUI();
          updateResumenFormUI();
      },
      onReady: function(selectedDates, dateStr, instance) {
          const okButton = document.createElement("button");
          okButton.textContent = `${texts.js.add_dates}`;
          okButton.className = "add_button";
          okButton.addEventListener("click", () => instance.close());
          instance.calendarContainer.appendChild(okButton);
      }
  }).open();
}


function actualizarTotalResumenDATA(dates) {
  const pagoPorHora = parseFloat($("#precio_hora").val() || 0);

  let totalMinutos = 0;

  // Sumar todas las horas y minutos trabajados convertidos a minutos
  Object.values(dates).forEach(({ totalHoras }) => {
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

  const totalHorasFormateado = `${horas}:${minutos
    .toString()
    .padStart(2, "0")}`;

  totalResumen = {
    totalHoras: totalHorasResumen.toFixed(2), // Horas totales en formato decimal
    totalMonto: totalMontoResumen.toFixed(2), // Monto total basado en el pago por hora
    totalHorasFormateado: totalHorasFormateado, // Horas y minutos formateados para visualización
  };
}

function actualizarTablaResumenUI(dates) {
  const container = document.getElementById("fechasSeleccionadasContainer");
  container.innerHTML = "";
  let contador = 1;
  Object.keys(dates).forEach((fecha) => {
    let detalles = dates[fecha];
    let descansoFormateado =
      !detalles.descanso || detalles.descanso === "0"
        ? "00:00"
        : "00:" + detalles.descanso;
    container.innerHTML += `
          <tr>
              <td>
                <input type="checkbox" class="row-checkbox" data-fecha="${fecha}" />
              </td>
              <td>${contador}</td>
              <td>${fecha}</td>
              <td>${detalles.entrada}</td>
              <td>${detalles.salida}</td>
              <td>${descansoFormateado}</td>
          </tr>`;
    contador++;
  });

  // Después de actualizar la tabla, añade manejadores de eventos a los nuevos checkboxes
  document.querySelectorAll(".row-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", verificarCheckboxesSeleccionados);
  });

  // Llamar inicialmente para establecer el estado correcto de los botones
  verificarCheckboxesSeleccionados();

}

function verificarCheckboxesSeleccionados() {
  // Comprobar si al menos un checkbox está seleccionado
  const alMenosUnoSeleccionado =
    document.querySelector(".row-checkbox:checked") !== null;

  // Habilitar o deshabilitar los botones basado en si hay checkboxes seleccionados
  document.getElementById("btn_edit").disabled = !alMenosUnoSeleccionado;
  document.getElementById("btn_remove").disabled = !alMenosUnoSeleccionado;
}

// Manejar clic en el botón Remove
document.querySelector('#btn_remove').addEventListener('click', () => {
  document.querySelectorAll('.row-checkbox:checked').forEach(checkbox => {
    delete fechasSeleccionadas[checkbox.dataset.fecha];
  });
  // TODO: TRANSALTE
  showToast(`Fechas eliminadas`);
  actualizarTotalResumenDATA(fechasSeleccionadas);
  actualizarTablaResumenUI(fechasSeleccionadas);
  updateTotalDiasCounterUI();
  updateResumenFormUI();
});

// ---------------------------

// Abrir el modal para editar
document.getElementById('btn_edit').addEventListener('click', () => {
  // Buscar el primer checkbox seleccionado
  const primerCheckboxSeleccionado = document.querySelector(
    ".row-checkbox:checked"
  );

  if (primerCheckboxSeleccionado) {
    // Usar el valor de `data-fecha` para obtener los detalles de `fechasSeleccionadas`
    const fechaSeleccionada =
      primerCheckboxSeleccionado.getAttribute("data-fecha");
    const detalles = fechasSeleccionadas[fechaSeleccionada];

    if (detalles) {
      // Autocompletar los campos del modal con los detalles encontrados
      document.getElementById("modalEntradaEdit").value = detalles.entrada;
      document.getElementById("modalSalidaEdit").value = detalles.salida;
      document.getElementById("modalDescansoEdit").value = detalles.descanso;
    }
  }

  $("#modalEditarHoras").modal("show");
});

// Guardar los cambios al hacer clic en "Guardar Cambios" en el modal
document.getElementById('btnGuardarCambios').addEventListener('click', () => {
  const entrada = document.getElementById('modalEntradaEdit').value;
  const salida = document.getElementById('modalSalidaEdit').value;
  const descanso = document.getElementById('modalDescansoEdit').value;

  if (!entrada || !salida || descanso === "") {
    $("#editModalError").text("Todos los campos son obligatorios");
    return;
  }

  // Iterar sobre todas las filas con checkbox marcado
  document.querySelectorAll('.row-checkbox:checked').forEach(checkbox => {
    const fecha = checkbox.dataset.fecha;
    // Actualizar los valores en el objeto fechasSeleccionadas
    if (fechasSeleccionadas.hasOwnProperty(fecha)) {
      fechasSeleccionadas[fecha].entrada = entrada,
      fechasSeleccionadas[fecha].salida = salida,
      fechasSeleccionadas[fecha].descanso = descanso,
      fechasSeleccionadas[fecha].totalHoras = getHourPerDay(entrada, salida, descanso)
    }
  });

  // TODO: TRANSLATE
  showToast(`Dates updates`);

  actualizarTotalResumenDATA(fechasSeleccionadas);
  // Actualizar la tabla UI
  actualizarTablaResumenUI(fechasSeleccionadas);
  actualizarTotalResumenDATA(fechasSeleccionadas);
  updateTotalDiasCounterUI();
  updateResumenFormUI();

  // Cerrar el modal
  $('#modalEditarHoras').modal('hide');
  $("#resumenModal").modal("show");
});

// ------------------------------

function showToast(mesaje) {
  const toastEl = document.getElementById("miToast");
  const toast = new bootstrap.Toast(toastEl);
  $("#toastBody").text(mesaje);
  toast.show();
}

function updateResumenFormUI(){
  $("#total_horas").val(totalResumen.totalHorasFormateado);
  $("#monto_total").val(`${$("#moneda").val()}${totalResumen.totalMonto}`);

  $("#totalHoursModal").text(totalResumen.totalHorasFormateado);
  $("#totalAmountModal").text(`${$("#moneda").val()}${totalResumen.totalMonto}`);
}

function updateTotalDiasCounterUI(){
  const total = Object.keys(fechasSeleccionadas).length;
  $("#total_dias_selected").text(total)

  if (total>0){
    $("#saveButton").attr("disabled", false);
  }else{
    $("#saveButton").attr("disabled", true);
  }
}

function getHourPerDay(entrada, salida, descansoInput) {

  const descanso = parseInt(descansoInput) || 0;

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

function eliminarFecha(fecha) {
  delete fechasSeleccionadas[fecha];

  actualizarTablaResumenUI(fechasSeleccionadas);
  actualizarTotalResumenDATA(fechasSeleccionadas);
  updateTotalDiasCounterUI();
  updateResumenFormUI();
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
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Definir márgenes
  const marginLeft = 40;
  const marginRight = 40;
  const marginTop = 20;
  const marginBottom = 20;
  const pageWidth = doc.internal.pageSize.getWidth() - marginLeft - marginRight;

  const img = new Image();
  img.src = "./assets/img/logotipo-skyblue.png";
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

      const descansoFormateado = !descanso || descanso === "0" ? "00:00" : "00:" + descanso;

      doc.text(fecha, marginLeft, yPosition);
      doc.text(entrada, marginLeft + pageWidth / 4, yPosition);
      doc.text(salida, marginLeft + pageWidth / 2, yPosition);
      doc.text(`${descansoFormateado}`, marginLeft + (3 * pageWidth) / 4, yPosition);
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
      `${traducciones.total_hours}: ${totalResumen.totalHorasFormateado}`,
      marginLeft,
      (yPosition += 7)
    );
    doc.text(
      `${traducciones.price_per_hour}: ${document.getElementById("moneda").value}${document.getElementById("precio_hora").value}`,
      marginLeft,
      (yPosition += 6)
    );
    doc.text(
      `${traducciones.total_amount}: ${document.getElementById("moneda").value}${totalResumen.totalMonto}`,
      marginLeft,
      (yPosition += 6)
    );

    doc.save("resume.pdf");


  };

  // $("#thanksModal").modal('show');
}

document.getElementById("nameModal").addEventListener("shown.bs.modal", function () {
    document.getElementById("nombreUsuario").focus();
});

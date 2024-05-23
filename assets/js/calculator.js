let fechasSeleccionadas = {};
let totalResumen = {
  precioHora: 0,
  totalMonto: 0,
  totalHoras: 0,
  totalHorasFormateado: "00:00",
};

let translates = {};

$(document).ready(async function () {
  try {
    translates = await cargarTraducciones();
  } catch (error) {
    console.error(error.message);
  }
});

document.getElementById("moneda").addEventListener("change", updateResumenFormUI);

document.getElementById("btnDescargar").addEventListener("click", () => descargarPDF(fechasSeleccionadas));

document.getElementById("precio_hora").addEventListener("click", () => {
  actualizarTotalResumenDATA(fechasSeleccionadas);
  actualizarTablaResumenUI(fechasSeleccionadas);
  updateTotalDiasCounterUI();
  updateResumenFormUI();
});

document.getElementById("seleccionarFechas").addEventListener("click", () => {
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

          if (diasAgregados>0) {
            showToast(`${diasAgregados} ${translates.js.dates_added}`);
          }

          actualizarTotalResumenDATA(fechasSeleccionadas);
          actualizarTablaResumenUI(fechasSeleccionadas);

          updateTotalDiasCounterUI();
          updateResumenFormUI();
      },
      onReady: function(selectedDates, dateStr, instance) {
          const okButton = document.createElement("button");
          okButton.textContent = `${translates.js.add_dates}`;
          okButton.className = "add_button";
          okButton.addEventListener("click", () => instance.close());
          instance.calendarContainer.appendChild(okButton);
      }
  }).open();
});




function actualizarTotalResumenDATA(dates) {
  const pagoPorHora = parseFloat($("#precio_hora").val() || 0);

  let totalMinutos = 0;

  Object.values(dates).forEach(({ totalHoras }) => {
    const [horas, minutos] = totalHoras.split(":").map(Number);
    totalMinutos += horas * 60 + minutos;
  });

  // Convertir minutos totales a horas en formato decimal
  const totalHorasResumen = totalMinutos / 60;

  const totalMontoResumen = totalHorasResumen * pagoPorHora;

  // Convertir de nuevo a formato HH:MM para la visualización
  const horas = Math.floor(totalHorasResumen);
  const minutos = Math.round((totalHorasResumen - horas) * 60);

  const totalHorasFormateado = `${horas}:${minutos
    .toString()
    .padStart(2, "0")}`;

  totalResumen = {
    precioHora: pagoPorHora.toFixed(2),
    totalHoras: totalHorasResumen.toFixed(2),
    totalMonto: totalMontoResumen.toFixed(2),
    totalHorasFormateado: totalHorasFormateado,
  };
}

function actualizarTablaResumenUI(dates) {
  const container = document.getElementById("fechasSeleccionadasContainer");
  container.innerHTML = "";
  let contador = 1;
  Object.keys(dates).forEach((fecha) => {

    const partesFecha = fecha.split('-'); // ["yyyy", "mm", "dd"]
    const fechaFormateada = `${partesFecha[2]}/${partesFecha[1]}/${partesFecha[0].substring(2)}`; // "dd/mm/yy"

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
              <td>${fechaFormateada}</td>
              <td>${detalles.entrada}</td>
              <td>${detalles.salida}</td>
              <td>${descansoFormateado}</td>
              <td>${detalles.totalHoras}</td>
          </tr>`;
    contador++;
  });

  document.querySelectorAll(".row-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", verificarCheckboxesSeleccionados);
  });

  verificarCheckboxesSeleccionados();

}

function verificarCheckboxesSeleccionados() {
  const alMenosUnoSeleccionado =
    document.querySelector(".row-checkbox:checked") !== null;
  
  document.getElementById("btn_edit").disabled = !alMenosUnoSeleccionado;
  document.getElementById("btn_remove").disabled = !alMenosUnoSeleccionado;
}

document.querySelector('#btn_remove').addEventListener('click', () => {
  document.querySelectorAll('.row-checkbox:checked').forEach(checkbox => {
    delete fechasSeleccionadas[checkbox.dataset.fecha];
  });
  showToast(`${translates.js.dates_removed}`);
  actualizarTotalResumenDATA(fechasSeleccionadas);
  actualizarTablaResumenUI(fechasSeleccionadas);
  updateTotalDiasCounterUI();
  updateResumenFormUI();
});

document.getElementById('btn_edit').addEventListener('click', () => {
  const primerCheckboxSeleccionado = document.querySelector(
    ".row-checkbox:checked"
  );

  if (primerCheckboxSeleccionado) {
    const fechaSeleccionada =
      primerCheckboxSeleccionado.getAttribute("data-fecha");
    const detalles = fechasSeleccionadas[fechaSeleccionada];

    if (detalles) {
      document.getElementById("modalEntradaEdit").value = detalles.entrada;
      document.getElementById("modalSalidaEdit").value = detalles.salida;
      document.getElementById("modalDescansoEdit").value = detalles.descanso;
    }
  }

  $("#modalEditarHoras").modal("show");
});


document.getElementById('btnGuardarCambios').addEventListener('click', () => {
  const entrada = document.getElementById('modalEntradaEdit').value;
  const salida = document.getElementById('modalSalidaEdit').value;
  const descanso = document.getElementById('modalDescansoEdit').value;

  if (!entrada || !salida || descanso === "") {
    $("#editModalError").text(`${translates.resume_modal.message_all_required}`);
    return;
  }

  document.querySelectorAll('.row-checkbox:checked').forEach(checkbox => {
    const fecha = checkbox.dataset.fecha;
    if (fechasSeleccionadas.hasOwnProperty(fecha)) {
      fechasSeleccionadas[fecha].entrada = entrada,
      fechasSeleccionadas[fecha].salida = salida,
      fechasSeleccionadas[fecha].descanso = descanso,
      fechasSeleccionadas[fecha].totalHoras = getHourPerDay(entrada, salida, descanso)
    }
  });

  showToast(`${translates.js.dates_edited}`);

  actualizarTotalResumenDATA(fechasSeleccionadas);
  
  actualizarTablaResumenUI(fechasSeleccionadas);
  updateTotalDiasCounterUI();
  updateResumenFormUI();

  // Cerrar el modal
  $('#modalEditarHoras').modal('hide');
  $("#resumenModal").modal("show");
});


function showToast(mesaje) {
  const toastEl = document.getElementById("miToast");
  const toast = new bootstrap.Toast(toastEl);
  $("#toastBody").text(mesaje);
  toast.show();
}

function updateResumenFormUI(){
  $("#total_horas").val(totalResumen.totalHorasFormateado);
  $("#monto_total").val(`${$("#moneda").val()}${totalResumen.totalMonto}`);

  $("#priceHoursModal").text(`${$("#moneda").val()}${totalResumen.precioHora}`);
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

async function cargarTraducciones() {
  const preferredLanguage = localStorage.getItem('preferredLanguage') || navigator.language.split('-')[0];
  const response = await fetch(`./lang/${preferredLanguage}.json`);
  if (!response.ok) {
    throw new Error('No se pudo cargar el archivo de idioma');
  }
  return await response.json();
}

async function descargarPDF(fechasSeleccionadas) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Definir márgenes
  const marginLeft = 40;
  const marginRight = 40;
  const marginTop = 20;
  const marginBottom = 20;
  const pageWidth = doc.internal.pageSize.getWidth() - marginLeft - marginRight;

  const img = new Image();
  img.src = "./assets/img/logotipo-brand.png";
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
    const nombreUsuario = `${document.getElementById("inputNameToDownload").value}`;
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

    const columnWidth = pageWidth / 6;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");

    doc.text("N°", marginLeft, yPosition);
    doc.text(translates.pdf.date, marginLeft + (columnWidth * 0.5), yPosition);
    doc.text(translates.pdf.in, marginLeft + columnWidth * 2, yPosition);
    doc.text(translates.pdf.out, marginLeft + columnWidth * 3, yPosition);
    doc.text(translates.pdf.break, marginLeft + columnWidth * 4, yPosition);
    doc.text(translates.pdf.total, marginLeft + columnWidth * 5, yPosition);

    yPosition += 7;

    doc.setFont("helvetica", "normal");

    let contador = 1;
    Object.keys(fechasSeleccionadas).forEach((fecha) => {
      if (yPosition > doc.internal.pageSize.getHeight() - marginBottom) {
        doc.addPage();
        yPosition = marginTop;
      }
      const { entrada, salida, descanso, totalHoras } = fechasSeleccionadas[fecha];
      const descansoFormateado = !descanso || descanso === "0" ? "00:00" : "00:" + descanso;

      const partesFecha = fecha.split('-'); // ["yyyy", "mm", "dd"]
      const fechaFormateada = `${partesFecha[2]}/${partesFecha[1]}/${partesFecha[0].substring(2)}`; // "dd/mm/yy"

      doc.text(`${contador}`, marginLeft, yPosition);
      doc.text(fechaFormateada, marginLeft + columnWidth * 0.5, yPosition);
      doc.text(entrada, marginLeft + columnWidth * 2, yPosition);
      doc.text(salida, marginLeft + columnWidth * 3, yPosition);
      doc.text(descansoFormateado, marginLeft + columnWidth * 4, yPosition);
      doc.text(totalHoras, marginLeft + columnWidth * 5, yPosition);

      yPosition += 7;
      contador++;
    });

    // Resumen al final
    if (yPosition + 30 > doc.internal.pageSize.getHeight() - marginBottom) {
      doc.addPage();
      yPosition = marginTop;
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(translates.pdf.resume, marginLeft, (yPosition += 10));
    doc.setFont("helvetica", "normal");
    doc.text(
      `${translates.pdf.total_hours}: ${totalResumen.totalHorasFormateado}`,
      marginLeft,
      (yPosition += 7)
    );
    doc.text(
      `${translates.pdf.price_per_hour}: ${document.getElementById("moneda").value}${document.getElementById("precio_hora").value}`,
      marginLeft,
      (yPosition += 6)
    );
    doc.text(
      `${translates.pdf.total_amount}: ${document.getElementById("moneda").value}${totalResumen.totalMonto}`,
      marginLeft,
      (yPosition += 6)
    );

    doc.save("resume.pdf");
  };
}

$("#nameModal").on("shown.bs.modal", function () {
  setTimeout(function () {
    document.getElementById("inputNameToDownload").focus();
  }, 500);
});

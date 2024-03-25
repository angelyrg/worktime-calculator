

document.addEventListener('DOMContentLoaded', () => {
    setCurrentMonthYear();

    let fechasSeleccionadas = {};
    let entradaDefault = document.getElementById('horaEntrada').value;
    let salidaDefault = document.getElementById('horaSalida').value;
    let descansoDefault = parseInt(document.getElementById('descanso').value);

    document.getElementById('horaEntrada').addEventListener('change', function () {
        entradaDefault = this.value;
    });

    document.getElementById('horaSalida').addEventListener('change', function () {
        salidaDefault = this.value;
    });

    document.getElementById('descanso').addEventListener('change', function () {
        descansoDefault = parseInt(this.value);
    });

    document.getElementById('seleccionarFechas').addEventListener('click', () => {
        flatpickr("#calendarioContainer", {
            mode: "multiple",
            dateFormat: "Y-m-d",
            enableTime: false,
            defaultDate: Object.keys(fechasSeleccionadas),
            onClose: function (selectedDates) {
                const fechasActualizadas = {};
                selectedDates.forEach((date) => {
                    const dateString = date.toISOString().substring(0, 10);
                    fechasActualizadas[dateString] = fechasSeleccionadas[dateString] || {
                        entrada: entradaDefault,
                        salida: salidaDefault,
                        descanso: descansoDefault
                    };
                });
                fechasSeleccionadas = fechasActualizadas;
                actualizarUIFechas();
                calcularHorasYTotal();
            },
            onReady: function(selectedDates, dateStr, instance) {
                const okButton = document.createElement("button");
                okButton.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 32 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M29.75 2L10.5 24L2.25 15.75" stroke="black" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`;
                okButton.className = "border-0 px-3 py-2 rounded-3";
                okButton.addEventListener("click", function() {
                    instance.close();
                });
                
                instance.calendarContainer.appendChild(okButton);
            },
        }).open();
    });

    function actualizarUIFechas() {
        const container = document.getElementById('fechasSeleccionadasContainer');
        container.innerHTML = '';
        Object.entries(fechasSeleccionadas).forEach(([fecha, detalles]) => {
            container.innerHTML += `
                <tr>
                    <td>${fecha}</td>
                    <td>${detalles.entrada}</td>
                    <td>${detalles.salida}</td>
                    <td>${detalles.descanso} mins</td>
                </tr>
            `;
        });
    }

    function calcularHorasYTotal() {
        let totalHoras = 0;
        Object.keys(fechasSeleccionadas).forEach(fecha => {
            const { entrada, salida, descanso } = fechasSeleccionadas[fecha];
            const horaEntrada = dayjs(`${fecha}T${entrada}`);
            const horaSalida = dayjs(`${fecha}T${salida}`);
            const horasTrabajadas = horaSalida.diff(horaEntrada, 'hour', true) - (descanso / 60);
            totalHoras += horasTrabajadas;

            // Actualizar fechasSeleccionadas con las horas trabajadas y descanso
            fechasSeleccionadas[fecha].horasTrabajadas = horasTrabajadas;
        });
        const pagoPorHora = parseFloat(document.getElementById('precio_hora').value);
        const monedaSeleccionada = document.getElementById('moneda').value;
        const totalAPagar = totalHoras * pagoPorHora;

        document.getElementById('total_horas').value = `${totalHoras.toFixed(2)}`;
        document.getElementById('monto_total').value = `${totalAPagar.toFixed(2)} ${monedaSeleccionada}`;
    }

    const btnDescargar = document.getElementById('btnDescargar');
    btnDescargar.addEventListener('click', () => descargarPDF(fechasSeleccionadas));

    
});


function descargarPDF(fechasSeleccionadas) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      // Ajusta los márgenes del documento
      // Los valores aquí son los predeterminados, ajusta según necesites
      margins: { top: 10, bottom: 10, left: 10, right: 10 },
    });

    let yPosition = 20; // Inicia un poco más abajo para dar espacio al encabezado
    const fontSize = 10; // Define un tamaño de fuente uniforme para todo el texto
    doc.setFontSize(fontSize); // Aplica el tamaño de fuente

    // Define un espaciado vertical menor para que los textos estén más "pegados"
    const lineSpacing = 5;

    // Encabezado
    doc.text(`Nombre: ${document.getElementById('nombreUsuario').value}`, 10, yPosition);
    yPosition += lineSpacing; // Usa el espaciado vertical personalizado
    doc.text(`Pago por hora: ${document.getElementById('precio_hora').value} ${document.getElementById('moneda').value}`, 10, yPosition);
    yPosition += lineSpacing + 5; // Agrega un poco más de espacio antes de la tabla

    // Títulos de columnas para la tabla
    doc.text("Fecha", 10, yPosition);
    doc.text("Entrada", 40, yPosition);
    doc.text("Salida", 70, yPosition);
    doc.text("Descanso", 100, yPosition);
    yPosition += lineSpacing;

    // Iterar sobre fechas seleccionadas y añadir a la tabla
    Object.keys(fechasSeleccionadas).forEach(fecha => {
        const { entrada, salida, descanso } = fechasSeleccionadas[fecha];
        doc.text(fecha, 10, yPosition);
        doc.text(entrada, 40, yPosition);
        doc.text(salida, 70, yPosition);
        doc.text(`${descanso} min`, 100, yPosition);
        yPosition += lineSpacing;

        // Asegurar que no se desborde la página, añadiendo una nueva si es necesario
        if (yPosition > 280) {
            doc.addPage();
            yPosition = 10;
        }
    });

    // Resumen
    yPosition += 5; // Agrega un poco más de espacio antes del resumen
    doc.text(`Total horas: ${document.getElementById('total_horas').value}`, 10, yPosition);
    yPosition += lineSpacing;
    doc.text(`Monto total: ${document.getElementById('monto_total').value}`, 10, yPosition);

    doc.save('resumen-sueldo.pdf');
}


function setCurrentMonthYear(){
    const inputMesActual = document.getElementById('seleccionarFechas');
    
    const fechaActual = new Date();
    const opciones = { month: 'long', year: 'numeric' };
    const idiomaNavegador = navigator.language;

    const mesYAnio = new Intl.DateTimeFormat(idiomaNavegador, opciones).format(fechaActual);
    inputMesActual.value = mesYAnio;
}


document.getElementById('resumenModal').addEventListener('shown.bs.modal', function () {
    document.getElementById('nombreUsuario').focus();
});

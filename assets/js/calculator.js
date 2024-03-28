document.addEventListener('DOMContentLoaded', () => {
    setCurrentMonthYear();

    var fechasSeleccionadas = {};
    var entradaDefault = document.getElementById('horaEntrada').value;
    var salidaDefault = document.getElementById('horaSalida').value;
    var descansoDefault = parseInt(document.getElementById("descanso").value) || 0;

    document.querySelectorAll('#horaEntrada, #horaSalida, #descanso, #precio_hora, #moneda').forEach(elem => {
        elem.addEventListener('change', ()=>{

            console.log("Cambio");
            actualizarCalculos();

        });
    });

    document.getElementById('seleccionarFechas').addEventListener('click', () => {
        actualizarFechasSeleccionadas();        
    });

    function actualizarFechasSeleccionadas(){
        flatpickr("#calendarioContainer", {
            mode: "multiple",
            dateFormat: "Y-m-d",
            enableTime: false,
            defaultDate: Object.keys(fechasSeleccionadas),
            onClose: function(selectedDates) {
                const fechasActualizadas = {};
                selectedDates.forEach(date => {
                    const dateString = date.toISOString().substring(0, 10);
                    fechasActualizadas[dateString] = fechasSeleccionadas[dateString] || {
                        entrada: entradaDefault,
                        salida: salidaDefault,
                        descanso: descansoDefault
                    };
                });
                fechasSeleccionadas = fechasActualizadas;
                actualizarUIFechas();
                actualizarCalculos();
            },
            onReady: function(selectedDates, dateStr, instance) {
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
    }

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

    function actualizarCalculos() {
        console.log("actualizarCalculos");

        entradaDefault = document.getElementById('horaEntrada').value;
        salidaDefault = document.getElementById('horaSalida').value;
        descansoDefault = parseInt(document.getElementById("descanso").value) || 0;

        // Luego, recalcular el total de horas y actualizar el total a pagar
        calcularHorasYTotal();
    }

    function calcularHorasYTotal() {
        let totalHoras = 0;
        Object.keys(fechasSeleccionadas).forEach(fecha => {
            // Actualiza las horas de entrada, salida y descanso basado en los valores actuales
            const entrada = entradaDefault;
            const salida = salidaDefault;
            const descanso = parseInt(document.getElementById("descanso").value) || 0;
            
            // Realiza los cálculos de horas trabajadas para cada fecha seleccionada
            const horaEntrada = dayjs(`${fecha}T${entrada}`);
            const horaSalida = dayjs(`${fecha}T${salida}`);
            const horasTrabajadas = horaSalida.diff(horaEntrada, 'hour', true) - (descanso / 60);
    
            // Acumula las horas trabajadas en el total
            totalHoras += horasTrabajadas;
    
            // Actualiza el registro actual con las nuevas horas trabajadas
            fechasSeleccionadas[fecha] = { ...fechasSeleccionadas[fecha], horasTrabajadas };
        });
    
        // Actualiza el total de horas trabajadas en la interfaz de usuario
        document.getElementById("total_horas").value = totalHoras.toFixed(2);
    
        // Dado que el total de horas ha cambiado, es posible que también necesites actualizar el total a pagar
        multiplicarHorasYPrecio();
    }

    function multiplicarHorasYPrecio() {
        const pagoPorHora = parseFloat(document.getElementById("precio_hora").value);
        const monedaSeleccionada = document.getElementById("moneda").value;
        const totalHoras = parseFloat(document.getElementById("total_horas").value);
        const totalAPagar = totalHoras * pagoPorHora;
        document.getElementById("monto_total").value = `${totalAPagar.toFixed(2)} ${monedaSeleccionada}`;
    }

    const btnDescargar = document.getElementById('btnDescargar');
    btnDescargar.addEventListener('click', () => descargarPDF(fechasSeleccionadas));
});

function setCurrentMonthYear() {
    const inputMesActual = document.getElementById('seleccionarFechas');
    const fechaActual = new Date();
    const opciones = { month: 'long', year: 'numeric' };
    const idiomaNavegador = navigator.language;
    const mesYAnio = new Intl.DateTimeFormat(idiomaNavegador, opciones).format(fechaActual);
    inputMesActual.value = mesYAnio;
}



function descargarPDF(fechasSeleccionadas) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
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

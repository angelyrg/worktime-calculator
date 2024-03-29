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
    const doc = new jsPDF();

    // Definir márgenes
    const marginLeft = 40;
    const marginRight = 40;
    const marginTop = 20;
    const marginBottom = 20;
    const pageWidth = doc.internal.pageSize.getWidth() - marginLeft - marginRight;


    const img = new Image();
    img.src = './../assets/img/logotipo.png';
    img.onload = () => {

        const imgWidthInPdf = 50;
        const imgHeightInPdf = (imgWidthInPdf / 592) * 130;
        const xPosition = marginLeft + (pageWidth / 2) - (imgWidthInPdf / 2);
        doc.addImage(img, 'PNG', xPosition, marginTop, imgWidthInPdf, imgHeightInPdf);
        
        
        let yPosition = marginTop + imgHeightInPdf + 5;
    
        // Añade "www.tu-time.com" 
        const fontSize = 11;
        doc.setFontSize(fontSize);
        const sitioWeb = "www.tu-time.com";
        const sitioWebWidth = doc.getTextWidth(sitioWeb);
        doc.text(sitioWeb, marginLeft + (pageWidth / 2) - (sitioWebWidth / 2), yPosition);
        yPosition += 8;
    
        // Añade el nombre del usuario centrado y subrayado
        const nombreUsuario = `${document.getElementById('nombreUsuario').value}`;
        const nombreUsuarioWidth = doc.getTextWidth(nombreUsuario);
        doc.text(nombreUsuario, marginLeft + (pageWidth / 2) - (nombreUsuarioWidth / 2), yPosition);
    
        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.1);
        doc.line(marginLeft + (pageWidth / 2) - (nombreUsuarioWidth / 2) - 5, yPosition + 1, marginLeft + (pageWidth / 2) + (nombreUsuarioWidth / 2) + 5, yPosition + 1);
    
        yPosition += 15; 
        
    
        doc.setFontSize(12);
        doc.text("Date", marginLeft, yPosition);
        doc.text("In", marginLeft + (pageWidth / 4), yPosition);
        doc.text("Out", marginLeft + (pageWidth / 2), yPosition);
        doc.text("Break", marginLeft + (3 * pageWidth / 4), yPosition);
    
        yPosition += 7;
    
        Object.keys(fechasSeleccionadas).forEach(fecha => {
            if (yPosition > doc.internal.pageSize.getHeight() - marginBottom) {
                doc.addPage();
                yPosition = marginTop;
            }
            const { entrada, salida, descanso } = fechasSeleccionadas[fecha];
            doc.text(fecha, marginLeft, yPosition);
            doc.text(entrada, marginLeft + (pageWidth / 4), yPosition);
            doc.text(salida, marginLeft + (pageWidth / 2), yPosition);
            doc.text(`${descanso} min`, marginLeft + (3 * pageWidth / 4), yPosition);
            yPosition += 7;
        });
    
        // Resumen al final
        if (yPosition + 30 > doc.internal.pageSize.getHeight() - marginBottom) { // Asegura espacio para el resumen
            doc.addPage();
            yPosition = marginTop;
        }
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Resume", marginLeft, yPosition += 10);
        doc.setFont("helvetica", "normal");
        doc.text(`Total hours: ${document.getElementById('total_horas').value}`, marginLeft, yPosition += 7);
        doc.text(`Price per hour: ${document.getElementById('precio_hora').value} ${document.getElementById('moneda').value}`, marginLeft, yPosition += 6);
        doc.text(`Total amount: ${document.getElementById('monto_total').value}`, marginLeft, yPosition += 6);
        
    
        doc.save('resume.pdf');
    };


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

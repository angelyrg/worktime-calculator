document.addEventListener('DOMContentLoaded', () => {
    let fechasSeleccionadas = {};
    let entradaDefault = document.getElementById('horaEntrada').value;
    let salidaDefault = document.getElementById('horaSalida').value;

    // Actualización del manejo de cambio para las horas predeterminadas
    document.getElementById('horaEntrada').addEventListener('change', function () {
        entradaDefault = this.value;
    });

    document.getElementById('horaSalida').addEventListener('change', function () {
        salidaDefault = this.value;
    });

    document.getElementById('seleccionarFechas').addEventListener('click', () => {
        flatpickr("#fechasSeleccionadasContainer", {
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
                        salida: salidaDefault
                    };
                });
                fechasSeleccionadas = fechasActualizadas;
                actualizarUIFechas();
                calcularHorasYTotal(); // Mover el cálculo aquí
            }
        }).open();
    });

    

    // Se reutilizan las funciones agregarCamposFecha, actualizarUIFechas sin cambios
    function actualizarUIFechas() {
        const container = document.getElementById('fechasSeleccionadasContainer');
        container.innerHTML = ''; // Limpiar el contenedor
        Object.entries(fechasSeleccionadas).forEach(([fecha, horas]) => {
            agregarCamposFecha(fecha, horas);
        });
    }

    function agregarCamposFecha(fecha, horas) {
        console.log("Agregando campos");
        const container = document.getElementById('fechasSeleccionadasContainer');
        // const tr = document.createElement('tr');
        container.innerHTML += `
            <tr>
                <td>${fecha}</td>
                <td class="horaEntrada" data-fecha="${fecha}">
                    ${horas.entrada}
                </td>
                <td class="horaSalida" data-fecha="${fecha}">
                    ${horas.salida}
                </td>
                <td></td>
            </tr>
        `;
        // container.innerHTML = tr;

        container.querySelector('.horaEntrada').addEventListener('change', function() {
            fechasSeleccionadas[this.dataset.fecha].entrada = this.value;
        });

        container.querySelector('.horaSalida').addEventListener('change', function() {
            fechasSeleccionadas[this.dataset.fecha].salida = this.value;
        });
    }

    // Modifica esta función para calcular también el total a pagar
    function calcularHorasYTotal() {
        let totalHoras = 0;
        const pagoPorHora = parseFloat(document.getElementById('precio_hora').value);
        Object.keys(fechasSeleccionadas).forEach(fecha => {
            const horas = fechasSeleccionadas[fecha];
            const entrada = dayjs(`${fecha}T${horas.entrada}`);
            const salida = dayjs(`${fecha}T${horas.salida}`);
            const diferencia = salida.diff(entrada, 'hour', true);
            totalHoras += diferencia;
        });
        const totalAPagar = totalHoras * pagoPorHora;

        // document.getElementById('resultado').textContent = `Total horas trabajadas: ${totalHoras.toFixed(2)} horas. Total a pagar: ${totalAPagar.toFixed(2)}`;

        document.getElementById('total_horas').value  = `${totalHoras.toFixed(2)} Horas`;
        document.getElementById('monto_total').value  = `${totalAPagar.toFixed(2)} PEN`;

    }
});

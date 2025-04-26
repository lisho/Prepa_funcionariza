document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const numPreguntasInput = document.getElementById('numPreguntas');
    const btnComenzar = document.getElementById('btnComenzar');
    const preguntaElement = document.getElementById('pregunta');
    const respuestasElement = document.getElementById('respuestas');
    const btnSiguiente = document.getElementById('btnSiguiente');
    const puntuacionElement = document.getElementById('puntuacion');
    const correctasElement = document.getElementById('correctas');
    const falladasElement = document.getElementById('falladas');
    const dificultadSelect = document.getElementById('dificultad');
    const barraProgreso = document.getElementById('progreso');
    const configuracionElement = document.getElementById('configuracion');
    const examenElement = document.getElementById('examen');
    const resultadoFinalElement = document.getElementById('resultadoFinal');
    const mensajeFinalElement = document.getElementById('mensajeFinal');
    const btnReiniciar = document.getElementById('btnReiniciar');
    const btnVerResultados = document.getElementById('btnVerResultados');
    const resultadoElement = document.getElementById('resultado');
    const explicacionElement = document.getElementById('explicacion');
    const mensajeResultadoElement = document.getElementById('mensajeResultado');

    // Variables del juego
    let preguntas = [];
    let preguntasSeleccionadas = [];
    let preguntaActualIndex = 0;
    let numPreguntas = 5;
    let respuestasSeleccionadas = [];
    let puntuacion = 0;
    let correctas = 0;
    let falladas = 0;
    let dificultad = 'normal';
    let respuestaSeleccionadaIndex = null;

    // Cargar preguntas desde el archivo JSON
    fetch('preguntas.json')
        .then(response => response.json())
        .then(data => {
            preguntas = data;
            console.log('Preguntas cargadas:', preguntas);
        })
        .catch(error => console.error('Error al cargar las preguntas:', error));

    // Función para mezclar aleatoriamente un array (Fisher-Yates shuffle)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Función para seleccionar preguntas aleatorias
    function seleccionarPreguntas(cantidad) {
        shuffleArray(preguntas);
        preguntasSeleccionadas = preguntas.slice(0, cantidad);
        preguntaActualIndex = 0;
        respuestasSeleccionadas = new Array(preguntasSeleccionadas.length).fill(null);
        puntuacion = 0;
        correctas = 0;
        falladas = 0;
        actualizarMarcador();
        actualizarBarraProgreso();
        respuestaSeleccionadaIndex = null;

        console.log('Número de preguntas seleccionadas:', cantidad);
        console.log('Preguntas seleccionadas:', preguntasSeleccionadas);
    }

    // Función para mostrar una pregunta
    function mostrarPregunta() {
        console.log('Mostrando pregunta:', preguntaActualIndex + 1);
        const preguntaActual = preguntasSeleccionadas[preguntaActualIndex];
        preguntaElement.textContent = preguntaActual.pregunta;

        const botonesRespuesta = respuestasElement.querySelectorAll('.respuesta');
        botonesRespuesta.forEach((boton, index) => {
            boton.textContent = preguntaActual.respuestas[index];
            boton.classList.remove('bg-teal-200', 'cursor-not-allowed');
            boton.disabled = false;
        });
        resultadoElement.style.display = 'none'; // Ocultar el feedback
        btnSiguiente.style.display = 'none';
    }

    // Función para seleccionar una respuesta
    function seleccionarRespuesta(index) {
        console.log('Respuesta seleccionada:', index);
        respuestaSeleccionadaIndex = index; // Guardar la respuesta seleccionada

        // Deshabilitar los otros botones y cambiar el cursor
        const botonesRespuesta = respuestasElement.querySelectorAll('.respuesta');
        botonesRespuesta.forEach((boton, i) => {
            if (i !== index) {
                boton.disabled = true;
                boton.classList.add('cursor-not-allowed');
            }
        });

        // Mostrar el feedback y el botón de siguiente pregunta
        mostrarResultado(index);
    }

    // Función para mostrar el resultado de la pregunta
    function mostrarResultado(indexSeleccionado) {
        const preguntaActual = preguntasSeleccionadas[preguntaActualIndex];
        const esCorrecta = indexSeleccionado === preguntaActual.correcta;

        let mensaje = esCorrecta ? '¡Correcto! ✅' : '¡Incorrecto! ❌';
        mensajeResultadoElement.textContent = mensaje;
        explicacionElement.textContent = preguntaActual.explicacion;
        resultadoElement.style.display = 'block';
        btnSiguiente.style.display = 'block'; // Mostrar el botón de siguiente pregunta
    }

    // Función para actualizar el marcador en la interfaz
    function actualizarMarcador() {
        puntuacionElement.textContent = puntuacion.toFixed(2);
        correctasElement.textContent = correctas;
        falladasElement.textContent = falladas;
    }

    // Función para actualizar la barra de progreso
    function actualizarBarraProgreso() {
        const porcentaje = ((preguntaActualIndex + 1) / numPreguntas) * 100;
        barraProgreso.style.width = porcentaje + '%';
        console.log('Actualizando barra de progreso:', porcentaje);
    }

    // Función para mostrar el resultado final
    function mostrarResultadoFinal() {
        examenElement.style.display = 'none';
        configuracionElement.style.display = 'none';
        resultadoFinalElement.style.display = 'block';
        btnVerResultados.style.display = 'none';

        let desglose = `Obtuviste ${correctas} respuestas correctas y ${falladas} respuestas incorrectas.<br><br>`;
        desglose += `Puntuación base: ${correctas} puntos.<br>`;

        if (dificultad === 'penaliza_05') {
            desglose += `Penalización por fallos: -${falladas * 0.5} puntos.<br>`;
        } else if (dificultad === 'penaliza_1') {
            desglose += `Penalización por fallos: -${falladas * 1} puntos.<br>`;
        }

        desglose += `Puntuación total: <span class="font-bold text-xl text-teal-400">${puntuacion.toFixed(2)} puntos</span>`;
        mensajeFinalElement.innerHTML = `¡Examen finalizado! 🎉<br><br>${desglose}`;
    }

    // Función para reiniciar el examen
    function reiniciarExamen() {
        resultadoFinalElement.style.display = 'none';
        configuracionElement.style.display = 'block';

        preguntasSeleccionadas = [];
        preguntaActualIndex = 0;
        respuestasSeleccionadas = [];
        puntuacion = 0;
        correctas = 0;
        falladas = 0;
        actualizarMarcador();
        actualizarBarraProgreso();
    }

    // Iniciar el examen
    btnComenzar.addEventListener('click', () => {
        numPreguntas = parseInt(numPreguntasInput.value);
        console.log('Número de preguntas del input:', numPreguntas);

        if (numPreguntas > preguntas.length || numPreguntas < 1) {
            alert(`Por favor, selecciona un número entre 1 y ${preguntas.length}.`);
            return;
        }

        dificultad = dificultadSelect.value;
        console.log('Dificultad seleccionada:', dificultad);

        seleccionarPreguntas(numPreguntas);
        mostrarPregunta();

        // Ocultar la configuración y mostrar el examen
        configuracionElement.style.display = 'none';
        examenElement.style.display = 'block';
        resultadoFinalElement.style.display = 'none';

        btnVerResultados.style.display = 'none';
    });

    // Evento para pasar a la siguiente pregunta
    btnSiguiente.addEventListener('click', () => {
        // Mover la lógica del marcador aquí
        const preguntaActual = preguntasSeleccionadas[preguntaActualIndex];
        const indexSeleccionado = respuestaSeleccionadaIndex;
        let esCorrecta = indexSeleccionado === preguntaActual.correcta;

        if (esCorrecta) {
            puntuacion++;
            correctas++;
        } else {
            falladas++;
            if (dificultad === 'penaliza_05') {
                puntuacion -= 0.5;
            } else if (dificultad === 'penaliza_1') {
                puntuacion -= 1;
            }
        }
        actualizarMarcador();

        preguntaActualIndex++;
        console.log('preguntaActualIndex después de click en btnSiguiente:', preguntaActualIndex);

        if (preguntaActualIndex < preguntasSeleccionadas.length) {
            mostrarPregunta();
            actualizarBarraProgreso();
        } else {
            btnSiguiente.style.display = 'none';
            btnVerResultados.style.display = 'block'; // Mostrar el botón "Ver Resultados"
            resultadoElement.style.display = 'none'; // Ocultar el feedback
            preguntaElement.textContent = "¡Examen finalizado! 🎉";
            respuestasElement.style.display = 'none';

        }
    });

    // Evento para ver los resultados finales
    btnVerResultados.addEventListener('click', () => {
        mostrarResultadoFinal();
    });

    // Delegación de eventos en el contenedor de respuestas
    respuestasElement.addEventListener('click', (event) => {
        if (event.target.classList.contains('respuesta')) {
            const index = parseInt(event.target.dataset.index);
            seleccionarRespuesta(index);
        }
    });

    // Evento para reiniciar el examen
    btnReiniciar.addEventListener('click', reiniciarExamen);

    // Ocultar el examen y el resultado final al cargar la página
    examenElement.style.display = 'none';
    resultadoFinalElement.style.display = 'none';
    resultadoElement.style.display = 'none';
});
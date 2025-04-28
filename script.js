document.addEventListener('DOMContentLoaded', () => {
    // --- Selectores del DOM ---
    const numPreguntasInput = document.getElementById('numPreguntas');
    const btnComenzar = document.getElementById('btnComenzar');
    const preguntaElement = document.getElementById('pregunta');
    const temaElement = document.getElementById('tema');
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
    const selectBloque = document.getElementById('selectBloque');
    const selectTema = document.getElementById('selectTema');
    const maxPreguntasInfo = document.getElementById('maxPreguntasInfo');

    // --- Variables del juego ---
    let todasLasPreguntas = [];
    let preguntasFiltradasActuales = [];
    let preguntasSeleccionadas = [];
    let preguntaActualIndex = 0;
    let numPreguntasExamen = 0; // Se establecerá después de cargar
    let respuestasSeleccionadas = [];
    let puntuacion = 0;
    let correctas = 0;
    let falladas = 0;
    let dificultad = 'normal';
    let respuestaSeleccionadaIndex = null; // Para saber si ya se respondió la actual

    // --- Cargar preguntas ---
    fetch('preguntas.json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data)) throw new Error("El archivo JSON no es un array.");
            todasLasPreguntas = data;
            console.log('Preguntas cargadas:', todasLasPreguntas.length);

            if (todasLasPreguntas.length > 0) {
                populateBloques(); // Llena bloques y, en cascada, temas y filtros iniciales
                // Establecer el valor inicial del input al total de preguntas
                numPreguntasExamen = todasLasPreguntas.length;
                numPreguntasInput.value = numPreguntasExamen;
                updateMaxPreguntasInfo(); // Actualiza el max y la info inicial
                btnComenzar.disabled = false; // Habilitar botón
            } else {
                handleLoadingError("No se encontraron preguntas en el archivo.");
            }
        })
        .catch(error => {
            handleLoadingError(`Error al cargar preguntas: ${error.message}`);
        });

    function handleLoadingError(message) {
        console.error(message);
        maxPreguntasInfo.textContent = message;
        configuracionElement.innerHTML = `<p class="text-red-500 text-center font-bold">${message}<br>Por favor, revisa 'preguntas.json' y recarga la página.</p>`;
        btnComenzar.disabled = true;
        numPreguntasInput.disabled = true;
    }

    // --- Funciones de Filtrado y Población de Desplegables ---
    function populateBloques() {
        while (selectBloque.options.length > 1) selectBloque.remove(1);
        const bloques = [...new Set(todasLasPreguntas.map(p => p.bloque).filter(b => b))].sort();
        bloques.forEach(bloque => {
            const option = document.createElement('option');
            option.value = bloque;
            option.textContent = bloque;
            selectBloque.appendChild(option);
        });
        populateTemas('TODOS'); // Llamada inicial para temas
    }

    function populateTemas(selectedBloque = 'TODOS') {
        while (selectTema.options.length > 1) selectTema.remove(1);
        selectTema.value = 'TODOS';

        let temasSet = new Set();
        const preguntasDelBloque = (selectedBloque === 'TODOS')
            ? todasLasPreguntas
            : todasLasPreguntas.filter(p => p.bloque === selectedBloque);

        preguntasDelBloque.forEach(p => { if (p.tema) temasSet.add(p.tema) });

        const temas = [...temasSet].sort();
        temas.forEach(tema => {
            const option = document.createElement('option');
            option.value = tema;
            option.textContent = tema;
            selectTema.appendChild(option);
        });
        updateFilteredQuestions(); // Actualizar filtro general tras poblar temas
    }

    function updateFilteredQuestions() {
        if (!Array.isArray(todasLasPreguntas)) return; // Seguridad

        const selectedBloque = selectBloque.value;
        const selectedTema = selectTema.value;

        preguntasFiltradasActuales = todasLasPreguntas.filter(pregunta => {
            if (!pregunta || typeof pregunta.bloque === 'undefined' || typeof pregunta.tema === 'undefined') return false;
            const matchBloque = selectedBloque === 'TODOS' || pregunta.bloque === selectedBloque;
            const matchTema = selectedTema === 'TODOS' || pregunta.tema === selectedTema;
            return matchBloque && matchTema;
        });

        console.log(`Preguntas filtradas: ${preguntasFiltradasActuales.length} (Bloque: ${selectedBloque}, Tema: ${selectedTema})`);
        updateMaxPreguntasInfo();
    }

    function updateMaxPreguntasInfo() {
        const max = preguntasFiltradasActuales.length;
        maxPreguntasInfo.textContent = `(${max} pregunta${max !== 1 ? 's' : ''} disponible${max !== 1 ? 's' : ''})`;
        numPreguntasInput.max = max > 0 ? max : 1;
        numPreguntasInput.min = 1;

        let currentValue = parseInt(numPreguntasInput.value) || 1;

        if (max === 0) {
            numPreguntasInput.value = 1;
            numPreguntasInput.disabled = true;
            btnComenzar.disabled = true;
            maxPreguntasInfo.textContent += " - No se puede iniciar.";
        } else {
            numPreguntasInput.disabled = false;
            // Ajustar el valor si excede el máximo actual
            if (currentValue > max) {
                numPreguntasInput.value = max;
            }
            // Asegurar que no sea menor que 1
            else if (currentValue < 1) {
                 numPreguntasInput.value = 1;
            }
            // Si es válido, se mantiene el valor actual

            btnComenzar.disabled = false;
        }
    }

    // --- Funciones del Examen ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function seleccionarPreguntasParaExamen(cantidad) {
        const cantidadReal = Math.min(cantidad, preguntasFiltradasActuales.length);
        shuffleArray(preguntasFiltradasActuales);
        preguntasSeleccionadas = preguntasFiltradasActuales.slice(0, cantidadReal);

        // Resetear estado del examen
        preguntaActualIndex = 0;
        respuestasSeleccionadas = new Array(preguntasSeleccionadas.length).fill(null);
        respuestaSeleccionadaIndex = null;
        puntuacion = 0;
        correctas = 0;
        falladas = 0;
        actualizarMarcador();
        barraProgreso.style.width = '0%'; // Resetear barra

        console.log('Número de preguntas para el examen:', preguntasSeleccionadas.length);
    }

    function mostrarPregunta() {
         // Asegurar que los elementos base del examen existen antes de manipularlos
         if (!preguntaElement || !temaElement || !respuestasElement) {
             console.error("Error crítico: Elementos del DOM para el examen no encontrados.");
             examenElement.innerHTML = `<p class="text-red-500 text-center">Error al mostrar la pregunta. Faltan elementos.</p>`;
             // Podríamos intentar reiniciar o simplemente detener
             return;
         }

        if (preguntasSeleccionadas.length === 0 || preguntaActualIndex >= preguntasSeleccionadas.length) {
            console.error("Intento de mostrar pregunta inválida:", preguntaActualIndex, preguntasSeleccionadas);
            finalizarExamenUI(true); // Llamar a finalizar con indicador de error
            return;
        }

        console.log('Mostrando pregunta:', preguntaActualIndex + 1, 'de', preguntasSeleccionadas.length);
        const preguntaActual = preguntasSeleccionadas[preguntaActualIndex];

        // Validar la estructura de la pregunta actual
        if (!preguntaActual || !preguntaActual.pregunta || !Array.isArray(preguntaActual.respuestas) || typeof preguntaActual.correcta === 'undefined') {
            console.error("Estructura de pregunta inválida:", preguntaActualIndex, preguntaActual);
            // Omitir esta pregunta y pasar a la siguiente
            preguntaActualIndex++;
            if (preguntaActualIndex < preguntasSeleccionadas.length) {
                mostrarPregunta(); // Intentar mostrar la siguiente
            } else {
                finalizarExamenUI(true); // Fin con error si era la última
            }
            return;
        }

        preguntaElement.textContent = preguntaActual.pregunta;
        temaElement.textContent = `${preguntaActual.bloque || 'Sin Bloque'} - ${preguntaActual.tema || 'Sin Tema'}`;

        const botonesRespuesta = respuestasElement.querySelectorAll('.respuesta');

        // Limpiar y configurar botones de respuesta
        botonesRespuesta.forEach((boton, index) => {
            if (index < preguntaActual.respuestas.length) {
                boton.textContent = preguntaActual.respuestas[index];
                boton.style.display = 'block';
                boton.disabled = false;
                boton.classList.remove('btn-verde', 'btn-rojo', 'cursor-not-allowed', 'opacity-60');
                boton.dataset.index = index;
            } else {
                boton.style.display = 'none'; // Ocultar botones sobrantes
            }
        });

        resultadoElement.style.display = 'none'; // Ocultar resultado previo
        btnSiguiente.style.display = 'none'; // Ocultar botón siguiente
        respuestasElement.style.display = 'grid'; // Asegurar visibilidad
        respuestaSeleccionadaIndex = null; // Resetear selección para la nueva pregunta

        actualizarBarraProgreso(); // Actualizar barra al mostrar nueva pregunta
    }

    function seleccionarRespuesta(index) {
        if (respuestaSeleccionadaIndex !== null) return; // Evitar selección múltiple

        respuestaSeleccionadaIndex = index; // Marcar que se ha respondido

        // Deshabilitar botones
        const botonesRespuesta = respuestasElement.querySelectorAll('.respuesta');
        botonesRespuesta.forEach((boton) => {
            boton.disabled = true;
            boton.classList.add('cursor-not-allowed', 'opacity-60');
        });

        mostrarResultado(index); // Mostrar si fue correcta/incorrecta
    }

    function mostrarResultado(indexSeleccionado) {
        if (!preguntasSeleccionadas[preguntaActualIndex]) return; // Seguridad

        const preguntaActual = preguntasSeleccionadas[preguntaActualIndex];
        const esCorrecta = indexSeleccionado === preguntaActual.correcta;

        // Actualizar puntuación y contadores
        if (esCorrecta) {
            puntuacion++;
            correctas++;
        } else {
            falladas++;
            if (dificultad === 'penaliza_05') puntuacion -= 0.5;
            else if (dificultad === 'penaliza_1') puntuacion -= 1;
        }
        actualizarMarcador(); // Actualizar UI del marcador

        // Mostrar sección de resultado con mensaje y explicación
        mensajeResultadoElement.textContent = esCorrecta ? '¡Correcto! ✅' : '¡Incorrecto! ❌';
        explicacionElement.textContent = (preguntaActual.explicacion && preguntaActual.explicacion.trim() !== '') ? preguntaActual.explicacion : '';
        resultadoElement.style.display = 'block';

        // Estilar botones para feedback visual
        const botonesRespuesta = respuestasElement.querySelectorAll('.respuesta');
        botonesRespuesta.forEach((boton, index) => {
            if (boton.style.display !== 'none') {
                if (index === preguntaActual.correcta) {
                    boton.classList.add('btn-verde'); // Marcar la correcta
                }
                if (index === indexSeleccionado && !esCorrecta) {
                    boton.classList.add('btn-rojo'); // Marcar la seleccionada incorrecta
                }
            }
        });

        // Mostrar botón Siguiente/Finalizar
        btnSiguiente.style.display = 'block';
        btnSiguiente.textContent = (preguntaActualIndex === preguntasSeleccionadas.length - 1)
            ? 'Finalizar examen'
            : 'Siguiente pregunta';

        actualizarBarraProgreso(); // Actualizar progreso tras responder
    }

    function actualizarMarcador() {
        puntuacionElement.textContent = puntuacion.toFixed(2);
        correctasElement.textContent = correctas;
        falladasElement.textContent = falladas;
    }

    function actualizarBarraProgreso() {
        const preguntasCompletadas = preguntaActualIndex + (respuestaSeleccionadaIndex !== null ? 1 : 0);
        const totalPreguntas = preguntasSeleccionadas.length;
        const porcentaje = totalPreguntas > 0 ? (preguntasCompletadas / totalPreguntas) * 100 : 0;
        barraProgreso.style.width = Math.min(100, porcentaje) + '%';
    }

    function mostrarResultadoFinal() {
        examenElement.style.display = 'none';
        configuracionElement.style.display = 'none';
        resultadoFinalElement.style.display = 'block';
        btnVerResultados.style.display = 'none'; // Ocultar botón de ver resultados

        const numRealizadas = preguntasSeleccionadas.length; // Número real de preguntas hechas
        let desglose = `Realizaste ${numRealizadas} pregunta${numRealizadas !== 1 ? 's' : ''}.<br>`;
        desglose += `Obtuviste ${correctas} correctas y ${falladas} incorrectas.<br><br>`;
        desglose += `Puntuación base (correctas): ${correctas} puntos.<br>`;

        let penalizacionTotal = 0;
        if (dificultad === 'penaliza_05') {
            penalizacionTotal = falladas * 0.5;
            desglose += `Penalización (-0.5 c/u): -${penalizacionTotal.toFixed(2)} puntos.<br>`;
        } else if (dificultad === 'penaliza_1') {
             penalizacionTotal = falladas * 1;
            desglose += `Penalización (-1 c/u): -${penalizacionTotal.toFixed(2)} puntos.<br>`;
        } else {
             desglose += `Sin penalización por fallos.<br>`;
        }

        // --- CORRECCIÓN EN CÁLCULO NOTA SOBRE 10 ---
        // La puntuación máxima posible es igual al número de preguntas realizadas (si no hubiera penalización).
        // La nota sobre 10 es la puntuación obtenida dividida por el número de preguntas realizadas, y luego escalada a 10.
        // Se usa Math.max(0, puntuacion) para evitar notas negativas si la penalización es muy alta.
        const notaSobre10 = numRealizadas > 0 ? (Math.max(0, puntuacion) / numRealizadas) * 10 : 0;
        // --- FIN CORRECCIÓN ---

        desglose += `<br>Puntuación final: <span class="font-bold text-xl text-teal-400">${puntuacion.toFixed(2)} puntos</span>`;
        // Mostrar nota sobre 10
        desglose += `<br>Nota (sobre 10): <span class="font-bold text-lg ${notaSobre10 >= 5 ? 'text-green-400' : 'text-red-400'}">${notaSobre10.toFixed(2)}</span>`;


        mensajeFinalElement.innerHTML = `¡Examen finalizado! 🎉<br><br>${desglose}`;
    }

    function finalizarExamenUI(conError = false) {
        console.log("Finalizando UI del examen", conError ? "(con error)" : "");
        btnSiguiente.style.display = 'none';
        resultadoElement.style.display = 'none'; // Ocultar último resultado
        respuestasElement.style.display = 'none';
        temaElement.textContent = '';

        if (conError) {
            preguntaElement.textContent = "Error al finalizar el examen.";
            btnVerResultados.style.display = 'none'; // No mostrar si hubo error
             // Podríamos añadir un botón para reiniciar directamente
        } else {
            preguntaElement.textContent = "¡Examen finalizado! 🎉";
            btnVerResultados.style.display = 'block'; // Mostrar botón para ver desglose
        }
        // Asegurar que la barra esté al 100% al finalizar (si no hubo error grave antes)
        if (preguntasSeleccionadas.length > 0) barraProgreso.style.width = '100%';
    }

    function reiniciarExamen() {
        // Ocultar/Mostrar secciones
        resultadoFinalElement.style.display = 'none';
        examenElement.style.display = 'none';
        configuracionElement.style.display = 'block'; // Mostrar config

        // Restaurar estado inicial de botones de control
        btnSiguiente.style.display = 'none';
        btnVerResultados.style.display = 'none';

        // Resetear variables de estado del juego
        preguntasSeleccionadas = [];
        preguntaActualIndex = 0;
        respuestasSeleccionadas = [];
        respuestaSeleccionadaIndex = null;
        puntuacion = 0;
        correctas = 0;
        falladas = 0;
        actualizarMarcador(); // Poner marcadores a 0 en UI

        // Restablecer filtros a "TODOS" y actualizar preguntas disponibles
        selectBloque.value = 'TODOS';
        // Llamar a populateTemas actualiza en cascada los temas y las preguntas filtradas
        populateTemas('TODOS');
        // El valor inicial de numPreguntas se establecerá/ajustará en updateMaxPreguntasInfo

        barraProgreso.style.width = '0%'; // Resetear barra visualmente
        console.log("Examen reiniciado, volviendo a configuración.");
    }

     // --- Event Listeners ---
    selectBloque.addEventListener('change', (event) => {
         populateTemas(event.target.value);
    });
    selectTema.addEventListener('change', updateFilteredQuestions);

    btnComenzar.addEventListener('click', () => {
        numPreguntasExamen = parseInt(numPreguntasInput.value) || 1;

        if (preguntasFiltradasActuales.length === 0) {
             alert('No hay preguntas disponibles para los filtros seleccionados.');
             return;
        }
        // Asegurar que el número es válido y corregir si es necesario
        numPreguntasExamen = Math.min(numPreguntasExamen, preguntasFiltradasActuales.length);
        numPreguntasExamen = Math.max(1, numPreguntasExamen);
        numPreguntasInput.value = numPreguntasExamen;

        dificultad = dificultadSelect.value;
        seleccionarPreguntasParaExamen(numPreguntasExamen);

        if (preguntasSeleccionadas.length > 0) {
            configuracionElement.style.display = 'none';
            resultadoFinalElement.style.display = 'none';
            examenElement.style.display = 'block'; // Mostrar sección examen
             // Asegurar visibilidad inicial de elementos dentro de examen
             preguntaElement.style.display = 'block';
             temaElement.style.display = 'block';
             respuestasElement.style.display = 'grid';
             resultadoElement.style.display = 'none';
             btnSiguiente.style.display = 'none';
             btnVerResultados.style.display = 'none';

            mostrarPregunta(); // Mostrar la primera pregunta
        } else {
             alert("No se pudieron seleccionar preguntas. Revisa los filtros.");
        }
    });

    btnSiguiente.addEventListener('click', () => {
        // Ya no se calcula puntuación aquí
        preguntaActualIndex++;
        if (preguntaActualIndex < preguntasSeleccionadas.length) {
            mostrarPregunta();
        } else {
            finalizarExamenUI(); // Llama a la función que gestiona la UI del final
        }
    });

    btnVerResultados.addEventListener('click', mostrarResultadoFinal);

    respuestasElement.addEventListener('click', (event) => {
        if (event.target.classList.contains('respuesta') && !event.target.disabled) {
            const index = parseInt(event.target.dataset.index);
            if (!isNaN(index)) seleccionarRespuesta(index);
        }
    });

    btnReiniciar.addEventListener('click', reiniciarExamen);

});
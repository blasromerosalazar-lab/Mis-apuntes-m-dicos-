let db = JSON.parse(localStorage.getItem('mednotes_vUCV')) || { materias: [], recientes: [] };
let seccionActual = 'reciente'; 
let materiaSeleccionada = null; 
let notaActiva = null;
let timerPresion; 
let zIndexGlobal = 100;

function cambiarSeccion(tipo) {
    seccionActual = tipo; 
    materiaSeleccionada = null;
    document.getElementById('breadcrumb').style.display = 'none';
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    
    const idx = tipo === 'reciente' ? 0 : 1;
    document.querySelectorAll('.nav-item')[idx].classList.add('active');
    
    document.getElementById('view-title').innerText = tipo === 'reciente' ? "Reciente" : "Materias";
    document.getElementById('add-btn').style.display = tipo === 'materias' ? 'block' : 'none';
    renderizar();
}

function renderizar() {
    const container = document.getElementById('content-list');
    container.innerHTML = "";
    
    if (seccionActual === 'reciente') {
        if (db.recientes.length === 0) {
            container.innerHTML = '<div style="text-align:center; margin-top:100px; color:gray;">No hay actividad.</div>';
        } else {
            db.recientes.slice().reverse().forEach(r => {
                container.innerHTML += `<div class="card" onclick="abrirLienzo()"><h3>${r.titulo}</h3><span>📄</span></div>`;
            });
        }
    } else if (!materiaSeleccionada) {
        db.materias.forEach(m => {
            container.innerHTML += `<div class="card" onclick="verTemasMateria('${m.id}')"><h3>${m.nombre}</h3><span>📁</span></div>`;
        });
    } else {
        const mat = db.materias.find(m => m.id == materiaSeleccionada);
        mat.temas.forEach(t => {
            container.innerHTML += `<div class="card" onclick="abrirLienzo()"><h3>${t}</h3><span>📄</span></div>`;
        });
    }
}

function verTemasMateria(id) {
    materiaSeleccionada = id;
    const mat = db.materias.find(m => m.id == id);
    document.getElementById('view-title').innerText = mat.nombre;
    document.getElementById('breadcrumb').style.display = 'flex';
    renderizar();
}

function volverAMaterias() { 
    materiaSeleccionada = null; 
    cambiarSeccion('materias'); 
}

function ejecutarAccionMas() {
    const nom = prompt(materiaSeleccionada ? "Nombre del Tema:" : "Nombre de la Materia:");
    if(nom) {
        if(!materiaSeleccionada) {
            db.materias.push({ id: Date.now(), nombre: nom, temas: [] });
        } else {
            const mat = db.materias.find(m => m.id == materiaSeleccionada);
            mat.temas.push(nom);
            db.recientes.push({ titulo: nom });
        }
        localStorage.setItem('mednotes_vUCV', JSON.stringify(db));
        renderizar();
    }
}

function abrirLienzo() { 
    document.getElementById('main-view').style.display = 'none'; 
    document.getElementById('canvas-view').style.display = 'block'; 
}

function cerrarLienzo() { 
    document.getElementById('main-view').style.display = 'block'; 
    document.getElementById('canvas-view').style.display = 'none'; 
}

function aplicarInteract(el) {
    interact(el)
      .draggable({
        allowFrom: '.handle',
        inertia: true,
        listeners: {
          move(event) {
            const target = event.target;
            const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
            const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
            
            target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);
          }
        }
      })
      .resizable({
        handle: '.resize-dot',
        edges: { right: true, bottom: true, left: true, top: true },
        listeners: {
          move(event) {
            const target = event.target;
            if (!target.classList.contains('selected')) return;

            let x = (parseFloat(target.getAttribute('data-x')) || 0);
            let y = (parseFloat(target.getAttribute('data-y')) || 0);
            
            target.style.width = event.rect.width + 'px';
            target.style.height = event.rect.height + 'px';
            
            x += event.deltaRect.left;
            y += event.deltaRect.top;
            
            target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);
          }
        }
      });
}

function crearNotaLienzo() {
    const div = document.createElement('div');
    div.className = 'nota';
    div.style.left = "150px"; 
    div.style.top = "150px";
    div.innerHTML = `
        <div class="handle">⠿ MOVER</div>
        <textarea placeholder="Escribir..."></textarea>
        <div class="resize-dot dot-br"></div>
    `;
    
    div.addEventListener('pointerdown', (e) => {
        div.style.zIndex = ++zIndexGlobal;
        if (!div.classList.contains('selected')) {
            timerPresion = setTimeout(() => {
                deseleccionarTodo();
                notaActiva = div;
                div.classList.add('selected');
                document.getElementById('delete-tool').classList.add('enabled');
            }, 1000); 
        }
    });

    div.addEventListener('pointermove', () => {
        if (!div.classList.contains('selected') && timerPresion) clearTimeout(timerPresion);
    });

    div.addEventListener('pointerup', () => clearTimeout(timerPresion));

    document.getElementById('canvas-bg').appendChild(div);
    aplicarInteract(div);
}

function deseleccionarTodo() {
    if (notaActiva) notaActiva.classList.remove('selected');
    notaActiva = null;
    document.getElementById('delete-tool').classList.remove('enabled');
}

function eliminarNota() { 
    if (notaActiva) { 
        notaActiva.remove(); 
        deseleccionarTodo(); 
    } 
}

window.onload = () => {
    renderizar();
    interact('#canvas-view').draggable({
        ignoreFrom: '.nota, textarea, .handle',
        listeners: {
            move(event) {
                if (notaActiva) return;
                const bg = document.getElementById('canvas-bg');
                const x = (parseFloat(bg.getAttribute('data-x')) || 0) + event.dx;
                const y = (parseFloat(bg.getAttribute('data-y')) || 0) + event.dy;
                bg.style.transform = `translate(${x}px, ${y}px)`;
                bg.setAttribute('data-x', x); 
                bg.setAttribute('data-y', y);
            }
        }
    });
};

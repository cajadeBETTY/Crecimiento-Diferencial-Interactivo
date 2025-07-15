/* style.css */
@import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap');

body {
  margin: 0;
  padding: 0;
  margin-left: 300px; /* espacio para panel */
  font-family: 'Roboto Mono', monospace;
  font-size: 12px;
  background: #f9f9f9;
}

#ui {
  position: fixed;
  top: 0;
  left: 0;
  width: 300px;
  height: 100vh;
  overflow-y: auto;
  background: #fff;
  border-right: 1px solid #ddd;
  padding: 10px;
  box-sizing: border-box;
  z-index: 100;
}

/* TABS NAV */
#tabs {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}

.tabBtn {
  background: none;
  border: none;
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.2s;
  font-weight: 500;
}
.tabBtn:hover { background: rgba(0,0,0,0.05); }
.tabBtn.active {
  background: #f0f0f0;
  border-left: 3px solid #3498db;
  margin-left: -3px;
}

/* TAB CONTENT */
.tabContent {
  display: none;
  margin-bottom: 15px;
}
#tabContent1 { display: block; }

/* Fieldsets */
fieldset { margin-bottom: 12px; padding: 10px; border: 1px solid #ddd; }
legend { font-weight: bold; }

label { display: block; margin-bottom: 6px; }
.subcampo { margin: 6px 0; }
.titulo-seccion { font-size: 1em; font-weight: bold; margin: 6px 0; }

/* Canvas occupies rest */
canvas { display: block; }

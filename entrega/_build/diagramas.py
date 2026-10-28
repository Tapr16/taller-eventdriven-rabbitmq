"""Genera los diagramas de arquitectura (Graphviz) para el informe y las diapositivas."""
import pathlib
import subprocess

OUT = pathlib.Path(__file__).resolve().parent.parent / "diagramas"
OUT.mkdir(exist_ok=True)

NARANJA = "#F26B1D"   # RabbitMQ
AZUL = "#2496ED"      # Docker
OSCURO = "#1F2A37"
LENG = {"Python": "#3776AB", "Java": "#B07219", "Node.js": "#3C873A", "Go": "#00ADD8"}

COMUN = f'''
  graph [fontname="Arial", fontsize=13, bgcolor="white", pad=0.3, nodesep=0.25, ranksep=0.6, compound=true];
  node  [fontname="Arial", fontsize=12, shape=box, style="rounded,filled", color="{OSCURO}", penwidth=1.2];
  edge  [fontname="Arial", fontsize=10, color="#555555", penwidth=1.3];
'''

PROD = [("pp", "Python", "Prod. órdenes"), ("pj", "Java", "Prod. pagos"),
        ("pn", "Node.js", "Prod. inventario"), ("pg", "Go", "Prod. envíos")]
CONS = [("cp", "Python", "Cons. notificaciones"), ("cj", "Java", "Cons. facturación"),
        ("cn", "Node.js", "Cons. auditoría + UI"), ("cg", "Go", "Cons. analítica")]
COLAS = {"cp": "q.notificaciones", "cj": "q.facturacion", "cn": "q.auditoria", "cg": "q.analitica"}


def nodo(i, lang, label):
    c = LENG[lang]
    return f'{i} [label="{label}\\n({lang})", fillcolor="{c}", fontcolor="white", color="{c}"];'


def broker(nombre="Nodo"):
    colas = "\n".join(
        f'    "{q}" [shape=box, style="filled", fillcolor="#FFE3D1", color="{NARANJA}", fontsize=11];'
        for q in COLAS.values())
    return f'''
    ex [label="exchange topic\\ntienda.eventos", shape=hexagon, style="filled", fillcolor="{NARANJA}", fontcolor="white", color="{NARANJA}"];
{colas}
    ex -> "q.notificaciones" [label="orden.creada\\nenvio.*", fontsize=9];
    ex -> "q.facturacion"   [label="pago.*", fontsize=9];
    ex -> "q.auditoria"     [label="#", fontsize=9];
    ex -> "q.analitica"     [label="orden.* inv.* pago.*", fontsize=9];
'''


def cluster(nombre, titulo, cuerpo, color=AZUL, fill="#EAF4FD"):
    return f'''
  subgraph cluster_{nombre} {{
    label="{titulo}"; labeljust="l"; fontsize=14; fontcolor="{OSCURO}";
    style="rounded,filled"; color="{color}"; fillcolor="{fill}"; penwidth=2;
{cuerpo}
  }}'''


def render(nombre, dot):
    src = OUT / f"{nombre}.dot"
    src.write_text(dot, encoding="utf-8")
    subprocess.run(["dot", "-Tpng", "-Gdpi=200", str(src), "-o", str(OUT / f"{nombre}.png")], check=True)
    src.unlink()


def flechas(prods, conss):
    s = "\n".join(f'  {p} -> ex [label="AMQP", fontsize=9];' for p in prods)
    s += "\n" + "\n".join(f'  "{COLAS[c]}" -> {c};' for c in conss)
    return s


# ---------------- Escenario 1 ----------------
prods = "\n".join("    " + nodo(*p) for p in PROD)
conss = "\n".join("    " + nodo(*c) for c in CONS)
dot1 = f'''digraph E1 {{ rankdir=LR; {COMUN}
{cluster("n", "Nodo único — red interna de Docker (esc1-centralizado)",
  cluster("p", "Productores", prods, "#999999", "white") +
  cluster("b", "RabbitMQ (rabbitmq:3-management) :5672 / :15672", broker(), NARANJA, "#FFF4EC") +
  cluster("c", "Consumidores", conss, "#999999", "white"))}
{flechas([p[0] for p in PROD], [c[0] for c in CONS])}
}}'''
render("escenario1", dot1)

# ---------------- Escenarios 2 y 3 (vista por nodo) ----------------
BROKER_HTML = f'''<<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="6" COLOR="{NARANJA}">
<TR><TD BGCOLOR="{NARANJA}"><FONT COLOR="white"><B>RabbitMQ</B></FONT></TD></TR>
<TR><TD BGCOLOR="#FFE3D1">exchange topic <B>tienda.eventos</B></TD></TR>
<TR><TD BGCOLOR="white" ALIGN="LEFT">q.notificaciones  ← orden.creada, envio.*<BR ALIGN="LEFT"/>q.facturacion  ← pago.*<BR ALIGN="LEFT"/>q.auditoria  ← #<BR ALIGN="LEFT"/>q.analitica  ← orden.*, inventario.*, pago.*<BR ALIGN="LEFT"/></TD></TR>
<TR><TD BGCOLOR="white"><FONT POINT-SIZE="10">AMQP :5672  ·  panel :15672</FONT></TD></TR>
</TABLE>>'''


def caja(i, titulo, items, color):
    filas = "".join(f'<TR><TD ALIGN="LEFT">{t}</TD></TR>' for t in items)
    return (f'{i} [shape=plaintext, style="", label=<<TABLE BORDER="1" COLOR="{color}" CELLBORDER="0" CELLSPACING="0" CELLPADDING="4" BGCOLOR="white">'
            f'<TR><TD BGCOLOR="{color}"><FONT COLOR="white"><B>{titulo}</B></FONT></TD></TR>{filas}</TABLE>>];')


P_ALL = ["órdenes (Python)", "pagos (Java)", "inventario (Node.js)", "envíos (Go)"]
C_ALL = ["notificaciones (Python)", "facturación (Java)", "auditoría + UI :8080 (Node.js)", "analítica (Go)"]
LAN = f'color="{NARANJA}", penwidth=2, fontcolor="{OSCURO}"'

NL = "\n    "
BROKER_NODE = f'    broker [shape=plaintext, style="", label={BROKER_HTML}];'
n1_e2 = "    " + caja("prod", "4 Productores", P_ALL, OSCURO) + NL + caja("cons", "4 Consumidores", C_ALL, OSCURO)
dot2 = f"""digraph E2 {{ rankdir=LR; {COMUN}
{cluster("n1", "Nodo 1 — PC B 10.6.62.137 (docker-compose: 8 servicios)", n1_e2)}
{cluster("n2", "Nodo 2 — PC A 10.6.62.18 (docker-compose: broker)", BROKER_NODE, NARANJA, "#FFF4EC")}
  prod -> broker [label="publish\nAMQP / LAN", {LAN}];
  broker -> cons [label="deliver\n(basic.consume)", {LAN}, constraint=false];
}}"""
render("escenario2", dot2)

n1_e3 = "    " + caja("p1", "Productores", P_ALL[:2], LENG["Python"]) + NL + caja("c1", "Consumidores", C_ALL[:2], LENG["Python"])
n2_e3 = "    " + caja("c2", "Consumidores", C_ALL[2:], LENG["Node.js"]) + NL + caja("p2", "Productores", P_ALL[2:], LENG["Node.js"])
dot3 = f"""digraph E3 {{ rankdir=LR; {COMUN}
{cluster("n1", "Nodo 1 — Python + Java (10.6.62.18)", n1_e3)}
{cluster("n3", "Nodo 3 — broker (10.6.62.18)", BROKER_NODE, NARANJA, "#FFF4EC")}
{cluster("n2", "Nodo 2 — Node.js + Go (10.6.62.137)", n2_e3, "#3C873A", "#EEF7EE")}
  p1 -> broker [label="publish", {LAN}];
  broker -> c1 [label="deliver", {LAN}, constraint=false];
  broker -> c2 [label="deliver", {LAN}];
  p2 -> broker [label="publish", {LAN}, constraint=false];
}}"""
render("escenario3", dot3)

# ---------------- Topologia AMQP ----------------
dot4 = f'''digraph T {{ rankdir=LR; {COMUN}
  node [fillcolor="white"];
  pp [label="orden.creada", fillcolor="{LENG['Python']}", fontcolor="white", color="{LENG['Python']}"];
  pj [label="pago.aprobado\\npago.rechazado", fillcolor="{LENG['Java']}", fontcolor="white", color="{LENG['Java']}"];
  pn [label="inventario.actualizado\\ninventario.agotado", fillcolor="{LENG['Node.js']}", fontcolor="white", color="{LENG['Node.js']}"];
  pg [label="envio.despachado\\nenvio.entregado", fillcolor="{LENG['Go']}", fontcolor="white", color="{LENG['Go']}"];
{broker()}
  pp -> ex; pj -> ex; pn -> ex; pg -> ex;
}}'''
render("topologia-amqp", dot4)
print("ok", sorted(p.name for p in OUT.iterdir()))

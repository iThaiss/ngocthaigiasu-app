import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "math-diagrams"
SRC = OUT / "tikz"
BUILD = ROOT / ".tmp-tikz"

PREAMBLE = r"""\documentclass[tikz,border=6pt]{standalone}
\usepackage{amsmath}
\usetikzlibrary{arrows.meta,calc,patterns,positioning}
\begin{document}
"""

POSTAMBLE = r"""
\end{document}
"""

DIAGRAMS = {
    "limit-sequence": r"""
\begin{tikzpicture}[>=Latex,scale=1]
  \draw[->] (0,0) -- (6.2,0) node[right] {$n$};
  \draw[->] (0,-0.2) -- (0,3.2) node[above] {$u_n$};
  \draw[dashed,red] (0,0.55) -- (6,0.55) node[right] {$L=0$};
  \foreach \x/\y/\lab in {0.7/2.65/1,1.5/1.75/2,2.3/1.25/3,3.1/0.98/4,3.9/0.82/5,4.7/0.70/6,5.5/0.63/7} {
    \fill[blue] (\x,\y) circle (2pt);
    \draw[dashed,blue!40] (\x,0) node[below] {$\lab$} -- (\x,\y);
  }
  \draw[blue,thick] plot[smooth] coordinates {(0.7,2.65) (1.5,1.75) (2.3,1.25) (3.1,0.98) (3.9,0.82) (4.7,0.70) (5.5,0.63)};
  \node[align=left,blue] at (3.3,2.55) {$u_n=\frac{1}{n}$\\$u_n\to 0$};
\end{tikzpicture}
""",
    "limit-two-sided": r"""
\begin{tikzpicture}[>=Latex,scale=1]
  \draw[->] (-3.2,0) -- (3.4,0) node[right] {$x$};
  \draw[->] (0,-0.4) -- (0,3.3) node[above] {$y$};
  \draw[dashed,red] (1,-0.2) node[below] {$x_0$} -- (1,2.55);
  \draw[dashed,red] (-3,1.7) -- (3.2,1.7) node[right] {$L$};
  \draw[domain=-2.6:0.88,smooth,variable=\x,blue,thick] plot ({\x},{1.7+0.22*(\x-1)*(\x-1)});
  \draw[domain=1.12:3.0,smooth,variable=\x,blue,thick] plot ({\x},{1.7+0.30*(\x-1)});
  \draw[->,blue!70,thick] (-1.4,2.55) -- (0.75,1.78);
  \draw[->,blue!70,thick] (2.65,2.20) -- (1.22,1.78);
  \fill[white,draw=blue,thick] (1,1.7) circle (2.4pt);
  \node[align=center] at (-1.5,0.65) {$x\to x_0^-$};
  \node[align=center] at (2.45,0.65) {$x\to x_0^+$};
  \node[red] at (1.55,2.75) {$f(x)\to L$};
\end{tikzpicture}
""",
    "line-oxyz-point-direction": r"""
\begin{tikzpicture}[>=Latex,scale=1]
  \coordinate (O) at (0,0);
  \draw[->,thick] (O) -- (4.4,0) node[right] {$x$};
  \draw[->,thick] (O) -- (-1.7,-1.25) node[left] {$y$};
  \draw[->,thick] (O) -- (0,3.4) node[above] {$z$};
  \node at (0.25,-0.28) {$O$};

  \coordinate (A) at (1.35,1.05);
  \coordinate (B) at (3.45,2.2);
  \coordinate (C) at (-0.4,0.08);

  \draw[blue,very thick] (C) -- (B) node[right] {$d$};
  \fill[red] (A) circle (2.2pt) node[above left] {$A(x_0,y_0,z_0)$};
  \draw[->,red,thick] (A) -- ++(1.25,0.7) node[midway,above] {$\vec u=(a,b,c)$};
  \draw[dashed] (A) -- (1.35,0) node[below] {$x_0$};
  \draw[dashed] (A) -- (-0.55,0.35) node[left] {$y_0$};
  \draw[dashed] (A) -- (0,1.05) node[left] {$z_0$};
  \node[align=center] at (2.55,-0.75) {$M=A+t\vec u$};
\end{tikzpicture}
""",
    "line-oxyz-parameter": r"""
\begin{tikzpicture}[>=Latex,scale=1]
  \draw[blue,very thick] (-0.3,0.2) -- (5.2,2.55) node[right] {$d$};
  \coordinate (A) at (1.2,0.85);
  \coordinate (Mone) at (2.45,1.38);
  \coordinate (Mtwo) at (3.7,1.92);
  \fill[red] (A) circle (2.2pt) node[above left] {$t=0:\ A$};
  \fill[blue] (Mone) circle (2pt) node[below right] {$t=1$};
  \fill[blue] (Mtwo) circle (2pt) node[below right] {$t=2$};
  \draw[->,red,thick] (A) -- (Mone) node[midway,above] {$\vec u$};
  \draw[->,red,thick] (Mone) -- (Mtwo) node[midway,above] {$\vec u$};
  \node[align=left] at (2.7,-0.35) {$M(t)=(x_0+at,\ y_0+bt,\ z_0+ct)$};
\end{tikzpicture}
""",
    "derivative-tangent": r"""
\begin{tikzpicture}[>=Latex,scale=1]
  \draw[->] (-0.4,0) -- (5.2,0) node[right] {$x$};
  \draw[->] (0,-0.4) -- (0,3.6) node[above] {$y$};
  \draw[domain=0.25:4.8,smooth,variable=\x,blue,thick] plot ({\x},{0.22*(\x-2.1)^2+1.15});
  \coordinate (A) at (3.35,1.49);
  \draw[red,thick] (1.2,0.95) -- (4.8,2.02) node[right] {$y=f'(x_0)(x-x_0)+f(x_0)$};
  \fill[red] (A) circle (2pt) node[above left] {$M(x_0,f(x_0))$};
  \draw[dashed] (3.35,0) node[below] {$x_0$} -- (A);
  \node[blue] at (1.2,2.7) {$y=f(x)$};
\end{tikzpicture}
""",
    "variation-table": r"""
\begin{tikzpicture}[font=\small,>=Latex]
  \draw (0,0) rectangle (8,2.7);
  \draw (0,1.8) -- (8,1.8);
  \draw (0,0.9) -- (8,0.9);
  \draw (1.4,0) -- (1.4,2.7);
  \node at (0.7,2.25) {$x$};
  \node at (0.7,1.35) {$f'(x)$};
  \node at (0.7,0.45) {$f(x)$};
  \node at (1.8,2.25) {$-\infty$};
  \node at (3.9,2.25) {$x_1$};
  \node at (5.9,2.25) {$x_2$};
  \node at (7.55,2.25) {$+\infty$};
  \node at (2.75,1.35) {$+$};
  \node at (3.9,1.35) {$0$};
  \node at (4.9,1.35) {$-$};
  \node at (5.9,1.35) {$0$};
  \node at (6.85,1.35) {$+$};
  \draw[->,thick,blue] (1.9,0.25) -- (3.55,0.7);
  \draw[->,thick,blue] (4.25,0.7) -- (5.55,0.25);
  \draw[->,thick,blue] (6.25,0.25) -- (7.55,0.7);
  \node[above,blue] at (3.9,0.72) {$f_{\max}$};
  \node[below,blue] at (5.9,0.22) {$f_{\min}$};
\end{tikzpicture}
""",
    "asymptote-graph": r"""
\begin{tikzpicture}[>=Latex,scale=0.9]
  \draw[->] (-3.3,0) -- (3.7,0) node[right] {$x$};
  \draw[->] (0,-2.4) -- (0,3.0) node[above] {$y$};
  \draw[dashed,red] (1,-2.3) -- (1,2.8) node[above] {$x=a$};
  \draw[dashed,red] (-3.2,1) -- (3.5,1) node[right] {$y=b$};
  \draw[domain=-3:-0.15,smooth,variable=\x,blue,thick] plot ({\x},{1+1/(\x-1)});
  \draw[domain=1.2:3.4,smooth,variable=\x,blue,thick] plot ({\x},{1+1/(\x-1)});
  \node[blue] at (-1.9,0.35) {$y=f(x)$};
  \node[red] at (2.55,2.35) {$\Delta_1,\Delta_2$};
\end{tikzpicture}
""",
    "integral-area": r"""
\begin{tikzpicture}[>=Latex,scale=1]
  \draw[->] (-0.3,0) -- (5.4,0) node[right] {$x$};
  \draw[->] (0,-0.3) -- (0,3.2) node[above] {$y$};
  \draw[domain=0.4:4.7,smooth,variable=\x,blue,thick] plot ({\x},{0.35+0.35*\x+0.55*sin(70*\x)});
  \path[pattern=north east lines,pattern color=blue!60]
    (1,0) -- plot[domain=1:4,smooth,variable=\x] ({\x},{0.35+0.35*\x+0.55*sin(70*\x)}) -- (4,0) -- cycle;
  \draw[dashed] (1,0) node[below] {$a$} -- (1,1.15);
  \draw[dashed] (4,0) node[below] {$b$} -- (4,1.45);
  \node at (2.7,0.65) {$S=\int_a^b f(x)\,dx$};
  \node[blue] at (4.5,2.5) {$y=f(x)$};
\end{tikzpicture}
""",
    "oxyz-axes": r"""
\begin{tikzpicture}[>=Latex,scale=1]
  \coordinate (O) at (0,0);
  \draw[->,thick] (O) -- (4,0) node[right] {$x$};
  \draw[->,thick] (O) -- (-1.5,-1.3) node[left] {$y$};
  \draw[->,thick] (O) -- (0,3.2) node[above] {$z$};
  \coordinate (A) at (2.7,1.9);
  \draw[dashed] (A) -- (2.7,0) node[below] {$x_0$};
  \draw[dashed] (A) -- (-0.7,0.6);
  \draw[dashed] (-0.7,0.6) -- (-1.1,-0.35) node[left] {$y_0$};
  \fill[blue] (A) circle (2pt) node[right] {$A(x_0,y_0,z_0)$};
  \node at (0.35,-0.25) {$O$};
\end{tikzpicture}
""",
    "plane-sphere": r"""
\begin{tikzpicture}[scale=0.95]
  \draw[fill=blue!8,draw=blue!50] (-2.4,-0.7) -- (2.5,-0.7) -- (1.5,1.0) -- (-3.2,1.0) -- cycle;
  \node[blue] at (2.1,0.65) {$(P): ax+by+cz+d=0$};
  \draw[thick,red] (0,0.2) circle (1.1);
  \draw[red,dashed] (-1.1,0.2) arc (180:360:1.1 and 0.35);
  \draw[red] (1.1,0.2) arc (0:180:1.1 and 0.35);
  \fill[red] (0,0.2) circle (1.5pt) node[below] {$I$};
  \draw[->,red] (0,0.2) -- (0.8,0.95) node[midway,right] {$R$};
  \node[red] at (0,-1.15) {$(S)$};
\end{tikzpicture}
""",
    "stats-grouped": r"""
\begin{tikzpicture}[>=Latex,scale=0.95]
  \draw[->] (0,0) -- (6.2,0) node[right] {$I_k$};
  \draw[->] (0,0) -- (0,3.4) node[above] {$n_k$};
  \foreach \x/\h in {0.5/1.1,1.5/2.0,2.5/2.8,3.5/2.2,4.5/1.5,5.5/0.9} {
    \draw[fill=blue!25,draw=blue!70] (\x,0) rectangle +(0.75,\h);
  }
  \draw[thick,red] (0.6,-0.7) -- (5.7,-0.7);
  \draw[thick,red] (1.4,-0.9) -- (1.4,-0.5) node[below=5pt] {$Q_1$};
  \draw[thick,red] (3.0,-0.9) -- (3.0,-0.5) node[below=5pt] {$Q_2$};
  \draw[thick,red] (4.5,-0.9) -- (4.5,-0.5) node[below=5pt] {$Q_3$};
  \draw[fill=red!15,draw=red] (1.4,-0.95) rectangle (4.5,-0.45);
  \node at (3,-1.35) {$\Delta_Q=Q_3-Q_1$};
\end{tikzpicture}
""",
    "probability-tree": r"""
\begin{tikzpicture}[>=Latex,level distance=1.55cm,sibling distance=2.6cm,
  every node/.style={font=\small}]
  \node[circle,draw] {$\Omega$}
    child {node[circle,draw] {$A$}
      child {node {$B$} edge from parent node[left] {$P(B|A)$}}
      child {node {$\overline B$} edge from parent node[right] {$P(\overline B|A)$}}
      edge from parent node[left] {$P(A)$}}
    child {node[circle,draw] {$\overline A$}
      child {node {$B$} edge from parent node[left] {$P(B|\overline A)$}}
      child {node {$\overline B$} edge from parent node[right] {$P(\overline B|\overline A)$}}
      edge from parent node[right] {$P(\overline A)$}};
  \node[below=2.1cm] at (0,0) {$P(A\cap B)=P(A)P(B|A)$};
\end{tikzpicture}
""",
    "solid-geometry": r"""
\begin{tikzpicture}[scale=0.95]
  \coordinate (A) at (0,0); \coordinate (B) at (3,0);
  \coordinate (C) at (3.8,1.1); \coordinate (D) at (0.8,1.1);
  \coordinate (S) at (1.8,3.0);
  \draw (A)--(B)--(C)--(D)--cycle;
  \draw (S)--(A) (S)--(B) (S)--(C) (S)--(D);
  \draw[dashed] (A)--(C) (B)--(D);
  \coordinate (H) at (1.9,0.55);
  \draw[dashed,red,thick] (S)--(H) node[midway,right] {$h$};
  \fill[red] (H) circle (1.5pt) node[below] {$H$};
  \node at (2,-0.45) {$V=\frac{1}{3}S_b\cdot h$};
\end{tikzpicture}
""",
}


def build_diagram(name: str, body: str) -> None:
    SRC.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    BUILD.mkdir(parents=True, exist_ok=True)

    tex_src = SRC / f"{name}.tex"
    tex_build = BUILD / f"{name}.tex"
    tex = PREAMBLE + body + POSTAMBLE
    tex_src.write_text(tex, encoding="utf-8")
    tex_build.write_text(tex, encoding="utf-8")

    subprocess.run(
        ["pdflatex", "--disable-installer", "-interaction=nonstopmode", tex_build.name],
        cwd=BUILD,
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    subprocess.run(
        ["dvisvgm", "--pdf", f"{name}.pdf", "-n", "-o", str(OUT / f"{name}.svg")],
        cwd=BUILD,
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def main() -> None:
    for name, body in DIAGRAMS.items():
        build_diagram(name, body)
        print(f"generated {name}.svg")


if __name__ == "__main__":
    main()

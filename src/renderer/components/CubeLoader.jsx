import { useEffect, useRef } from 'react';

export default function CubeLoader({ text = "Loading", subtext = "shuffling the cube", onComplete, isShrinking = false }) {
  const rubiksRef = useRef(null);
  const shadowRef = useRef(null);

  useEffect(() => {
    // Ensure Google Fonts are loaded for exact text styling
    if (!document.getElementById('cube-loader-fonts')) {
      const link1 = document.createElement('link');
      link1.rel = 'preconnect';
      link1.href = 'https://fonts.googleapis.com';
      const link2 = document.createElement('link');
      link2.id = 'cube-loader-fonts';
      link2.rel = 'stylesheet';
      link2.href = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700&family=Nunito:wght@400;600;800&display=swap';
      document.head.appendChild(link1);
      document.head.appendChild(link2);
    }

    const rubiks = rubiksRef.current;
    const shadow = shadowRef.current;
    if (!rubiks || !shadow) return;

    rubiks.innerHTML = '';

    // Exact sticker layout read off the provided logo artwork.
    const FINAL = {
      top: [
        ['blue','yellow','blue'],
        ['yellow','pink','yellow'],
        ['blue','yellow','blue']
      ],
      front: [
        ['green','yellow','green'],
        ['green','green','green'],
        ['green','yellow','green']
      ],
      right: [
        ['yellow','green','yellow'],
        ['green','yellow','green'],
        ['green','yellow','green']
      ],
      back: [
        ['green','blue','yellow'],
        ['yellow','green','blue'],
        ['blue','yellow','green']
      ],
      left: [
        ['blue','green','yellow'],
        ['green','yellow','blue'],
        ['yellow','blue','green']
      ],
      bottom: [
        ['yellow','blue','green'],
        ['blue','green','yellow'],
        ['green','yellow','blue']
      ]
    };

    // Maps a cubie's (i,j,k) grid position -> (row,col) on each macro-face's 3x3 sticker grid.
    const FACE_RC = {
      top:    (i,j,k) => ({ row:k,   col:i   }),
      front:  (i,j,k) => ({ row:j,   col:i   }),
      right:  (i,j,k) => ({ row:j,   col:2-k }),
      back:   (i,j,k) => ({ row:j,   col:2-i }),
      left:   (i,j,k) => ({ row:j,   col:k   }),
      bottom: (i,j,k) => ({ row:2-k, col:i   })
    };

    // Inverse of FACE_RC: given a face + (row,col), recover the (i,j,k) grid slot.
    const FACE_RC_INV = {
      top:    (row,col) => ({ i:col,   j:0,     k:row   }),
      front:  (row,col) => ({ i:col,   j:row,   k:2     }),
      right:  (row,col) => ({ i:2,     j:row,   k:2-col }),
      back:   (row,col) => ({ i:2-col, j:row,   k:0     }),
      left:   (row,col) => ({ i:0,     j:row,   k:col   }),
      bottom: (row,col) => ({ i:col,   j:2,     k:2-row })
    };

    const FACES = ['top','front','right','back','left','bottom'];

    const NORMAL = {
      top:    { x:0, y:-1, z:0 },
      bottom: { x:0, y:1,  z:0 },
      front:  { x:0, y:0,  z:1 },
      back:   { x:0, y:0,  z:-1 },
      left:   { x:-1, y:0, z:0 },
      right:  { x:1, y:0,  z:0 }
    };

    function nameFromVec(v){
      for (let i = 0; i < FACES.length; i++){
        const n = NORMAL[FACES[i]];
        if (n.x === v.x && n.y === v.y && n.z === v.z) return FACES[i];
      }
      return null;
    }

    function rotateVec(axis, dir, v){
      if (axis === 'X') return { x: v.x, y: -dir * v.z, z: dir * v.y };
      if (axis === 'Y') return { x: dir * v.z, y: v.y, z: -dir * v.x };
      return { x: -dir * v.y, y: dir * v.x, z: v.z };
    }

    function cloneState(s){
      const out = {};
      FACES.forEach((f) => {
        out[f] = s[f].map((row) => row.slice());
      });
      return out;
    }

    const cubies = [];
    function axisSign(dim){ return dim === 0 ? -1 : (dim === 2 ? 1 : 0); }

    function buildCube(){
      for (let i = 0; i < 3; i++){
        for (let j = 0; j < 3; j++){
          for (let k = 0; k < 3; k++){
            if (i === 1 && j === 1 && k === 1) continue;

            const el = document.createElement('div');
            el.className = 'cubie';
            el.style.transform =
              'translate3d(' +
              'calc(var(--cubie) * ' + axisSign(i) + '), ' +
              'calc(var(--cubie) * ' + axisSign(j) + '), ' +
              'calc(var(--cubie) * ' + axisSign(k) + '))';

            const faceKeys = [];
            if (j === 0) faceKeys.push('top');
            if (j === 2) faceKeys.push('bottom');
            if (k === 2) faceKeys.push('front');
            if (k === 0) faceKeys.push('back');
            if (i === 0) faceKeys.push('left');
            if (i === 2) faceKeys.push('right');

            const faceEls = {};
            faceKeys.forEach((fk) => {
              const faceBox = document.createElement('div');
              faceBox.className = 'f-' + fk;
              const plate = document.createElement('div');
              plate.className = 'plate';
              const sticker = document.createElement('div');
              sticker.className = 'sticker';
              faceBox.appendChild(plate);
              faceBox.appendChild(sticker);
              el.appendChild(faceBox);
              faceEls[fk] = sticker;
            });

            rubiks.appendChild(el);
            cubies.push({ i, j, k, el, faces: faceEls });
          }
        }
      }
    }

    function paint(layout){
      cubies.forEach((c) => {
        Object.keys(c.faces).forEach((fk) => {
          const rc = FACE_RC[fk](c.i, c.j, c.k);
          const color = layout[fk][rc.row][rc.col];
          c.faces[fk].style.setProperty('--cell-color', 'var(--' + color + ')');
        });
      });
    }

    const MOVES = {
      U: { axis:'Y', test: (c) => c.j === 0 },
      D: { axis:'Y', test: (c) => c.j === 2 },
      L: { axis:'X', test: (c) => c.i === 0 },
      R: { axis:'X', test: (c) => c.i === 2 },
      F: { axis:'Z', test: (c) => c.k === 2 },
      B: { axis:'Z', test: (c) => c.k === 0 }
    };
    const MOVE_KEYS = Object.keys(MOVES);

    function applyMove(state, moveKey, dir){
      const move = MOVES[moveKey];
      const next = cloneState(state);

      FACES.forEach((face) => {
        for (let row = 0; row < 3; row++){
          for (let col = 0; col < 3; col++){
            const pos = FACE_RC_INV[face](row, col);
            if (!move.test(pos)) continue;

            const v = { x: pos.i - 1, y: pos.j - 1, z: pos.k - 1 };
            const nv = rotateVec(move.axis, dir, v);
            const newPos = { i: nv.x + 1, j: nv.y + 1, k: nv.z + 1 };

            const nn = rotateVec(move.axis, dir, NORMAL[face]);
            const newFace = nameFromVec(nn);

            const rc = FACE_RC[newFace](newPos.i, newPos.j, newPos.k);
            next[newFace][rc.row][rc.col] = state[face][row][col];
          }
        }
      });

      return next;
    }

    function performTurn(moveKey, dir, duration){
      return new Promise((resolve) => {
        const move = MOVES[moveKey];
        const group = document.createElement('div');
        group.className = 'turn-group';
        rubiks.appendChild(group);

        const layerCubies = cubies.filter(move.test);
        layerCubies.forEach((c) => { group.appendChild(c.el); });

        // force reflow
        void group.getBoundingClientRect();

        group.style.transition = 'transform ' + duration + 'ms cubic-bezier(.65,.05,.36,1)';

        requestAnimationFrame(() => {
          group.style.transform = 'rotate' + move.axis + '(' + (dir * 90) + 'deg)';
        });

        setTimeout(() => {
          layerCubies.forEach((c) => { rubiks.appendChild(c.el); });
          group.remove();
          resolve();
        }, duration + 30);
      });
    }

    let isMounted = true;

    async function shuffleSequence(){
      if (!isMounted) return;
      shadow.style.opacity = '0.55';
      shadow.style.transform = 'scale(0.85)';

      let state = cloneState(FINAL);
      const history = [];

      const scrambleMoves = 7;
      for (let n = 0; n < scrambleMoves; n++){
        if (!isMounted) return;
        const mv = MOVE_KEYS[Math.floor(Math.random() * MOVE_KEYS.length)];
        const dir = Math.random() < 0.5 ? 1 : -1;
        history.push({ mv, dir });

        await performTurn(mv, dir, 150);
        state = applyMove(state, mv, dir);
        paint(state);
      }

      for (let m = history.length - 1; m >= 0; m--){
        if (!isMounted) return;
        const inv = -history[m].dir;
        await performTurn(history[m].mv, inv, 134);
        state = applyMove(state, history[m].mv, inv);
        paint(state);
      }

      if (!isMounted) return;
      rubiks.classList.add('settling');
      shadow.style.opacity = '1';
      shadow.style.transform = 'scale(1)';

      setTimeout(() => {
        if (rubiks) rubiks.classList.remove('settling');
        if (onComplete && isMounted) {
          onComplete();
        }
      }, 534);
    }

    async function loop(){
      if (!isMounted) return;
      await shuffleSequence();
      if (isMounted) {
        setTimeout(loop, 1250);
      }
    }

    buildCube();

    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce){
      paint(FINAL);
      shadow.style.opacity = '1';
      shadow.style.transform = 'scale(1)';
      if (onComplete && isMounted) onComplete();
    } else {
      loop();
    }

    return () => {
      isMounted = false;
    };
  }, [onComplete]);

  return (
    <div className={`cube-loader-wrapper ${isShrinking ? 'shrinking' : ''}`}>
      <style>{`
        .cube-loader-wrapper {
          --bg:        #E9F0E6;
          --outline:   #3A4650;
          --green:     #A2CD9F;
          --yellow:    #F8E8A7;
          --blue:      #B7E4F8;
          --pink:      #ECC6D5;
          --ink:       #2C3640;
          --card:      #FFFFFF;

          --cube: clamp(150px, 22vw, 220px);
          --cubie: calc(var(--cube) / 3);
          --half: calc(var(--cubie) / 2);

          position: fixed;
          inset: 0;
          z-index: 9999;
          background: var(--bg);
          font-family: 'Nunito', system-ui, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: clamp(28px, 5vh, 48px);
          overflow: hidden;
          transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.7s ease-in-out, background 0.7s ease;
        }

        .cube-loader-wrapper.shrinking {
          transform: translateY(-38vh) scale(0.32);
          opacity: 0;
          background: transparent;
          pointer-events: none;
        }

        .cube-loader-wrapper .card {
          position: relative;
          width: calc(var(--cube) * 2.05);
          height: calc(var(--cube) * 2.05);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cube-loader-wrapper .shadow {
          position: absolute;
          bottom: calc(var(--cube) * 0.16);
          width: calc(var(--cube) * 1.35);
          height: calc(var(--cube) * 0.26);
          background: radial-gradient(closest-side, rgba(58,70,80,0.28), rgba(58,70,80,0));
          border-radius: 50%;
          filter: blur(1px);
          opacity: 0.55;
          transform: scale(0.85);
          transition: transform .5s ease, opacity .5s ease;
        }

        .cube-loader-wrapper .scene {
          perspective: 1400px;
          width: var(--cube);
          height: var(--cube);
        }

        .cube-loader-wrapper .iso-view {
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transform: rotateX(-18deg) rotateY(-34deg);
        }

        .cube-loader-wrapper .rubiks {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
        }

        .cube-loader-wrapper .rubiks.settling {
          animation: settle .51s cubic-bezier(.22,1.8,.4,1) 1;
        }

        @keyframes settle {
          0%   { transform: scale3d(1,1,1) rotateZ(0deg); }
          45%  { transform: scale3d(1.12,1.12,1.12) rotateZ(-6deg); }
          70%  { transform: scale3d(0.96,0.96,0.96) rotateZ(3deg); }
          100% { transform: scale3d(1,1,1) rotateZ(0deg); }
        }

        .cube-loader-wrapper .turn-group {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          transform-style: preserve-3d;
          will-change: transform;
        }

        .cube-loader-wrapper .plate {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: var(--outline);
          transform: translateZ(calc(var(--cubie) * -0.09));
        }

        .cube-loader-wrapper .cubie {
          position: absolute;
          top: 50%; left: 50%;
          width: var(--cubie);
          height: var(--cubie);
          margin-top: calc(var(--cubie) * -0.5);
          margin-left: calc(var(--cubie) * -0.5);
          transform-style: preserve-3d;
          will-change: transform;
        }

        .cube-loader-wrapper .sticker {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          inset: 0;
          border-radius: calc(var(--cubie) * 0.14);
          border: calc(var(--cubie) * 0.045) solid var(--outline);
          background-color: var(--cell-color, var(--green));
          box-shadow: inset 0 3px 0 rgba(255,255,255,0.35),
                      inset 0 -4px 0 rgba(0,0,0,0.10);
          background-clip: padding-box;
        }

        .cube-loader-wrapper .f-top    { transform: rotateX(90deg)  translateZ(var(--half)); position: absolute; top:0; left:0; width:100%; height:100%; }
        .cube-loader-wrapper .f-front  { transform: translateZ(var(--half)); position: absolute; top:0; left:0; width:100%; height:100%; }
        .cube-loader-wrapper .f-right  { transform: rotateY(90deg)  translateZ(var(--half)); position: absolute; top:0; left:0; width:100%; height:100%; }
        .cube-loader-wrapper .f-back   { transform: rotateY(180deg) translateZ(var(--half)); position: absolute; top:0; left:0; width:100%; height:100%; }
        .cube-loader-wrapper .f-left   { transform: rotateY(-90deg) translateZ(var(--half)); position: absolute; top:0; left:0; width:100%; height:100%; }
        .cube-loader-wrapper .f-bottom { transform: rotateX(-90deg) translateZ(var(--half)); position: absolute; top:0; left:0; width:100%; height:100%; }

        .cube-loader-wrapper .label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          transition: opacity 0.3s ease;
        }

        .cube-loader-wrapper.shrinking .label {
          opacity: 0;
        }

        .cube-loader-wrapper .label .word {
          font-family: 'Baloo 2', 'Nunito', sans-serif;
          font-weight: 700;
          font-size: clamp(20px, 2.6vw, 26px);
          color: var(--ink);
          letter-spacing: 0.02em;
          display: flex;
          align-items: baseline;
          gap: 2px;
        }

        .cube-loader-wrapper .dots span {
          animation: blink 1.4s infinite;
          opacity: 0;
        }
        .cube-loader-wrapper .dots span:nth-child(1) { animation-delay: 0s; }
        .cube-loader-wrapper .dots span:nth-child(2) { animation-delay: .18s; }
        .cube-loader-wrapper .dots span:nth-child(3) { animation-delay: .36s; }

        @keyframes blink {
          0%, 20%   { opacity: 0; }
          40%, 60%  { opacity: 1; }
          100%      { opacity: 0; }
        }

        .cube-loader-wrapper .sub {
          font-size: clamp(12px, 1.4vw, 14px);
          font-weight: 600;
          color: var(--outline);
          opacity: 0.55;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
      `}</style>

      <div className="card">
        <div className="shadow" ref={shadowRef}></div>
        <div className="scene">
          <div className="iso-view">
            <div className="rubiks" ref={rubiksRef}></div>
          </div>
        </div>
      </div>

      <div className="label">
        <div className="word">
          {text}
          <span className="dots">
            <span>.</span><span>.</span><span>.</span>
          </span>
        </div>
        <div className="sub">{subtext}</div>
      </div>
    </div>
  );
}
